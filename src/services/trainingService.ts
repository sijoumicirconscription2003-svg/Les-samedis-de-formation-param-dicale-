import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { TrainingSession, Registration, UserProfile } from '../types';
import { sendNotification } from './notificationService';

export const DEFAULT_TRAINING_LOCATION = 'Salle de réunion du Centre Intermédiaire Ali Trad';

// Real-time listener for all trainings (or filtered)
export function listenTrainings(callback: (trainings: TrainingSession[]) => void) {
  const q = query(collection(db, 'trainings'), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: TrainingSession[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TrainingSession, 'id'>),
      }));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trainings');
    }
  );
}

// Generate unique random alphanumeric token
function generateSecretToken(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new training session
export async function createTraining(
  data: Omit<
    TrainingSession,
    | 'id'
    | 'placesReservees'
    | 'placesRestantes'
    | 'nbListeAttente'
    | 'cleSecreteArrivee'
    | 'cleSecreteSortie'
    | 'sessionNonce'
    | 'createdAt'
    | 'updatedAt'
  >,
  adminUid: string
): Promise<string> {
  const now = new Date().toISOString();
  const trainingRef = doc(collection(db, 'trainings'));
  const capacite = Number(data.capaciteMax) || 25;

  const newTraining: TrainingSession = {
    ...data,
    id: trainingRef.id,
    capaciteMax: capacite,
    placesReservees: 0,
    placesRestantes: capacite,
    nbListeAttente: 0,
    cleSecreteArrivee: generateSecretToken(20),
    cleSecreteSortie: generateSecretToken(20),
    sessionNonce: generateSecretToken(12),
    creePar: adminUid,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(trainingRef, newTraining);
    });
    return trainingRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `trainings/${trainingRef.id}`);
  }
}

// Update training details
export async function updateTraining(
  trainingId: string,
  data: Partial<TrainingSession>
): Promise<void> {
  const trainingRef = doc(db, 'trainings', trainingId);
  try {
    await updateDoc(trainingRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `trainings/${trainingId}`);
  }
}

// Delete training
export async function deleteTraining(trainingId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'trainings', trainingId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trainings/${trainingId}`);
  }
}

// Toggle check-in windows (Arrivée / Sortie)
export async function toggleCheckinStatus(
  trainingId: string,
  type: 'arrivee' | 'sortie',
  isOpen: boolean
): Promise<void> {
  const trainingRef = doc(db, 'trainings', trainingId);
  const updatePayload =
    type === 'arrivee'
      ? { pointageArriveeOuvert: isOpen, updatedAt: new Date().toISOString() }
      : { pointageSortieOuvert: isOpen, updatedAt: new Date().toISOString() };

  try {
    await updateDoc(trainingRef, updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `trainings/${trainingId}`);
  }
}

// Regenerate session nonce for anti-screenshot protection
export async function rotateSessionNonce(trainingId: string): Promise<string> {
  const newNonce = generateSecretToken(12);
  const trainingRef = doc(db, 'trainings', trainingId);
  try {
    await updateDoc(trainingRef, {
      sessionNonce: newNonce,
      updatedAt: new Date().toISOString(),
    });
    return newNonce;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `trainings/${trainingId}`);
  }
}

/**
 * ATOMIC FIRESTORE RESERVATION TRANSACTION
 * Strictly ensures:
 * 1. No race condition when reserving the last available seat.
 * 2. Absolute uniqueness via deterministic doc ID (`${trainingId}_${userId}`).
 * 3. Automatic waitlist placement when full.
 * 4. Automatic promotion of waitlist on cancellation.
 */
export async function bookTrainingAtomic(
  trainingId: string,
  user: UserProfile
): Promise<{ status: 'CONFIRMEE' | 'LISTE_ATTENTE'; reservationNumber: string; waitlistPosition?: number }> {
  const trainingRef = doc(db, 'trainings', trainingId);
  const registrationDocId = `${trainingId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', registrationDocId);
  const now = new Date().toISOString();

  let resultStatus: 'CONFIRMEE' | 'LISTE_ATTENTE' = 'CONFIRMEE';
  let reservationNumber = '';
  let waitlistPosition: number | undefined;

  try {
    await runTransaction(db, async (transaction) => {
      const trainingDoc = await transaction.get(trainingRef);
      if (!trainingDoc.exists()) {
        throw new Error('Formation introuvable');
      }

      const trainingData = trainingDoc.data() as TrainingSession;

      if (!trainingData.estPublie) {
        throw new Error("Cette formation n'est pas encore ouverte aux inscriptions.");
      }

      if (trainingData.statut === 'annulee' || trainingData.statut === 'cloturee') {
        throw new Error('Les inscriptions pour cette formation sont clôturées ou annulées.');
      }

      // Check registration deadline if set
      if (trainingData.dateLimiteInscription) {
        const deadline = new Date(trainingData.dateLimiteInscription).getTime();
        if (Date.now() > deadline) {
          throw new Error("La date limite d'inscription est dépassée.");
        }
      }

      // Check if user already registered
      const existingRegDoc = await transaction.get(registrationRef);
      if (existingRegDoc.exists()) {
        const existingReg = existingRegDoc.data() as Registration;
        if (existingReg.statut === 'CONFIRMEE') {
          throw new Error('Vous avez déjà une place CONFIRMÉE pour cette formation.');
        } else if (existingReg.statut === 'LISTE_ATTENTE') {
          throw new Error('Vous êtes déjà inscrit sur la LISTE D’ATTENTE pour cette formation.');
        }
      }

      const currentReserved = trainingData.placesReservees || 0;
      const maxCap = trainingData.capaciteMax || 25;

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      reservationNumber = `RES-${new Date().getFullYear()}-AT-${randomDigits}`;

      if (currentReserved < maxCap) {
        // Seat available! Confirm seat immediately
        resultStatus = 'CONFIRMEE';
        const newReserved = currentReserved + 1;
        const newRemaining = Math.max(0, maxCap - newReserved);

        transaction.update(trainingRef, {
          placesReservees: newReserved,
          placesRestantes: newRemaining,
          updatedAt: now,
        });

        const newRegistration: Registration = {
          id: registrationDocId,
          trainingId,
          userId: user.uid,
          nom: user.nom,
          prenom: user.prenom,
          matricule: user.matricule,
          fonction: user.fonction,
          etablissement: user.etablissement,
          email: user.email,
          telephone: user.telephone || '',
          numeroReservation: reservationNumber,
          statut: 'CONFIRMEE',
          pointageArriveeValide: false,
          pointageSortieValide: false,
          presenceFinale: 'ABSENT',
          createdAt: now,
          updatedAt: now,
        };

        transaction.set(registrationRef, newRegistration);
      } else {
        // Capacity reached! Put on waitlist
        resultStatus = 'LISTE_ATTENTE';
        const currentWaitlist = trainingData.nbListeAttente || 0;
        const newWaitlist = currentWaitlist + 1;
        waitlistPosition = newWaitlist;

        transaction.update(trainingRef, {
          nbListeAttente: newWaitlist,
          updatedAt: now,
        });

        const waitlistRegistration: Registration = {
          id: registrationDocId,
          trainingId,
          userId: user.uid,
          nom: user.nom,
          prenom: user.prenom,
          matricule: user.matricule,
          fonction: user.fonction,
          etablissement: user.etablissement,
          email: user.email,
          telephone: user.telephone || '',
          numeroReservation: reservationNumber,
          statut: 'LISTE_ATTENTE',
          positionAttente: waitlistPosition,
          pointageArriveeValide: false,
          pointageSortieValide: false,
          presenceFinale: 'ABSENT',
          createdAt: now,
          updatedAt: now,
        };

        transaction.set(registrationRef, waitlistRegistration);
      }
    });

    // Send in-app notification to participant
    if (resultStatus === 'CONFIRMEE') {
      await sendNotification(
        user.uid,
        'Inscription Confirmée',
        `Félicitations ! Votre place est réservée pour la formation (Réf: ${reservationNumber}).`,
        'reservation_confirmee',
        trainingId
      );
    } else {
      await sendNotification(
        user.uid,
        'Inscription sur Liste d’Attente',
        `Vous êtes en position n°${waitlistPosition} sur la liste d'attente. Vous serez automatiquement promu en cas de désistement.`,
        'promotion_attente',
        trainingId
      );
    }

    return { status: resultStatus, reservationNumber, waitlistPosition };
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `registrations/${registrationDocId}`);
  }
}

/**
 * CANCEL RESERVATION
 * Automatically frees the seat and promotes the next participant on the waitlist!
 */
export async function cancelRegistration(
  trainingId: string,
  userId: string
): Promise<void> {
  const trainingRef = doc(db, 'trainings', trainingId);
  const registrationDocId = `${trainingId}_${userId}`;
  const registrationRef = doc(db, 'registrations', registrationDocId);
  const now = new Date().toISOString();

  let promotedUserId: string | null = null;
  let promotedUserDocId: string | null = null;
  let promotedUserNewRefNum = '';

  try {
    await runTransaction(db, async (transaction) => {
      const regDoc = await transaction.get(registrationRef);
      if (!regDoc.exists()) {
        throw new Error('Réservation introuvable');
      }

      const regData = regDoc.data() as Registration;
      if (regData.statut === 'ANNULEE') {
        return; // Already cancelled
      }

      const wasConfirmed = regData.statut === 'CONFIRMEE';

      // Mark this registration as cancelled
      transaction.update(registrationRef, {
        statut: 'ANNULEE',
        updatedAt: now,
      });

      const trainingDoc = await transaction.get(trainingRef);
      if (!trainingDoc.exists()) return;

      const trainingData = trainingDoc.data() as TrainingSession;

      if (wasConfirmed) {
        // Free seat
        const currentReserved = trainingData.placesReservees || 0;
        const newReserved = Math.max(0, currentReserved - 1);
        const newRemaining = Math.max(0, (trainingData.capaciteMax || 25) - newReserved);

        transaction.update(trainingRef, {
          placesReservees: newReserved,
          placesRestantes: newRemaining,
          updatedAt: now,
        });
      } else if (regData.statut === 'LISTE_ATTENTE') {
        const currentWaitlist = trainingData.nbListeAttente || 0;
        transaction.update(trainingRef, {
          nbListeAttente: Math.max(0, currentWaitlist - 1),
          updatedAt: now,
        });
      }
    });

    // Check if there's someone in waitlist to automatically promote to the freed seat!
    // We execute promotion query
    const waitlistQuery = query(
      collection(db, 'registrations'),
      where('trainingId', '==', trainingId),
      where('statut', '==', 'LISTE_ATTENTE'),
      orderBy('createdAt', 'asc')
    );
    const waitlistSnapshot = await getDocs(waitlistQuery);

    if (!waitlistSnapshot.empty) {
      const firstCandidate = waitlistSnapshot.docs[0];
      promotedUserId = firstCandidate.data().userId;
      promotedUserDocId = firstCandidate.id;
      promotedUserNewRefNum = firstCandidate.data().numeroReservation;

      // Promote first candidate atomically
      await runTransaction(db, async (transaction) => {
        const trainingDoc = await transaction.get(trainingRef);
        if (!trainingDoc.exists()) return;
        const trainingData = trainingDoc.data() as TrainingSession;

        const candidateDoc = await transaction.get(doc(db, 'registrations', promotedUserDocId!));
        if (!candidateDoc.exists() || candidateDoc.data().statut !== 'LISTE_ATTENTE') return;

        const currentReserved = trainingData.placesReservees || 0;
        const maxCap = trainingData.capaciteMax || 25;

        if (currentReserved < maxCap) {
          const newReserved = currentReserved + 1;
          const newRemaining = Math.max(0, maxCap - newReserved);
          const newWaitlist = Math.max(0, (trainingData.nbListeAttente || 1) - 1);

          transaction.update(trainingRef, {
            placesReservees: newReserved,
            placesRestantes: newRemaining,
            nbListeAttente: newWaitlist,
            updatedAt: new Date().toISOString(),
          });

          // Expire in 24 hours if not attended
          const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

          transaction.update(doc(db, 'registrations', promotedUserDocId!), {
            statut: 'CONFIRMEE',
            positionAttente: 0,
            promuLe: new Date().toISOString(),
            dateExpirationPromotion: expiration,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      if (promotedUserId) {
        await sendNotification(
          promotedUserId,
          'Bonne nouvelle : Place disponible confirmée !',
          `Une place s'est libérée suite à une annulation. Votre réservation est maintenant CONFIRMÉE (Réf: ${promotedUserNewRefNum}).`,
          'promotion_attente',
          trainingId
        );
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `registrations/${registrationDocId}`);
  }
}

// Listen to user's personal registrations
export function listenUserRegistrations(
  userId: string,
  callback: (registrations: Registration[]) => void
) {
  const q = query(
    collection(db, 'registrations'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Registration[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Registration, 'id'>),
      }));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'registrations');
    }
  );
}

// Listen to all registrations for a specific training (for Admin Roster & Statistics)
export function listenTrainingRegistrations(
  trainingId: string,
  callback: (registrations: Registration[]) => void
) {
  const q = query(
    collection(db, 'registrations'),
    where('trainingId', '==', trainingId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Registration[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Registration, 'id'>),
      }));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `registrations/training/${trainingId}`);
    }
  );
}
