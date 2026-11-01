export type UserRole = 'participant' | 'responsable' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  nom: string;
  prenom: string;
  matricule: string;
  fonction: string;
  etablissement: string;
  telephone?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type TrainingStatus = 'a_venir' | 'en_cours' | 'cloturee' | 'annulee';

export interface TrainingSession {
  id: string;
  theme: string;
  description: string;
  objectifs?: string[];
  publicCible?: string;
  formateur: string;
  qualiteFormateur?: string;
  date: string; // YYYY-MM-DD (Samedi)
  heureDebut: string; // e.g. 08:30
  heureFin: string; // e.g. 13:00
  dureeHeures: string; // e.g. "4h30"
  lieu: string; // "Salle de réunion du Centre Intermédiaire Ali Trad"
  capaciteMax: number; // e.g. 25
  placesReservees: number;
  placesRestantes: number;
  nbListeAttente: number;
  dateLimiteInscription: string; // YYYY-MM-DDTHH:mm
  estPublie: boolean;
  statut: TrainingStatus;
  domaine?: string; // e.g. "URGENCES", "PRATIQUE", "SOINS", "PRÉVENTION", "SÉCURITÉ", "RELATIONNEL", "DROIT & ÉTHIQUE"
  numeroSeance?: number; // e.g. 1 to 19
  consignes?: string[];
  pointageArriveeOuvert: boolean;
  pointageSortieOuvert: boolean;
  cleSecreteArrivee: string;
  cleSecreteSortie: string;
  sessionNonce: string; // dynamic rotating token seed
  creePar?: string;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 'CONFIRMEE' | 'LISTE_ATTENTE' | 'ANNULEE';
export type AttendanceStatus = 'ABSENT' | 'ARRIVEE_SEULE' | 'SORTIE_SEULE' | 'COMPLETE';

export interface Registration {
  id: string;
  trainingId: string;
  userId: string;
  nom: string;
  prenom: string;
  matricule: string;
  fonction: string;
  etablissement: string;
  email: string;
  telephone?: string;
  numeroReservation: string; // e.g. RES-2026-AT-0428
  statut: RegistrationStatus;
  positionAttente?: number;
  promuLe?: string;
  dateExpirationPromotion?: string;
  pointageArriveeValide: boolean;
  heureArrivee?: string;
  pointageSortieValide: boolean;
  heureSortie?: string;
  presenceFinale: AttendanceStatus;
  validationManuelle?: boolean;
  motifValidationManuelle?: string;
  adminValidationEmail?: string;
  attestationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  numeroReference: string; // e.g. AT-2026-FMC-0012
  trainingId: string;
  themeFormation: string;
  dateFormation: string;
  dureeFormation: string;
  formateur: string;
  lieu: string;
  userId: string;
  nom: string;
  prenom: string;
  matricule: string;
  fonction: string;
  etablissement: string;
  delivreeLe: string;
  delivreePar: string;
  estDerogation: boolean;
  motifDerogation?: string;
  codeVerification: string;
}

export interface AuditLog {
  id: string;
  action: string;
  adminId: string;
  adminEmail: string;
  cibleType: string;
  cibleId: string;
  details: string;
  horodatage: string;
}

export type NotificationType =
  | 'reservation_confirmee'
  | 'rappel_formation'
  | 'promotion_attente'
  | 'pointage_arrivee'
  | 'pointage_sortie'
  | 'annulation'
  | 'attestation_disponible';

export interface NotificationItem {
  id: string;
  userId: string;
  titre: string;
  message: string;
  type: NotificationType;
  formationId?: string;
  lue: boolean;
  createdAt: string;
}
