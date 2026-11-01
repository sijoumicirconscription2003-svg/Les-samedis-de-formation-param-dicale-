import { doc, getDoc, updateDoc, addDoc, collection, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { TrainingSession, Registration, UserProfile, AttendanceStatus } from '../types';
import { sendNotification } from './notificationService';

export interface QRPayload {
  source: 'ALI_TRAD_SANTE';
  trainingId: string;
  type: 'arrivee' | 'sortie';
  token: string;
  nonce: string;
  timestamp: number;
}

// Generate the QR payload string to encode into QR Code
export function generateQRString(
  training: TrainingSession,
  type: 'arrivee' | 'sortie'
): string {
  const token = type === 'arrivee' ? training.cleSecreteArrivee : training.cleSecreteSortie;
  const payload: QRPayload = {
    source: 'ALI_TRAD_SANTE',
    trainingId: training.id,
    type,
    token,
    nonce: training.sessionNonce || 'nonce',
    timestamp: Date.now(),
  };
  return JSON.stringify(payload);
}

// Parse and validate scanned QR Code string
export function parseQRString(scannedText: string): QRPayload {
  try {
    const parsed = JSON.parse(scannedText) as QRPayload;
    if (parsed.source !== 'ALI_TRAD_SANTE' || !parsed.trainingId || !parsed.type || !parsed.token) {
      throw new Error('QR Code invalide ou non reconnu par le Centre Ali Trad.');
    }
    return parsed;
  } catch {
    throw new Error('Format de QR Code non conforme pour cette formation.');
  }
}

export interface CheckinResult {
  success: boolean;
  type: 'arrivee' | 'sortie';
  participantNom: string;
  heureExacte: string;
  themeFormation: string;
  dateFormation: string;
}

/**
 * DOUBLE POINTAGE SÉCURISÉ PAR QR CODE
 * Attente OBLIGATOIRE de confirmation serveur Firebase.
 */
export async function processQRCheckin(
  scannedText: string,
  user: UserProfile
): Promise<CheckinResult> {
  const payload = parseQRString(scannedText);
  const { trainingId, type, token, nonce } = payload;

  const trainingRef = doc(db, 'trainings', trainingId);
  const registrationDocId = `${trainingId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', registrationDocId);

  const now = new Date();
  const heureExacte = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  let themeFormation = '';
  let dateFormation = '';

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch and verify Training
      const trainingDoc = await transaction.get(trainingRef);
      if (!trainingDoc.exists()) {
        throw new Error('Formation introuvable dans le système.');
      }

      const training = trainingDoc.data() as TrainingSession;
      themeFormation = training.theme;
      dateFormation = training.date;

      // Verify that this checkin is open
      if (type === 'arrivee') {
        if (!training.pointageArriveeOuvert) {
          throw new Error("Le pointage d'arrivée n'est pas encore ouvert par l'administrateur.");
        }
        if (training.cleSecreteArrivee !== token) {
          throw new Error("Clé de sécurité du QR Code d'arrivée invalide.");
        }
      } else {
        if (!training.pointageSortieOuvert) {
          throw new Error("Le pointage de fin de séance n'est pas encore ouvert par l'administrateur.");
        }
        if (training.cleSecreteSortie !== token) {
          throw new Error("Clé de sécurité du QR Code de sortie invalide.");
        }
      }

      // Verify session nonce (Anti-screenshot protection)
      if (training.sessionNonce && nonce && training.sessionNonce !== nonce) {
        throw new Error('Ce QR Code a expiré ou provient d’une capture d’écran obsolète. Veuillez scanner le QR Code actif affiché en salle.');
      }

      // 2. Fetch and verify Participant Registration
      const regDoc = await transaction.get(registrationRef);
      if (!regDoc.exists()) {
        throw new Error("Vous n'avez aucune inscription enregistrée pour cette formation.");
      }

      const reg = regDoc.data() as Registration;

      if (reg.statut !== 'CONFIRMEE') {
        if (reg.statut === 'LISTE_ATTENTE') {
          throw new Error("Vous êtes sur liste d'attente. Votre place n'a pas encore été confirmée pour assister à la formation.");
        }
        throw new Error('Votre réservation est annulée pour cette formation.');
      }

      // 3. Check duplicate / sequence logic
      if (type === 'arrivee') {
        if (reg.pointageArriveeValide) {
          throw new Error(`Pointage d'arrivée déjà enregistré à ${reg.heureArrivee}. Un double pointage est impossible.`);
        }

        const newPresence: AttendanceStatus = reg.pointageSortieValide ? 'COMPLETE' : 'ARRIVEE_SEULE';

        transaction.update(registrationRef, {
          pointageArriveeValide: true,
          heureArrivee: heureExacte,
          presenceFinale: newPresence,
          updatedAt: now.toISOString(),
        });
      } else {
        // Departure check-in
        if (!reg.pointageArriveeValide) {
          throw new Error("Pointage de sortie refusé : Vous devez impérativement avoir enregistré votre arrivée au préalable.");
        }
        if (reg.pointageSortieValide) {
          throw new Error(`Pointage de sortie déjà enregistré à ${reg.heureSortie}. Un double pointage est impossible.`);
        }

        transaction.update(registrationRef, {
          pointageSortieValide: true,
          heureSortie: heureExacte,
          presenceFinale: 'COMPLETE',
          updatedAt: now.toISOString(),
        });
      }
    });

    // Notify user in app
    if (type === 'arrivee') {
      await sendNotification(
        user.uid,
        'Présence d’Arrivée Validée',
        `Votre présence d’arrivée à la formation "${themeFormation}" a été enregistrée avec succès à ${heureExacte}.`,
        'pointage_arrivee',
        trainingId
      );
    } else {
      await sendNotification(
        user.uid,
        'Présence de Fin de Séance Validée',
        `Votre présence finale à la formation "${themeFormation}" a été confirmée à ${heureExacte}. Votre assiduité est validée !`,
        'pointage_sortie',
        trainingId
      );
    }

    return {
      success: true,
      type,
      participantNom: `${user.prenom} ${user.nom}`,
      heureExacte,
      themeFormation,
      dateFormation,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, `registrations/${registrationDocId}`);
  }
}

/**
 * VALIDATION MANUELLE EXCEPTIONNELLE PAR L'ADMINISTRATEUR
 * Avec enregistrement strict du motif dans le journal d'audit.
 */
export async function manualAttendanceOverride(
  registrationId: string,
  trainingId: string,
  type: 'arrivee' | 'sortie' | 'complete',
  motif: string,
  admin: UserProfile
): Promise<void> {
  if (!motif || motif.trim().length < 5) {
    throw new Error('Un motif détaillé d’au moins 5 caractères est obligatoire pour la traçabilité.');
  }

  const regRef = doc(db, 'registrations', registrationId);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isoStr = now.toISOString();

  try {
    const regDoc = await getDoc(regRef);
    if (!regDoc.exists()) throw new Error('Inscription introuvable.');
    const reg = regDoc.data() as Registration;

    let updates: Partial<Registration> = {
      validationManuelle: true,
      motifValidationManuelle: motif.trim(),
      adminValidationEmail: admin.email,
      updatedAt: isoStr,
    };

    if (type === 'arrivee') {
      updates = {
        ...updates,
        pointageArriveeValide: true,
        heureArrivee: reg.heureArrivee || timeStr,
        presenceFinale: reg.pointageSortieValide ? 'COMPLETE' : 'ARRIVEE_SEULE',
      };
    } else if (type === 'sortie') {
      updates = {
        ...updates,
        pointageSortieValide: true,
        heureSortie: reg.heureSortie || timeStr,
        presenceFinale: reg.pointageArriveeValide ? 'COMPLETE' : 'SORTIE_SEULE',
      };
    } else if (type === 'complete') {
      updates = {
        ...updates,
        pointageArriveeValide: true,
        pointageSortieValide: true,
        heureArrivee: reg.heureArrivee || timeStr,
        heureSortie: reg.heureSortie || timeStr,
        presenceFinale: 'COMPLETE',
      };
    }

    await updateDoc(regRef, updates);

    // Write to audit_logs collection
    await addDoc(collection(db, 'audit_logs'), {
      action: 'VALIDATION_MANUELLE_POINTAGE',
      adminId: admin.uid,
      adminEmail: admin.email,
      cibleType: 'REGISTRATION',
      cibleId: registrationId,
      details: `Type: ${type.toUpperCase()} | Participant: ${reg.prenom} ${reg.nom} (${reg.matricule}) | Motif: ${motif.trim()}`,
      horodatage: isoStr,
    });

    // Notify user
    await sendNotification(
      reg.userId,
      'Pointage validé par l’administration',
      `Votre présence (${type}) a été validée manuellement par l’administration (${admin.email}) : "${motif.trim()}".`,
      'pointage_arrivee',
      trainingId
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `registrations/${registrationId}`);
  }
}
