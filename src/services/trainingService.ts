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
  writeBatch,
  addDoc,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { TrainingSession, Registration, UserProfile, FormateurItem } from '../types';
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
  const capacite = Number(data.capaciteMax) || 32;

  const newTraining: TrainingSession = {
    ...data,
    formateur: data.formateur || '',
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

// Update trainers for a specific training session
export async function updateTrainingTrainers(
  trainingId: string,
  trainers: FormateurItem[]
): Promise<void> {
  const aggregatedName = trainers.map((t) => t.nom.trim()).filter(Boolean).join(' & ');
  const aggregatedQuality = trainers
    .map((t) => t.qualite?.trim())
    .filter(Boolean)
    .join(' / ');

  await updateTraining(trainingId, {
    formateurs: trainers,
    formateur: aggregatedName,
    qualiteFormateur: aggregatedQuality,
  });
}

// Add a trainer to a training session
export async function addTrainerToTraining(
  trainingId: string,
  newTrainer: FormateurItem,
  existingTrainers: FormateurItem[] = []
): Promise<void> {
  const updated = [...existingTrainers, newTrainer];
  await updateTrainingTrainers(trainingId, updated);
}

// Remove a trainer from a training session by index
export async function removeTrainerFromTraining(
  trainingId: string,
  trainerIndex: number,
  existingTrainers: FormateurItem[] = []
): Promise<void> {
  const updated = existingTrainers.filter((_, idx) => idx !== trainerIndex);
  await updateTrainingTrainers(trainingId, updated);
}

// Apply a trainer list to multiple (or all remaining) trainings
export async function applyTrainersToMultipleTrainings(
  trainingIds: string[],
  trainers: FormateurItem[]
): Promise<void> {
  const aggregatedName = trainers.map((t) => t.nom.trim()).filter(Boolean).join(' & ');
  const aggregatedQuality = trainers
    .map((t) => t.qualite?.trim())
    .filter(Boolean)
    .join(' / ');

  const batch = writeBatch(db);
  trainingIds.forEach((id) => {
    const ref = doc(db, 'trainings', id);
    batch.update(ref, {
      formateurs: trainers,
      formateur: aggregatedName,
      qualiteFormateur: aggregatedQuality,
      updatedAt: new Date().toISOString(),
    });
  });
  await batch.commit();
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
      const maxCap = trainingData.capaciteMax || 32;

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
        const newRemaining = Math.max(0, (trainingData.capaciteMax || 32) - newReserved);

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
        const maxCap = trainingData.capaciteMax || 32;

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

export interface PublicRegistrationPayload {
  trainingId: string;
  nom: string;
  prenom: string;
  profession: string;
  etablissement: string;
  circonscription: string;
  telephone: string;
}

export interface PublicRegistrationResult {
  status: 'CONFIRMEE' | 'LISTE_ATTENTE';
  reservationNumber: string;
  registration: Registration;
  waitlistPosition?: number;
  placesRestantes: number;
  placesReservees: number;
}

/**
 * Normalizes a phone number (e.g. cleans whitespace, international +216 prefix)
 */
export function normalizePhoneNumber(raw: string): string {
  let cleaned = (raw || '').replace(/\D/g, '');
  if (cleaned.startsWith('216') && cleaned.length === 11) {
    cleaned = cleaned.substring(3);
  }
  return cleaned;
}

/**
 * Audit log logger
 */
export async function logAuditAction(
  adminEmail: string,
  action: string,
  details: string,
  cibleId = ''
): Promise<void> {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      adminId: 'admin',
      adminEmail: adminEmail || 'sijoumicirconscription2003@gmail.com',
      cibleType: 'training_registration',
      cibleId,
      details,
      horodatage: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Audit log write error (non-blocking):', e);
  }
}

/**
 * ATOMIC FIRESTORE PUBLIC REGISTRATION
 * Accessible without authentication.
 * 1. Checks mandatory fields: nom, prenom, profession, etablissement, circonscription, telephone
 * 2. Checks phone number formatting
 * 3. Anti-duplicate verification (phone + trainingId, deterministic ID)
 * 4. Atomic capacity evaluation (32 normal, 35 if autoriserPlacesSupp is active)
 * 5. Automatic waitlist placement if full
 * 6. Thread-safe Firestore runTransaction guarantees zero overbooking
 */
export async function bookPublicTrainingAtomic(
  payload: PublicRegistrationPayload
): Promise<PublicRegistrationResult> {
  const nomClean = (payload.nom || '').trim();
  const prenomClean = (payload.prenom || '').trim();
  const professionClean = (payload.profession || '').trim();
  const etablissementClean = (payload.etablissement || '').trim();
  const circonscriptionClean = (payload.circonscription || '').trim();
  const rawPhone = (payload.telephone || '').trim();
  const cleanPhone = normalizePhoneNumber(rawPhone);

  // Field validations
  if (!nomClean) throw new Error('Le nom est obligatoire.');
  if (!prenomClean) throw new Error('Le prénom est obligatoire.');
  if (!professionClean) throw new Error('La profession / fonction est obligatoire.');
  if (!etablissementClean) throw new Error("L'établissement de santé est obligatoire.");
  if (!circonscriptionClean) throw new Error('La circonscription sanitaire est obligatoire.');
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Le numéro de téléphone est invalide. Veuillez saisir un numéro valide (au moins 8 chiffres).');
  }

  const trainingRef = doc(db, 'trainings', payload.trainingId);
  // Deterministic anti-duplicate doc ID per training and phone
  const registrationDocId = `${payload.trainingId}_tel_${cleanPhone}`;
  const registrationRef = doc(db, 'registrations', registrationDocId);
  const now = new Date().toISOString();

  let finalStatus: 'CONFIRMEE' | 'LISTE_ATTENTE' = 'CONFIRMEE';
  let reservationNumber = '';
  let waitlistPosition: number | undefined;
  let remainingSeatsAfter = 0;
  let reservedSeatsAfter = 0;
  let createdRegistration: Registration | null = null;

  try {
    await runTransaction(db, async (transaction) => {
      const trainingDoc = await transaction.get(trainingRef);
      if (!trainingDoc.exists()) {
        throw new Error('Formation introuvable');
      }

      const trainingData = trainingDoc.data() as TrainingSession;

      // Check if registration is administratively closed
      if (trainingData.inscriptionsFermees) {
        throw new Error('Les inscriptions pour cette formation sont actuellement fermées par la direction.');
      }

      if (trainingData.statut === 'annulee' || trainingData.statut === 'cloturee') {
        throw new Error('Les inscriptions pour cette formation sont clôturées.');
      }

      // Check registration deadline if set
      if (trainingData.dateLimiteInscription) {
        const deadline = new Date(trainingData.dateLimiteInscription).getTime();
        if (Date.now() > deadline) {
          throw new Error("La date limite d'inscription est dépassée.");
        }
      }

      // Check if this phone number already registered for this training
      const existingRegDoc = await transaction.get(registrationRef);
      if (existingRegDoc.exists()) {
        const existingReg = existingRegDoc.data() as Registration;
        if (existingReg.statut === 'CONFIRMEE') {
          throw new Error(
            `Ce numéro de téléphone (${rawPhone}) possède déjà une inscription CONFIRMÉE (Réf: ${existingReg.numeroReservation}).`
          );
        } else if (existingReg.statut === 'LISTE_ATTENTE') {
          throw new Error(
            `Ce numéro de téléphone (${rawPhone}) est déjà enregistré sur la LISTE D’ATTENTE (Position #${existingReg.positionAttente}).`
          );
        }
      }

      // Calculate effective capacity:
      // Normal: 32 (or trainingData.capaciteNormale)
      // If autoriserPlacesSupp === true: 35 (or trainingData.capaciteMaxAutorisee)
      const capaciteNormale = Number(trainingData.capaciteNormale) || 32;
      const capaciteMaxAutorisee = Number(trainingData.capaciteMaxAutorisee) || 35;
      const autoriserPlacesSupp = Boolean(trainingData.autoriserPlacesSupp);
      const effectiveCap = autoriserPlacesSupp ? capaciteMaxAutorisee : capaciteNormale;

      const currentReserved = Number(trainingData.placesReservees) || 0;
      const currentWaitlist = Number(trainingData.nbListeAttente) || 0;

      const randDigits = Math.floor(1000 + Math.random() * 9000);
      reservationNumber = `RES-2026-AT-${randDigits}`;

      if (currentReserved < effectiveCap) {
        // Seat available!
        finalStatus = 'CONFIRMEE';
        const newReserved = currentReserved + 1;
        const newRemaining = Math.max(0, effectiveCap - newReserved);
        reservedSeatsAfter = newReserved;
        remainingSeatsAfter = newRemaining;

        transaction.update(trainingRef, {
          placesReservees: newReserved,
          placesRestantes: newRemaining,
          updatedAt: now,
        });

        const newReg: Registration = {
          id: registrationDocId,
          trainingId: payload.trainingId,
          userId: `pub_${cleanPhone}`,
          nom: nomClean,
          prenom: prenomClean,
          matricule: 'EXT-' + cleanPhone.slice(-4),
          fonction: professionClean,
          profession: professionClean,
          etablissement: etablissementClean,
          circonscription: circonscriptionClean,
          email: '',
          telephone: rawPhone,
          numeroReservation: reservationNumber,
          statut: 'CONFIRMEE',
          pointageArriveeValide: false,
          pointageSortieValide: false,
          presenceFinale: 'ABSENT',
          createdAt: now,
          updatedAt: now,
        };

        transaction.set(registrationRef, newReg);
        createdRegistration = newReg;
      } else {
        // Capacity reached: Place on waitlist
        finalStatus = 'LISTE_ATTENTE';
        const newWaitlist = currentWaitlist + 1;
        waitlistPosition = newWaitlist;
        reservedSeatsAfter = currentReserved;
        remainingSeatsAfter = 0;

        transaction.update(trainingRef, {
          nbListeAttente: newWaitlist,
          placesRestantes: 0,
          updatedAt: now,
        });

        const waitlistReg: Registration = {
          id: registrationDocId,
          trainingId: payload.trainingId,
          userId: `pub_${cleanPhone}`,
          nom: nomClean,
          prenom: prenomClean,
          matricule: 'EXT-' + cleanPhone.slice(-4),
          fonction: professionClean,
          profession: professionClean,
          etablissement: etablissementClean,
          circonscription: circonscriptionClean,
          email: '',
          telephone: rawPhone,
          numeroReservation: reservationNumber,
          statut: 'LISTE_ATTENTE',
          positionAttente: waitlistPosition,
          pointageArriveeValide: false,
          pointageSortieValide: false,
          presenceFinale: 'ABSENT',
          createdAt: now,
          updatedAt: now,
        };

        transaction.set(registrationRef, waitlistReg);
        createdRegistration = waitlistReg;
      }
    });

    // Write audit log
    await logAuditAction(
      'public_user',
      finalStatus === 'CONFIRMEE' ? 'INSCRIPTION_PUBLIQUE_CONFIRMEE' : 'INSCRIPTION_PUBLIQUE_ATTENTE',
      `Participant: ${prenomClean} ${nomClean} (${professionClean}, ${etablissementClean}) - Tél: ${rawPhone} - Réf: ${reservationNumber}`,
      payload.trainingId
    );

    return {
      status: finalStatus,
      reservationNumber,
      registration: createdRegistration!,
      waitlistPosition,
      placesRestantes: remainingSeatsAfter,
      placesReservees: reservedSeatsAfter,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `registrations/${registrationDocId}`);
  }
}

/**
 * Toggle the 3 extra places (32 -> 35 or 35 -> 32)
 * When toggled ON: If there are candidates on the waitlist, automatically promotes up to 3 candidates!
 */
export async function toggleTrainingExtraSeats(
  trainingId: string,
  allowExtra: boolean,
  adminEmail = 'sijoumicirconscription2003@gmail.com'
): Promise<{ promotedCount: number; newCapaciteMax: number }> {
  const trainingRef = doc(db, 'trainings', trainingId);
  const now = new Date().toISOString();
  let promotedCount = 0;
  const newCapaciteMax = allowExtra ? 35 : 32;

  // 1. Update training configuration
  await updateDoc(trainingRef, {
    autoriserPlacesSupp: allowExtra,
    capaciteMax: newCapaciteMax,
    capaciteMaxAutorisee: 35,
    capaciteNormale: 32,
    updatedAt: now,
  });

  // 2. If allowExtra is TRUE, check if we can auto-promote candidates from waitlist
  if (allowExtra) {
    const trainingDoc = await getDoc(trainingRef);
    if (trainingDoc.exists()) {
      const data = trainingDoc.data() as TrainingSession;
      const currentReserved = data.placesReservees || 0;
      const seatsAvailable = Math.max(0, 35 - currentReserved);

      if (seatsAvailable > 0 && (data.nbListeAttente || 0) > 0) {
        // Query top candidates on waitlist
        const waitlistQ = query(
          collection(db, 'registrations'),
          where('trainingId', '==', trainingId),
          where('statut', '==', 'LISTE_ATTENTE'),
          orderBy('createdAt', 'asc'),
          limit(seatsAvailable)
        );
        const waitlistSnap = await getDocs(waitlistQ);

        for (const candidateDoc of waitlistSnap.docs) {
          const candRef = doc(db, 'registrations', candidateDoc.id);
          await updateDoc(candRef, {
            statut: 'CONFIRMEE',
            positionAttente: 0,
            promuLe: now,
            updatedAt: now,
          });
          promotedCount++;
        }

        if (promotedCount > 0) {
          const newReserved = currentReserved + promotedCount;
          const newRemaining = Math.max(0, 35 - newReserved);
          const newWaitlist = Math.max(0, (data.nbListeAttente || 0) - promotedCount);

          await updateDoc(trainingRef, {
            placesReservees: newReserved,
            placesRestantes: newRemaining,
            nbListeAttente: newWaitlist,
            updatedAt: now,
          });
        }
      }
    }
  }

  // 3. Log to audit
  await logAuditAction(
    adminEmail,
    allowExtra ? 'ACTIVATION_PLACES_SUPP' : 'DESACTIVATION_PLACES_SUPP',
    `Option 3 places supplémentaires : ${allowExtra ? 'ACTIVÉE (Capacité 35)' : 'DÉSACTIVÉE (Capacité 32)'}. Promus automatiquement : ${promotedCount}`,
    trainingId
  );

  return { promotedCount, newCapaciteMax };
}

/**
 * Toggle opening / closing of registrations for a session
 */
export async function toggleTrainingInscriptionsLock(
  trainingId: string,
  isClosed: boolean,
  adminEmail = 'sijoumicirconscription2003@gmail.com'
): Promise<void> {
  const trainingRef = doc(db, 'trainings', trainingId);
  await updateDoc(trainingRef, {
    inscriptionsFermees: isClosed,
    updatedAt: new Date().toISOString(),
  });

  await logAuditAction(
    adminEmail,
    isClosed ? 'CLOTURE_INSCRIPTIONS' : 'OUVERTURE_INSCRIPTIONS',
    `Inscriptions ${isClosed ? 'FERMÉES' : 'OUVERTES'} par l’administrateur`,
    trainingId
  );
}

/**
 * Admin action: Manually confirm, cancel, or refuse a registration with auto-seat adjustment
 * and automatic promotion from waitlist when a confirmed place is cancelled/refused.
 */
export async function adminSetRegistrationStatus(
  trainingId: string,
  registrationId: string,
  newStatus: 'CONFIRMEE' | 'REFUSEE' | 'ANNULEE',
  adminEmail = 'sijoumicirconscription2003@gmail.com',
  motif = ''
): Promise<{ promotedCandidateName?: string }> {
  const trainingRef = doc(db, 'trainings', trainingId);
  const regRef = doc(db, 'registrations', registrationId);
  const now = new Date().toISOString();

  const regDoc = await getDoc(regRef);
  if (!regDoc.exists()) throw new Error('Inscription introuvable');
  const regData = regDoc.data() as Registration;
  const previousStatus = regData.statut;

  if (previousStatus === newStatus) return {};

  let promotedName: string | undefined;

  // Case 1: Promoting / manually confirming a registration
  if (newStatus === 'CONFIRMEE' && previousStatus !== 'CONFIRMEE') {
    await runTransaction(db, async (transaction) => {
      const trDoc = await transaction.get(trainingRef);
      if (!trDoc.exists()) return;
      const trData = trDoc.data() as TrainingSession;

      const effectiveCap = trData.autoriserPlacesSupp
        ? trData.capaciteMaxAutorisee || 35
        : trData.capaciteNormale || 32;
      const currentReserved = trData.placesReservees || 0;
      const newReserved = currentReserved + 1;
      const newRemaining = Math.max(0, effectiveCap - newReserved);
      const newWaitlist =
        previousStatus === 'LISTE_ATTENTE'
          ? Math.max(0, (trData.nbListeAttente || 1) - 1)
          : trData.nbListeAttente || 0;

      transaction.update(trainingRef, {
        placesReservees: newReserved,
        placesRestantes: newRemaining,
        nbListeAttente: newWaitlist,
        updatedAt: now,
      });

      transaction.update(regRef, {
        statut: 'CONFIRMEE',
        positionAttente: 0,
        promuLe: now,
        updatedAt: now,
      });
    });
  }

  // Case 2: Cancelling or Refusing a CONFIRMED registration => Frees a seat & promotes first on waitlist!
  if ((newStatus === 'ANNULEE' || newStatus === 'REFUSEE') && previousStatus === 'CONFIRMEE') {
    await updateDoc(regRef, {
      statut: newStatus,
      updatedAt: now,
    });

    // Check waitlist to auto-promote
    const waitlistQ = query(
      collection(db, 'registrations'),
      where('trainingId', '==', trainingId),
      where('statut', '==', 'LISTE_ATTENTE'),
      orderBy('createdAt', 'asc'),
      limit(1)
    );
    const waitlistSnap = await getDocs(waitlistQ);

    if (!waitlistSnap.empty) {
      const firstCand = waitlistSnap.docs[0];
      const candData = firstCand.data() as Registration;
      promotedName = `${candData.prenom} ${candData.nom}`;

      await updateDoc(doc(db, 'registrations', firstCand.id), {
        statut: 'CONFIRMEE',
        positionAttente: 0,
        promuLe: now,
        updatedAt: now,
      });

      const trainingDoc = await getDoc(trainingRef);
      if (trainingDoc.exists()) {
        const trData = trainingDoc.data() as TrainingSession;
        const newWaitlist = Math.max(0, (trData.nbListeAttente || 1) - 1);
        await updateDoc(trainingRef, {
          nbListeAttente: newWaitlist,
          updatedAt: now,
        });
      }
    } else {
      // No one in waitlist, seat becomes free
      const trainingDoc = await getDoc(trainingRef);
      if (trainingDoc.exists()) {
        const trData = trainingDoc.data() as TrainingSession;
        const effectiveCap = trData.autoriserPlacesSupp
          ? trData.capaciteMaxAutorisee || 35
          : trData.capaciteNormale || 32;
        const newReserved = Math.max(0, (trData.placesReservees || 1) - 1);
        const newRemaining = Math.max(0, effectiveCap - newReserved);

        await updateDoc(trainingRef, {
          placesReservees: newReserved,
          placesRestantes: newRemaining,
          updatedAt: now,
        });
      }
    }
  }

  // Case 3: Cancelling / Refusing someone already on LISTE_ATTENTE
  if ((newStatus === 'ANNULEE' || newStatus === 'REFUSEE') && previousStatus === 'LISTE_ATTENTE') {
    await updateDoc(regRef, {
      statut: newStatus,
      updatedAt: now,
    });
    const trainingDoc = await getDoc(trainingRef);
    if (trainingDoc.exists()) {
      const trData = trainingDoc.data() as TrainingSession;
      await updateDoc(trainingRef, {
        nbListeAttente: Math.max(0, (trData.nbListeAttente || 1) - 1),
        updatedAt: now,
      });
    }
  }

  // Log action
  await logAuditAction(
    adminEmail,
    `STATUT_${newStatus}`,
    `Inscription de ${regData.prenom} ${regData.nom} (${regData.telephone}) passée à ${newStatus}. Motif : ${motif || 'Non spécifié'}.${
      promotedName ? ` Candidat promu de la liste d'attente : ${promotedName}` : ''
    }`,
    registrationId
  );

  return { promotedCandidateName: promotedName };
}
