import React from 'react';
import { EmblemType } from '../components/ThemeEmblems';

export interface CourseSubjectTheme {
  seanceNumber: number;
  shortLabel: string;
  themeTitle: string; // Official training subject title
  themeTagline: string; // Thematic presentation of the subject
  themePresentation: string; // Comprehensive description presenting the subject
  keyConcepts: string[]; // 3-4 key pillars of the subject
  publicCible: string;
  medicalDomain: string;
  iconName: string;
  emblemType: EmblemType;
  emblemLabel: string;

  // Visual Theme Colors & Badges
  borderColor: string;
  primaryColor: string;
  accentColor: string;
  bgTint: string;
  badgeBg: string;
  badgeText: string;
  gradient: string;
  watermarkSymbol: string;
}

export const COURSE_SUBJECT_THEMES: Record<number, CourseSubjectTheme> = {
  1: {
    seanceNumber: 1,
    shortLabel: "Séance #01 • Trousse d'Urgence",
    themeTitle: "Trousse d'urgence : Composition, vérification et utilisation pratique en situation critique",
    themeTagline: "Urgences Vitales & Matériel Critique de Première Ligne",
    themePresentation:
      "Ce thème présente la dotation obligatoire et la gestion opérationnelle de la trousse d'urgence en centre de santé. Il aborde la vérification systématique des dates de péremption, la chaîne du froid, la traçabilité des solutés et la préparation méthodique des médicaments d'urgence vitale sous protocole.",
    keyConcepts: [
      "Inventaire obligatoire de la trousse de première ligne",
      "Check-list de vérification hebdomadaire et post-utilisation",
      "Préparation et sécurisation des injectables d'urgence",
      "Traçabilité rigoureuse et réassort immédiat",
    ],
    publicCible: "Personnel infirmier et techniciens supérieurs de santé",
    medicalDomain: "URGENCES",
    iconName: "Ambulance",
    emblemType: "ambulance_samu",
    emblemLabel: "Voiture de SAMU",
    borderColor: '#991B1B', // Carmine Red
    primaryColor: '#7F1D1D',
    accentColor: '#D97706',
    bgTint: '#FEFBFB',
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
    gradient: 'from-red-950 via-rose-900 to-red-900',
    watermarkSymbol: '🚑',
  },
  2: {
    seanceNumber: 2,
    shortLabel: 'Séance #02 • Arrêt Cardio & DAE',
    themeTitle: "L'arrêt cardiorespiratoire, prise en charge initiale & mode d'emploi du défibrillateur automatisé externe",
    themeTagline: "Chaîne de Survie & Défibrillation Cardiaque Précoce",
    themePresentation:
      "Ce thème présente l'action immédiate face à un arrêt cardiorespiratoire en milieu ambulatoire. Il expose la reconnaissance instantanée de l'inconscience et de l'apnée, la pratique d'un massage cardiaque externe de haute efficacité sans interruption, et l'emploi sans délai du DAE pour maximiser les chances de survie.",
    keyConcepts: [
      "Reconnaissance de l'inconscience et de l'absence de pouls en < 10 sec",
      "Compressions thoraciques continues au rythme de 100-120 cpm",
      "Pose des électrodes et sécurité absolue lors du choc électrique",
      "Coordination de la chaîne de secours avec appel au SAMU 190",
    ],
    publicCible: "Personnel soignant et médico-technique",
    medicalDomain: "URGENCES",
    iconName: "HeartPulse",
    emblemType: "defibrillateur_dae",
    emblemLabel: "Défibrillateur DAE & Cœur",
    borderColor: '#0A2540', // Deep Navy Blue
    primaryColor: '#0A2540',
    accentColor: '#1E40AF',
    bgTint: '#FCFBF7',
    badgeBg: '#EFF6FF',
    badgeText: '#1E40AF',
    gradient: 'from-[#0A2540] via-[#0F2F57] to-[#123966]',
    watermarkSymbol: '🫀',
  },
  3: {
    seanceNumber: 3,
    shortLabel: 'Séance #03 • Choc & Malaise Vagal',
    themeTitle: "Urgences fréquentes : Conduite à tenir face à un choc anaphylactique et un malaise vagal",
    themeTagline: "Choc Anaphylactique & Urgences Hémodynamiques",
    themePresentation:
      "Ce thème présente la conduite à tenir différentielle face à un malaise aigu avec défaillance circulatoire. Il détaille la reconnaissance rapide d'un choc anaphylactique suite à un allergène ou un médicament, la posologie salvatrice d'adrénaline intramusculaire, et la mise en condition sécurisée d'un malaise vagal.",
    keyConcepts: [
      "Diagnostic différentiel immédiat : malaise vagal vs anaphylaxie aiguë",
      "Repérage et injection urgente d'adrénaline (face antéro-latérale de la cuisse)",
      "Maintien des voies aériennes et oxygénothérapie à haut débit",
      "Surveillance hémodynamique continue de la tension artérielle et du pouls",
    ],
    publicCible: "Infirmiers, sages-femmes et techniciens de santé",
    medicalDomain: "URGENCES",
    iconName: "Syringe",
    emblemType: "seringue",
    emblemLabel: "Seringue d'Urgence",
    borderColor: '#6B21A8', // Imperial Purple
    primaryColor: '#581C87',
    accentColor: '#D97706',
    bgTint: '#FAF7FD',
    badgeBg: '#F3E8FF',
    badgeText: '#6B21A8',
    gradient: 'from-purple-950 via-purple-900 to-indigo-950',
    watermarkSymbol: '💉',
  },
  4: {
    seanceNumber: 4,
    shortLabel: 'Séance #04 • Électrocardiogramme (ECG)',
    themeTitle: "Électrocardiogramme (ECG) : Réalisation technique conforme et urgences à ne pas rater",
    themeTagline: "Électrocardiographie Clinique & Alertes Coronariennes",
    themePresentation:
      "Ce thème présente les standards de qualité pour l'enregistrement d'un électrocardiogramme 12 dérivations. Il couvre le repérage anatomique parfait des dérivations périphériques et précordiales (V1 à V6), la suppression des artéfacts, et la détection immédiate des anomalies coronariennes nécessitant un transfert urgent.",
    keyConcepts: [
      "Positionnement anatomique strict des électrodes sans interversion",
      "Calibration de l'appareil (25 mm/s et 10 mm/mV) et tracé sans artéfacts",
      "Dépistage précoce du sus-décalage ST évocateur d'infarctus aigu",
      "Alerte médicale instantanée face aux troubles du rythme majeurs",
    ],
    publicCible: "Personnel soignant et infirmiers",
    medicalDomain: "PRATIQUE",
    iconName: "Activity",
    emblemType: "trace_ecg",
    emblemLabel: "Tracé ECG 12 Dérivations",
    borderColor: '#0284C7', // Clinical Cobalt
    primaryColor: '#0369A1',
    accentColor: '#0284C7',
    bgTint: '#F8FAFC',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    gradient: 'from-sky-950 via-blue-900 to-cyan-950',
    watermarkSymbol: '📈',
  },
  5: {
    seanceNumber: 5,
    shortLabel: 'Séance #05 • Les Pansements',
    themeTitle: "Les pansements : Techniques, protocoles de réfection et quoi de neuf dans les dispositifs",
    themeTagline: "Soins de Plaies & Cicatrisation Moderne",
    themePresentation:
      "Ce thème présente l'état de l'art dans la prise en charge des plaies aiguës et chroniques au centre de santé. Il aborde les protocoles d'antisepsie séquentielle, l'évaluation de la flore et des exsudats, ainsi que la sélection rationnelle des dispositifs médicaux modernes (hydrocellulaires, alginates, pansements argentiques).",
    keyConcepts: [
      "Évaluation précise du stade de la plaie (nécrose, fibrine, bourgeonnement)",
      "Asepsie rigoureuse et techniques de réfection atraumatiques",
      "Utilisation ciblée des nouveaux pansements selon l'exsudat",
      "Prévention des infections nosocomiales et conseils d'hygiène au patient",
    ],
    publicCible: "Infirmiers et techniciens supérieurs",
    medicalDomain: "SOINS",
    iconName: "Bandage",
    emblemType: "pansement",
    emblemLabel: "Pansement Stérile",
    borderColor: '#047857', // Emerald Green
    primaryColor: '#065F46',
    accentColor: '#B45309',
    bgTint: '#F6FBF8',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    gradient: 'from-emerald-950 via-teal-900 to-green-950',
    watermarkSymbol: '🩹',
  },
  6: {
    seanceNumber: 6,
    shortLabel: 'Séance #06 • Perte de Connaissance',
    themeTitle: "Perte de connaissance : Évaluation rapide et rôle propre de l'infirmier(e)",
    themeTagline: "Neurologie d'Urgence & Évaluation de la Conscience",
    themePresentation:
      "Ce thème présente le rôle propre de l'infirmier(e) face à un patient comateux, confus ou obnubilé. Il détaille la quantification rigoureuse du score de Glasgow, la recherche systématique et immédiate d'une hypoglycémie au doigt, le maintien de la liberté des voies aériennes et la mise en Position Latérale de Sécurité (PLS).",
    keyConcepts: [
      "Cotation rapide et exacte du score de Glasgow (yeux, verbal, moteur)",
      "Glycémie capillaire instantanée pour écarter un coma hypoglycémique",
      "Protection des voies aériennes par la mise en PLS",
      "Surveillance pupillaire et transmissions ciblées au médecin",
    ],
    publicCible: "Personnel paramédical",
    medicalDomain: "SOINS",
    iconName: "Brain",
    emblemType: "cerveau_neuro",
    emblemLabel: "Cerveau & Neurologie",
    borderColor: '#334155', // Slate Anthracite
    primaryColor: '#1E293B',
    accentColor: '#0284C7',
    bgTint: '#F8FAFC',
    badgeBg: '#F1F5F9',
    badgeText: '#0F172A',
    gradient: 'from-slate-950 via-slate-900 to-slate-800',
    watermarkSymbol: '🧠',
  },
  7: {
    seanceNumber: 7,
    shortLabel: 'Séance #07 • Éducation pour la Santé',
    themeTitle: "Éducation pour la santé : Stratégies d'information, accompagnement et prévention patients",
    themeTagline: "Éducation Thérapeutique & Alliance Soignante",
    themePresentation:
      "Ce thème présente les méthodes éducatives destinées à rendre le patient porteur d'une affection de longue durée (diabète, HTA, cardiopathies) acteur de sa santé. Il aborde la communication bienveillante, l'entretien motivationnel, l'observance thérapeutique et la détection précoce des complications.",
    keyConcepts: [
      "Techniques d'écoute active et posture motivationnelle sans jugement",
      "Co-construction d'objectifs de vie sains et atteignables avec le patient",
      "Renforcement de l'observance médicamenteuse et hygiéno-diététique",
      "Coordination du parcours éducatif pluriprofessionnel",
    ],
    publicCible: "Personnel paramédical et soignants de première ligne",
    medicalDomain: "PRÉVENTION",
    iconName: "HeartHandshake",
    emblemType: "caducee_sante",
    emblemLabel: "Caducée de la Santé",
    borderColor: '#15803D', // Sage Green
    primaryColor: '#166534',
    accentColor: '#CA8A04',
    bgTint: '#F9FBF7',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    gradient: 'from-green-950 via-emerald-900 to-teal-950',
    watermarkSymbol: '🌱',
  },
  8: {
    seanceNumber: 8,
    shortLabel: 'Séance #08 • Prévention des AES',
    themeTitle: "Prévention des AES : Conduite à tenir lors des accidents d'exposition au sang et gestes barrières",
    themeTagline: "Biosécurité Hospitalière & Protection Contre les AES",
    themePresentation:
      "Ce thème présente les mesures barrières de sécurité et la conduite d'urgence impérative lors d'une piqûre, coupure ou projection de liquide biologique. Il expose les gestes de désinfection immédiats, la déclaration médico-légale sous 24 à 48 heures, et l'évaluation du risque de transmission virale (VIH, hépatites B et C).",
    keyConcepts: [
      "Soins d'urgence immédiats : lavage à l'eau et savon puis trempage antiseptique 5 min",
      "Élimination des objets tranchants dans les collecteurs sécurisés OPCT",
      "Circuit légal de déclaration d'accident du travail dans les délais",
      "Bilan sérologique source/victime et suivi médical spécialisé",
    ],
    publicCible: "Ensemble du personnel soignant et médico-technique",
    medicalDomain: "SÉCURITÉ",
    iconName: "TestTube",
    emblemType: "eprouvette_aes",
    emblemLabel: "Éprouvette & Prélèvement",
    borderColor: '#C2410C', // Safety Bronze / Rust
    primaryColor: '#9A3412',
    accentColor: '#2563EB',
    bgTint: '#FFFBEB',
    badgeBg: '#FEF3C7',
    badgeText: '#9A3412',
    gradient: 'from-amber-950 via-orange-900 to-red-950',
    watermarkSymbol: '🧪',
  },
  9: {
    seanceNumber: 9,
    shortLabel: 'Séance #09 • Accueil & Communication',
    themeTitle: "Accueil, orientation & communication : Gestion des patients agressifs et situations conflictuelles",
    themeTagline: "Communication Relationnelle & Désescalade des Conflits",
    themePresentation:
      "Ce thème présente les techniques de désescalade verbale et comportementale dans les espaces d'accueil et salles d'attente du centre de santé. Il enseigne l'adoption d'une communication assertive, la gestion du stress face à des patients ou familles agressives, et la sécurisation concertée de l'équipe.",
    keyConcepts: [
      "Désamorçage précoce de l'agressivité par la reformulation empathique",
      "Attitude corporelle non agressive et maintien d'une distance de sécurité",
      "Gestion de la frustration et explications claires des délais de prise en charge",
      "Protocoles d'alerte interne et sécurisation solidaire de l'équipe de santé",
    ],
    publicCible: "Personnel soignant, accueil et orientation",
    medicalDomain: "RELATIONNEL",
    iconName: "Stethoscope",
    emblemType: "medecin",
    emblemLabel: "Médecin & Stéthoscope",
    borderColor: '#4338CA', // Indigo Royal
    primaryColor: '#3730A3',
    accentColor: '#E11D48',
    bgTint: '#F8F9FE',
    badgeBg: '#E0E7FF',
    badgeText: '#3730A3',
    gradient: 'from-indigo-950 via-blue-900 to-violet-950',
    watermarkSymbol: '👨‍⚕️',
  },
  10: {
    seanceNumber: 10,
    shortLabel: 'Séance #10 • Éthique & Secret Médical',
    themeTitle: "Éthique professionnelle : Secret professionnel, confidentialité et respect des droits des patients",
    themeTagline: "Déontologie Paramédicale & Respect du Secret Partagé",
    themePresentation:
      "Ce thème présente les obligations juridiques et éthiques entourant l'exercice paramédical en première ligne. Il examine le périmètre du secret professionnel absolu, les conditions strictes du secret partagé en équipe soignante, la confidentialité des dossiers médicaux et le respect fondamental de la dignité du patient.",
    keyConcepts: [
      "Règles pénales et déontologiques du secret professionnel",
      "Conditions du secret partagé au sein de l'équipe pluriprofessionnelle",
      "Confidentialité des transmissions orales, écrites et informatisées",
      "Respect de l'intimité, du consentement éclairé et des droits des usagers",
    ],
    publicCible: "Tout le personnel paramédical et administratif",
    medicalDomain: "DROIT & ÉTHIQUE",
    iconName: "GraduationCap",
    emblemType: "tenue_academique",
    emblemLabel: "Tenue Académique & Éthique",
    borderColor: '#B8860B', // Presidential 24k Gold
    primaryColor: '#0A2540',
    accentColor: '#D4AF37',
    bgTint: '#FCFBF7',
    badgeBg: '#FEF3C7',
    badgeText: '#78350F',
    gradient: 'from-slate-950 via-[#0A2540] to-amber-950',
    watermarkSymbol: '🎓',
  },
};

// Helper to get theme for any training session
export function getCourseTheme(sessionNumber?: number, title?: string): CourseSubjectTheme {
  if (sessionNumber && COURSE_SUBJECT_THEMES[sessionNumber]) {
    return COURSE_SUBJECT_THEMES[sessionNumber];
  }

  const text = (title || '').toLowerCase();
  if (text.includes('trousse') || text.includes('critique')) return COURSE_SUBJECT_THEMES[1];
  if (text.includes('arrêt') || text.includes('dae') || text.includes('cardiorespiratoire') || text.includes('cardio-respiratoire')) return COURSE_SUBJECT_THEMES[2];
  if (text.includes('choc') || text.includes('vagal') || text.includes('anaphylactique') || text.includes('seringue')) return COURSE_SUBJECT_THEMES[3];
  if (text.includes('ecg') || text.includes('électrocardiogramme') || text.includes('tracé')) return COURSE_SUBJECT_THEMES[4];
  if (text.includes('pansement') || text.includes('plaie')) return COURSE_SUBJECT_THEMES[5];
  if (text.includes('perte de connaissance') || text.includes('glasgow') || text.includes('rôle propre') || text.includes('cerveau')) return COURSE_SUBJECT_THEMES[6];
  if (text.includes('éducation pour la santé') || text.includes('éducation thérapeutique')) return COURSE_SUBJECT_THEMES[7];
  if (text.includes('aes') || text.includes('accidents d\'exposition') || text.includes('barrières') || text.includes('éprouvette')) return COURSE_SUBJECT_THEMES[8];
  if (text.includes('agressifs') || text.includes('communication') || text.includes('conflictuelle') || text.includes('accueil') || text.includes('médecin')) return COURSE_SUBJECT_THEMES[9];
  if (text.includes('éthique') || text.includes('secret') || text.includes('déontologie') || text.includes('confidentialité') || text.includes('académique')) return COURSE_SUBJECT_THEMES[10];

  // Default fallback
  return COURSE_SUBJECT_THEMES[1];
}
