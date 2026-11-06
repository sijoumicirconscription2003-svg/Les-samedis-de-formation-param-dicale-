import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { Certificate, Registration, TrainingSession, UserProfile } from '../types';
import { sendNotification } from './notificationService';

// Issue certificate for a participant
export async function issueCertificate(
  registration: Registration,
  training: TrainingSession,
  admin: UserProfile,
  isDerogation = false,
  motifDerogation = ''
): Promise<Certificate> {
  // Enforce double scan condition unless explicit administrative derogation
  const isFullyAttended =
    registration.pointageArriveeValide && registration.pointageSortieValide;

  if (!isFullyAttended && !isDerogation) {
    throw new Error(
      "Délivrance impossible : L'attestation exige la validation des deux scans (arrivée et fin de séance) ou une dérogation administrative formelle."
    );
  }

  if (isDerogation && (!motifDerogation || motifDerogation.trim().length < 5)) {
    throw new Error('Un motif détaillé est obligatoire pour toute dérogation administrative.');
  }

  const certificateDocRef = doc(collection(db, 'certificates'));
  const certId = certificateDocRef.id;
  const year = new Date().getFullYear();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const numeroReference = `AT-${year}-FMC-${randNum}`;
  const codeVerification = `${certId.substring(0, 8).toUpperCase()}-${randNum}`;
  const now = new Date().toISOString();

  const newCertificate: Certificate = {
    id: certId,
    numeroReference,
    trainingId: training.id,
    themeFormation: training.theme,
    dateFormation: training.date,
    dureeFormation: training.dureeHeures || '4 heures',
    formateur: training.formateur,
    lieu: training.lieu || 'Salle de réunion du Centre Intermédiaire Ali Trad',
    userId: registration.userId,
    nom: registration.nom,
    prenom: registration.prenom,
    matricule: registration.matricule || '',
    fonction: registration.fonction,
    etablissement: registration.etablissement,
    delivreeLe: now,
    delivreePar: `${admin.prenom} ${admin.nom} (${admin.fonction || 'Administration GSB Tunis Sud'})`,
    estDerogation: isDerogation,
    motifDerogation: isDerogation ? motifDerogation : '',
    codeVerification,
    numeroSeance: training.numeroSeance,
    domaine: training.domaine,
  };

  try {
    await setDoc(certificateDocRef, newCertificate);

    // Link certificateId to registration
    await updateDoc(doc(db, 'registrations', registration.id), {
      attestationId: certId,
      updatedAt: now,
    });

    // Notify participant
    await sendNotification(
      registration.userId,
      'Attestation Officielle Disponible',
      `Votre attestation de formation continue pour "${training.theme}" est désormais disponible dans votre espace personnel (Réf: ${numeroReference}).`,
      'attestation_disponible',
      training.id
    );

    return newCertificate;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `certificates/${certId}`);
  }
}

// Fetch single certificate
export async function getCertificateById(certificateId: string): Promise<Certificate | null> {
  try {
    const d = await getDoc(doc(db, 'certificates', certificateId));
    if (!d.exists()) return null;
    return { id: d.id, ...(d.data() as Omit<Certificate, 'id'>) };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `certificates/${certificateId}`);
  }
}

// Listen to all user's certificates
export function listenUserCertificates(
  userId: string,
  callback: (certificates: Certificate[]) => void
) {
  const q = query(
    collection(db, 'certificates'),
    where('userId', '==', userId),
    orderBy('delivreeLe', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Certificate[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Certificate, 'id'>),
      }));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'certificates');
    }
  );
}

// Listen to all certificates (for Admin)
export function listenAllCertificates(callback: (certificates: Certificate[]) => void) {
  const q = query(collection(db, 'certificates'), orderBy('delivreeLe', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Certificate[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Certificate, 'id'>),
      }));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'certificates');
    }
  );
}

// Generate an immediate Specimen / Sample Certificate for any training session
export function createSpecimenCertificateForTraining(
  training: TrainingSession,
  participant?: {
    nom?: string;
    prenom?: string;
    matricule?: string;
    fonction?: string;
    etablissement?: string;
  }
): Certificate {
  const year = new Date().getFullYear();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const seance = training.numeroSeance ? String(training.numeroSeance).padStart(2, '0') : '01';

  return {
    id: `cert-specimen-s${seance}-${training.id}`,
    numeroReference: `AT-${year}-FMC-S${seance}-${randNum}`,
    trainingId: training.id,
    themeFormation: training.theme,
    dateFormation: training.date,
    dureeFormation: training.dureeHeures || '60 minutes',
    formateur: training.formateur || 'Équipe Pédagogique Ali Trad',
    lieu: training.lieu || 'Salle de réunion du Centre Intermédiaire Ali Trad',
    userId: 'specimen-participant',
    nom: participant?.nom || '',
    prenom: participant?.prenom || '',
    matricule: participant?.matricule || '',
    fonction: participant?.fonction || '',
    etablissement: participant?.etablissement || 'Centre Intermédiaire Ali Trad',
    delivreeLe: new Date().toISOString(),
    delivreePar: 'Administration Circonscription Sanitaire Sijoumi',
    estDerogation: false,
    codeVerification: `VERIF-S${seance}-${randNum}`,
    numeroSeance: training.numeroSeance,
    domaine: training.domaine,
  };
}
