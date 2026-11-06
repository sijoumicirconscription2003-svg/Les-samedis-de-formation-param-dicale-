import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { TrainingSession } from '../types';

export const OFFICIAL_19_TRAININGS: Omit<TrainingSession, 'id'>[] = [
  {
    numeroSeance: 1,
    domaine: "URGENCES",
    theme: "Trousse d'urgence : Composition, vérification et utilisation pratique en situation critique",
    description: "Revue détaillée de la trousse d'urgence en première ligne : composition réglementaire, protocoles de vérification systématique des péremptions, traçabilité et utilisation pratique des matériels et solutés en situation critique.",
    objectifs: [
      "Connaître la dotation obligatoire de la trousse d'urgence en centre de santé",
      "Maîtriser la check-list de vérification hebdomadaire et post-utilisation",
      "Savoir préparer et administrer en urgence les thérapeutiques sous prescription d'urgence",
    ],
    publicCible: "Personnel infirmier et techniciens supérieurs de santé",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-10-24",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-10-23T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S01_2026",
    cleSecreteSortie: "SEC_DEP_S01_2026",
    sessionNonce: "NONCE_S01_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 2,
    domaine: "URGENCES",
    theme: "Arrêt cardio-respiratoire : Prise en charge initiale et mode d'emploi du défibrillateur automatique (DAE)",
    description: "Reconnaissance précoce de l'arrêt cardio-respiratoire, mise en œuvre immédiate de la chaîne de survie, massage cardiaque externe de qualité et mise en œuvre sécurisée du défibrillateur automatisé externe (DAE).",
    objectifs: [
      "Reconnaître l'inconscience et l'arrêt respiratoire en moins de 10 secondes",
      "Pratiquer une réanimation cardio-pulmonaire efficace (fréquence et profondeur)",
      "Poser les électrodes et suivre les consignes vocales du DAE en toute sécurité",
    ],
    publicCible: "Personnel soignant et médico-technique",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-10-31",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-10-30T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S02_2026",
    cleSecreteSortie: "SEC_DEP_S02_2026",
    sessionNonce: "NONCE_S02_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 3,
    domaine: "URGENCES",
    theme: "Urgences fréquentes : Conduite à tenir face à un choc anaphylactique et un malaise vagal",
    description: "Diagnostic différentiel entre choc anaphylactique et malaise vagal, administration d'adrénaline intramusculaire, gestes de secours immédiats et surveillance hémodynamique rapprochée.",
    objectifs: [
      "Identifier sans délai les signes de gravité du choc anaphylactique",
      "Connaître les repères et dosages d'injection d'adrénaline en urgence",
      "Pratiquer les gestes simples de mise en condition pour un malaise vagal",
    ],
    publicCible: "Infirmiers, sages-femmes et techniciens de santé",
    formateur: "Mme Hamdani Inès",
    qualiteFormateur: "Surveillante / Formatrice en soins d'urgence",
    date: "2026-11-07",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    capaciteNormale: 32,
    capaciteMaxAutorisee: 35,
    autoriserPlacesSupp: false,
    inscriptionsFermees: false,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-11-06T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: true,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S03_2026",
    cleSecreteSortie: "SEC_DEP_S03_2026",
    sessionNonce: "NONCE_S03_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 4,
    domaine: "PRATIQUE",
    theme: "Électrocardiogramme (ECG) : Réalisation technique conforme et urgences à ne pas rater",
    description: "Positionnement exact des électrodes précordiales et périphériques, élimination des artéfacts techniques, reconnaissance immédiate des tracés d'alerte (syndrome coronarien aigu, troubles du rythme graves).",
    objectifs: [
      "Réaliser un tracé 12 dérivations de haute qualité technique sans artéfact",
      "Identifier un sus-décalage du segment ST évocateur d'infarctus du myocarde",
      "Alerter le médecin immédiatement face à une tachycardie ventriculaire ou un BAV",
    ],
    publicCible: "Personnel soignant et infirmiers",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-11-14",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-11-13T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S04_2026",
    cleSecreteSortie: "SEC_DEP_S04_2026",
    sessionNonce: "NONCE_S04_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 5,
    domaine: "SOINS",
    theme: "Les pansements : Techniques, protocoles de réfection et quoi de neuf dans les dispositifs",
    description: "Évaluation du stade de cicatrisation des plaies aiguës et chroniques, choix raisonné des pansements modernes (hydrocellulaires, alginates, hydrogels) et protocoles d'antisepsie.",
    objectifs: [
      "Choisir le pansement adapté à chaque phase de cicatrisation",
      "Respecter l'asepsie rigoureuse lors de la réfection des pansements",
      "Prévenir et dépister les signes d'infection locale de la plaie",
    ],
    publicCible: "Infirmiers et techniciens supérieurs",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-11-21",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-11-20T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S05_2026",
    cleSecreteSortie: "SEC_DEP_S05_2026",
    sessionNonce: "NONCE_S05_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 6,
    domaine: "SOINS",
    theme: "Perte de connaissance : Évaluation rapide et rôle propre de l'infirmier(e)",
    description: "Démarche d'évaluation clinique rapide face à un patient comateux ou confus : score de Glasgow, glycémie capillaire instantanée, libération des voies aériennes et position latérale de sécurité (PLS).",
    objectifs: [
      "Calculer avec précision le score de Glasgow",
      "Éliminer systématiquement une hypoglycémie sévère",
      "Mettre en œuvre la PLS et assurer la liberté des voies aériennes",
    ],
    publicCible: "Personnel paramédical",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-11-28",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-11-27T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S06_2026",
    cleSecreteSortie: "SEC_DEP_S06_2026",
    sessionNonce: "NONCE_S06_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 7,
    domaine: "PRÉVENTION",
    theme: "Éducation pour la santé : Stratégies d'information, accompagnement et prévention patients",
    description: "Techniques d'éducation thérapeutique auprès des patients porteurs de maladies chroniques : écoute active, entretien motivationnel, délivrance d'informations adaptées et observance thérapeutique.",
    objectifs: [
      "Développer une alliance thérapeutique de confiance avec le patient",
      "Conduire un entretien d'éducation pour la santé bienveillant",
      "Renforcer l'autonomie et l'observance thérapeutique du patient",
    ],
    publicCible: "Personnel paramédical et soignants de première ligne",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-12-05",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-12-04T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S07_2026",
    cleSecreteSortie: "SEC_DEP_S07_2026",
    sessionNonce: "NONCE_S07_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 8,
    domaine: "SÉCURITÉ",
    theme: "Prévention des AES : Conduite à tenir lors des accidents d'exposition au sang et gestes barrières",
    description: "Réglementation et protocole d'urgence face à un AES : soins locaux immédiats, déclaration médico-légale obligatoire dans les délais, bilan sérologique et mesures prophylactiques.",
    objectifs: [
      "Pratiquer les soins immédiats adaptés (lavage, désinfection)",
      "Respecter le circuit de déclaration d'accident de travail",
      "Évaluer le risque infectieux et initier la consultation spécialisée",
    ],
    publicCible: "Ensemble du personnel soignant et médico-technique",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-12-12",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-12-11T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S08_2026",
    cleSecreteSortie: "SEC_DEP_S08_2026",
    sessionNonce: "NONCE_S08_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 9,
    domaine: "RELATIONNEL",
    theme: "Accueil, orientation & communication : Gestion des patients agressifs et situations conflictuelles",
    description: "Méthodes de désescalade verbale, gestion de l'agressivité aux guichets et salles d'attente, posture professionnelle assertivité et sécurisation de l'équipe médico-administrative.",
    objectifs: [
      "Désamorcer l'escalade verbale d'un patient ou accompagnant mécontent",
      "Adopter une communication non-violente et empathique",
      "Appliquer les règles de sécurité d'équipe en situation tendue",
    ],
    publicCible: "Personnel soignant, accueil et orientation",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-12-19",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-12-18T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S09_2026",
    cleSecreteSortie: "SEC_DEP_S09_2026",
    sessionNonce: "NONCE_S09_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    numeroSeance: 10,
    domaine: "DROIT & ÉTHIQUE",
    theme: "Éthique professionnelle : Secret professionnel, confidentialité et respect des droits des patients",
    description: "Fondements juridiques et déontologiques du secret médical et paramédical, gestion du dossier de soins, partage d'informations au sein de l'équipe et protection des données de santé.",
    objectifs: [
      "Maîtriser les obligations légales du secret professionnel",
      "Gérer le secret partagé au sein de l'équipe pluridisciplinaire",
      "Garantir la confidentialité des données lors des transmissions",
    ],
    publicCible: "Tout le personnel paramédical et administratif",
    formateur: "",
    qualiteFormateur: "",
    date: "2026-12-26",
    heureDebut: "12:30",
    heureFin: "13:30",
    dureeHeures: "60 minutes",
    lieu: "Salle de réunion du Centre Intermédiaire Ali Trad",
    capaciteMax: 32,
    placesReservees: 0,
    placesRestantes: 32,
    nbListeAttente: 0,
    dateLimiteInscription: "2026-12-25T18:00",
    estPublie: true,
    statut: "a_venir",
    pointageArriveeOuvert: false,
    pointageSortieOuvert: false,
    cleSecreteArrivee: "SEC_ARR_S10_2026",
    cleSecreteSortie: "SEC_DEP_S10_2026",
    sessionNonce: "NONCE_S10_FMC",
    consignes: [
      "Ponctualité : Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.",
      "Émargement : Le pointage de présence (début et fin de séance) est obligatoire à chaque session pour valider l’attestation officielle.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Alias for backwards compatibility
export const OFFICIAL_10_TRAININGS = OFFICIAL_19_TRAININGS;

// Explicitly delete any training sessions from 02/01/2027 to 27/02/2027
export async function delete2027Trainings(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'trainings'));
    let count = 0;
    const batch = writeBatch(db);

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const date = data.date || '';
      const num = Number(data.numeroSeance) || 0;
      const is2027 =
        (date >= '2027-01-01' && date <= '2027-02-28') ||
        num >= 11 ||
        docSnap.id.includes('s11') ||
        docSnap.id.includes('s12') ||
        docSnap.id.includes('s13') ||
        docSnap.id.includes('s14') ||
        docSnap.id.includes('s15') ||
        docSnap.id.includes('s16') ||
        docSnap.id.includes('s17') ||
        docSnap.id.includes('s18') ||
        docSnap.id.includes('s19');

      if (is2027) {
        batch.delete(doc(db, 'trainings', docSnap.id));
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Deleted ${count} 2027 training sessions from Firestore.`);
    }
    return count;
  } catch (err) {
    console.error('Error deleting 2027 trainings:', err);
    throw err;
  }
}

export async function syncOfficial19Trainings(force = true): Promise<number> {
  try {
    // 1. Delete all 2027 sessions (02/01/2027 to 27/02/2027)
    await delete2027Trainings();

    // 2. Sync the 10 official 2026 sessions
    let count = 0;
    for (let i = 0; i < OFFICIAL_10_TRAININGS.length; i++) {
      const item = OFFICIAL_10_TRAININGS[i];
      const customId = `training-fmc-s${String(i + 1).padStart(2, '0')}`;
      const capaciteNormale = item.capaciteNormale || 32;
      const capaciteMaxAutorisee = item.capaciteMaxAutorisee || 35;
      await setDoc(
        doc(db, 'trainings', customId),
        {
          ...item,
          id: customId,
          capaciteNormale,
          capaciteMax: capaciteNormale,
          capaciteMaxAutorisee,
          autoriserPlacesSupp: item.autoriserPlacesSupp || false,
          inscriptionsFermees: item.inscriptionsFermees || false,
          placesReservees: 0,
          placesRestantes: capaciteNormale,
          nbListeAttente: 0,
          formateur: item.formateur || '',
          qualiteFormateur: item.qualiteFormateur || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      count++;
    }
    return count;
  } catch (error) {
    console.error('Sync official training sessions error:', error);
    throw error;
  }
}

// Reset all existing Firestore training sessions to capacity 32, 0 reserved, and clear trainer names
export async function resetAllTrainingsPlacesAndCapacity(capaciteMax = 32, clearTrainer = true): Promise<number> {
  try {
    // 1. Fetch all training documents in Firestore
    const snap = await getDocs(collection(db, 'trainings'));
    let count = 0;

    if (!snap.empty) {
      // Process in batches of 400 to respect Firestore batch limit of 500
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach((d) => {
          const ref = doc(db, 'trainings', d.id);
          const updateData: Record<string, any> = {
            capaciteMax: capaciteMax,
            placesReservees: 0,
            placesRestantes: capaciteMax,
            nbListeAttente: 0,
            updatedAt: new Date().toISOString(),
          };
          if (clearTrainer) {
            updateData.formateur = '';
            updateData.qualiteFormateur = '';
          }
          batch.update(ref, updateData);
          count++;
        });
        await batch.commit();
      }
    }

    // 2. Also ensure all 19 official sessions are synchronized with 32 places and empty trainer
    const syncedCount = await syncOfficial19Trainings(true);
    if (count === 0) {
      count = syncedCount;
    }

    // 3. Clear existing test registrations so registered count is truly 0
    try {
      const regSnap = await getDocs(collection(db, 'registrations'));
      if (!regSnap.empty) {
        const regDocs = regSnap.docs;
        for (let i = 0; i < regDocs.length; i += 400) {
          const regBatch = writeBatch(db);
          const chunk = regDocs.slice(i, i + 400);
          chunk.forEach((d) => {
            regBatch.delete(doc(db, 'registrations', d.id));
          });
          await regBatch.commit();
        }
      }
    } catch (regErr) {
      console.warn('Optional cleanup of registrations skipped:', regErr);
    }

    return count;
  } catch (err) {
    console.error('Error resetting trainings capacity and places:', err);
    throw err;
  }
}

export async function bootstrapInitialDataIfEmpty(): Promise<boolean> {
  if (!auth.currentUser) {
    return false;
  }
  const snap = await getDocs(collection(db, 'trainings'));
  if (snap.empty) {
    const synced = await syncOfficial19Trainings(true);
    return synced > 0;
  }
  // Auto-clean any legacy default trainers and ensure 32 places
  await sanitizeTrainingsData();
  return false;
}

// Automatic background cleaner to purge 2027 sessions, legacy trainer names, and ensure 32 capacity
export async function sanitizeTrainingsData(): Promise<void> {
  if (!auth.currentUser) return;
  try {
    // 1. Delete 2027 sessions from Firestore
    await delete2027Trainings();

    const snap = await getDocs(collection(db, 'trainings'));
    if (snap.empty) return;

    const batch = writeBatch(db);
    let needsCommit = false;

    snap.docs.forEach((d) => {
      const data = d.data();
      const trainerStr = (data.formateur || '').toLowerCase();
      const isLegacyTrainer =
        trainerStr.includes('khaled') ||
        trainerStr.includes('bouazizi') ||
        trainerStr.includes('salem');

      if (isLegacyTrainer || data.capaciteMax !== 32) {
        batch.update(doc(db, 'trainings', d.id), {
          formateur: '',
          qualiteFormateur: '',
          capaciteMax: 32,
          placesReservees: 0,
          placesRestantes: 32,
          nbListeAttente: 0,
          updatedAt: new Date().toISOString(),
        });
        needsCommit = true;
      }
    });

    if (needsCommit) {
      await batch.commit();
      console.log('Sanitized legacy trainer names and reset capacity to 32 max.');
    }
  } catch (err) {
    console.warn('Auto sanitize deferred:', err);
  }
}
