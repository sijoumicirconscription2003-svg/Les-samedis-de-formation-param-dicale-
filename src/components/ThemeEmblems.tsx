import React from 'react';

export type EmblemType =
  | 'ambulance_samu'
  | 'defibrillateur_dae'
  | 'seringue'
  | 'trace_ecg'
  | 'pansement'
  | 'cerveau_neuro'
  | 'caducee_sante'
  | 'eprouvette_aes'
  | 'medecin'
  | 'tenue_academique';

interface EmblemProps {
  type: EmblemType;
  className?: string;
  color?: string;
  size?: number;
  watermark?: boolean;
}

export const ThemeEmblem: React.FC<EmblemProps> = ({
  type,
  className = '',
  color = 'currentColor',
  size = 32,
  watermark = false,
}) => {
  const strokeWidth = watermark ? 1.2 : 1.8;

  switch (type) {
    // 1. Voiture de SAMU / Ambulance (Séance 1 : Trousse d'urgence & Urgences critiques)
    case 'ambulance_samu':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Ambulance Body */}
          <path d="M6 42h4m36 0h8m-48 0V20a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v22M48 24h6l6 8v10h-12" />
          {/* Wheels */}
          <circle cx="16" cy="44" r="5" fill={watermark ? 'none' : `${color}15`} />
          <circle cx="42" cy="44" r="5" fill={watermark ? 'none' : `${color}15`} />
          {/* Red Cross / Medical Cross on Door */}
          <path d="M26 23v10M21 28h10" strokeWidth={strokeWidth + 0.8} />
          {/* SAMU Siren on top */}
          <path d="M24 16v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
          <path d="M23 9l-2-2m14 2l2-2" strokeWidth="1" />
          {/* Window */}
          <rect x="44" y="24" width="10" height="8" rx="1" />
          {/* Ground speed line */}
          <path d="M2 50h60" strokeDasharray="3 3" opacity="0.6" />
        </svg>
      );

    // 2. Défibrillateur Automatisé Externe (DAE) & Cœur (Séance 2 : Arrêt cardio-respiratoire)
    case 'defibrillateur_dae':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Anatomical Heart Outline */}
          <path
            d="M32 54s-20-12.5-20-26a11 11 0 0 1 19-7.5l1 1 1-1a11 11 0 0 1 19 7.5c0 13.5-20 26-20 26z"
            fill={watermark ? 'none' : `${color}10`}
          />
          {/* DAE Electric Shock Bolt across the heart */}
          <path
            d="M34 16l-8 14h8l-6 16 14-18h-8l6-12z"
            fill={watermark ? 'none' : color}
            strokeWidth={1}
          />
          {/* Pulse Waves */}
          <path d="M4 32h8l3-6 4 12 4-6h5" opacity="0.7" />
          <path d="M38 32h5l4-6 4 12 3-6h6" opacity="0.7" />
        </svg>
      );

    // 3. Seringue & Ampoule d'Adrénaline (Séance 3 : Choc anaphylactique & malaise vagal)
    case 'seringue':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Syringe Needle */}
          <path d="M12 52L4 60" strokeWidth={strokeWidth + 0.5} />
          {/* Syringe Nozzle */}
          <path d="M16 48l-4 4" />
          {/* Syringe Cylinder Barrel (diagonal 45deg) */}
          <rect
            x="14"
            y="20"
            width="14"
            height="28"
            rx="2"
            transform="rotate(-45 21 34)"
            fill={watermark ? 'none' : `${color}12`}
          />
          {/* Graduations / Measurement marks */}
          <path d="M22 26l3 3m-1 5l3 3m-1 5l3 3" />
          {/* Plunger Shaft */}
          <path d="M38 18l8-8" strokeWidth={strokeWidth + 0.8} />
          {/* Plunger Top Thumb Rest */}
          <path d="M43 7l8 8" strokeWidth={strokeWidth + 1} />
          {/* Drop of Adrenaline Medication */}
          <path
            d="M50 42c0 3-3 6-6 6s-6-3-6-6c0-3 6-9 6-9s6 6 6 9z"
            fill={watermark ? 'none' : `${color}25`}
          />
          <path d="M44 48v2" />
        </svg>
      );

    // 4. Tracé Électrocardiogramme (ECG) complet (Séance 4 : Électrocardiogramme ECG)
    case 'trace_ecg':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Clinical Monitor Frame / Paper Strip */}
          <rect
            x="4"
            y="10"
            width="56"
            height="44"
            rx="6"
            fill={watermark ? 'none' : `${color}08`}
          />
          {/* Background ECG Grid lines */}
          <path
            d="M4 22h56M4 34h56M4 46h56M16 10v44M28 10v44M40 10v44M52 10v44"
            stroke={color}
            strokeWidth="0.5"
            strokeDasharray="1 2"
            opacity="0.3"
          />
          {/* Full ECG Complex: Baseline -> P wave -> Q -> Sharp R spike -> S -> T wave -> Baseline */}
          <path
            d="M6 34h8 c2 0 3-4 5-4s3 4 5 4 h2 l2 4 4-22 4 30 3-12 h3 c3 0 4-7 6-7s4 7 7 7 h9"
            stroke={color}
            strokeWidth={strokeWidth + 0.7}
          />
          {/* Heart indicator in corner */}
          <path
            d="M50 16a2.5 2.5 0 0 0-4 0 2.5 2.5 0 0 0-4 0c0 2 4 4 4 4s4-2 4-4z"
            fill={color}
            opacity="0.8"
          />
        </svg>
      );

    // 5. Pansement Stérile & Soin de Plaie (Séance 5 : Les Pansements & cicatrisation)
    case 'pansement':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Adhesive Bandage Strip (Rotated or straight) */}
          <rect
            x="8"
            y="22"
            width="48"
            height="20"
            rx="10"
            fill={watermark ? 'none' : `${color}15`}
          />
          {/* Central Sterile Pad */}
          <rect
            x="24"
            y="22"
            width="16"
            height="20"
            fill={watermark ? 'none' : `${color}30`}
            strokeWidth={strokeWidth}
          />
          {/* Medical Red Cross on Pad */}
          <path d="M32 27v10M27 32h10" strokeWidth={strokeWidth + 0.6} />
          {/* Perforations / Air Holes on side adhesive wings */}
          <circle cx="15" cy="28" r="1" fill={color} />
          <circle cx="19" cy="32" r="1" fill={color} />
          <circle cx="15" cy="36" r="1" fill={color} />
          <circle cx="49" cy="28" r="1" fill={color} />
          <circle cx="45" cy="32" r="1" fill={color} />
          <circle cx="49" cy="36" r="1" fill={color} />
          {/* Healing Leaves / Protection Aura */}
          <path d="M12 14c4 2 8 8 8 12" strokeDasharray="2 2" opacity="0.6" />
          <path d="M52 14c-4 2-8 8-8 12" strokeDasharray="2 2" opacity="0.6" />
        </svg>
      );

    // 6. Cerveau & Conscience Neurologique (Séance 6 : Perte de connaissance & score Glasgow)
    case 'cerveau_neuro':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Brain Left Hemisphere */}
          <path
            d="M32 14c-4-4-10-3-14 0-5 4-5 10-2 15-4 4-3 11 1 15 0 4 3 8 7 8 3 0 6-2 8-5"
            fill={watermark ? 'none' : `${color}10`}
          />
          {/* Brain Right Hemisphere */}
          <path
            d="M32 14c4-4 10-3 14 0 5 4 5 10 2 15 4 4 3 11-1 15 0 4-3 8-7 8-3 0-6-2-8-5"
            fill={watermark ? 'none' : `${color}10`}
          />
          {/* Central Fissure */}
          <path d="M32 14v34" strokeWidth={strokeWidth + 0.5} />
          {/* Gyri and Sulci / Inner convolutions */}
          <path d="M22 22c3 2 4 5 2 8m16-8c-3 2-4 5-2 8" />
          <path d="M20 36c4 0 6 3 6 6m18-6c-4 0-6 3-6 6" />
          {/* Pulse / Alert Spark above */}
          <path d="M26 8l6-4 6 4" strokeWidth="1.2" opacity="0.7" />
        </svg>
      );

    // 7. Caducée & Arbre de Prévention (Séance 7 : Éducation pour la santé & alliance soignante)
    case 'caducee_sante':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Staff of Asclepius (Central Rod) */}
          <path d="M32 8v48" strokeWidth={strokeWidth + 0.8} />
          <path d="M29 8h6M30 56h4" />
          {/* Asclepius Snake coiling around rod */}
          <path
            d="M26 16c4-3 8-1 9 2 2 4-4 7-7 9-4 2-5 6-3 9 2 4 9 3 11 0 2-3-2-7-6-8-4-2-6-6-4-9 2-3 8-2 10 1"
            strokeWidth={strokeWidth + 0.6}
          />
          {/* Healing Leaves / Olive Branch of Health */}
          <path
            d="M20 28c-6 0-10-6-10-10 4 0 10 4 10 10zm24 0c6 0 10-6 10-10-4 0-10 4-10 10z"
            fill={watermark ? 'none' : `${color}20`}
          />
          <circle cx="32" cy="7" r="2.5" fill={color} />
        </svg>
      );

    // 8. Éprouvette de Laboratoire & Prélèvement (Séance 8 : Prévention des AES & sang)
    case 'eprouvette_aes':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Test Tube Glass Container */}
          <path
            d="M24 12v36a8 8 0 0 0 16 0V12"
            fill={watermark ? 'none' : `${color}08`}
          />
          {/* Tube Rim and Stopper/Cap */}
          <rect x="22" y="8" width="20" height="5" rx="1.5" fill={color} />
          {/* Liquid level (Blood sample) */}
          <path
            d="M24 30h16v18a8 8 0 0 1-16 0V30z"
            fill={watermark ? 'none' : `${color}25`}
          />
          {/* Graduation lines */}
          <path d="M30 20h4m-4 5h6m-6 5h4m-4 5h6m-6 5h4" strokeWidth="1" />
          {/* Biohazard / Safety Shield Protection surrounding tube */}
          <path
            d="M12 24c0 18 20 28 20 28s20-10 20-28V16L32 10 12 16v8z"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        </svg>
      );

    // 9. Médecin avec Stéthoscope & Accueil (Séance 9 : Accueil, orientation & communication)
    case 'medecin':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Doctor Head */}
          <circle cx="32" cy="18" r="9" fill={watermark ? 'none' : `${color}15`} />
          {/* Doctor Torso & Lab Coat Collar */}
          <path d="M16 52c0-8.8 7.2-16 16-16s16 7.2 16 16" />
          <path d="M26 36l6 8 6-8" />
          {/* Doctor Stethoscope */}
          <path
            d="M24 32v6a8 8 0 0 0 16 0v-6"
            strokeWidth={strokeWidth + 0.6}
          />
          {/* Stethoscope Earpieces */}
          <path d="M24 28v4m16-4v4" />
          {/* Stethoscope Chest Piece / Bell */}
          <circle cx="32" cy="46" r="3" fill={color} />
          {/* Communication / Empathy speech bubble */}
          <path
            d="M48 14a6 6 0 0 1 8 6c0 4-4 6-6 6v3l-3-3h-2"
            strokeWidth="1.2"
            opacity="0.8"
          />
        </svg>
      );

    // 10. Tenue Académique (Toque de Diplômé & Balance d'Éthique) (Séance 10 : Éthique & Secret)
    case 'tenue_academique':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Academic Mortarboard Cap (Top Diamond) */}
          <path
            d="M32 10L8 22l24 12 24-12L32 10z"
            fill={watermark ? 'none' : `${color}25`}
            strokeWidth={strokeWidth + 0.5}
          />
          {/* Cap Skull Cap under diamond */}
          <path d="M18 27v11c0 6 6 10 14 10s14-4 14-10V27" />
          {/* Tassel Button and Hanging Tassel */}
          <circle cx="32" cy="22" r="2" fill={color} />
          <path d="M32 22l18 8v12" strokeWidth={strokeWidth} />
          <rect x="48" y="42" width="4" height="6" rx="1" fill={color} />
          {/* Scales of Justice / Ethics Symbol Below */}
          <path d="M24 54h16m-8-6v6" opacity="0.8" />
          <path d="M22 50l4-6 4 6m8 0l4-6 4 6" opacity="0.6" strokeWidth="1" />
        </svg>
      );

    default:
      return null;
  }
};

// Helper to get emblem type for a given course session number or title
export function getCourseEmblemType(seanceNumber?: number, title?: string): {
  type: EmblemType;
  label: string;
  description: string;
} {
  switch (seanceNumber) {
    case 1:
      return {
        type: 'ambulance_samu',
        label: 'Voiture de SAMU',
        description: "Véhicule d'urgence médicale de première ligne et trousse d'intervention critique",
      };
    case 2:
      return {
        type: 'defibrillateur_dae',
        label: 'Défibrillateur DAE & Cœur',
        description: 'Appareil DAE et impulsion électrique de survie en réanimation',
      };
    case 3:
      return {
        type: 'seringue',
        label: "Seringue d'Urgence",
        description: "Seringue graduée d'injection d'adrénaline intramusculaire immédiate",
      };
    case 4:
      return {
        type: 'trace_ecg',
        label: 'Tracé ECG 12 Dérivations',
        description: 'Tracé électrocardiographique clinique avec ondes P-QRS-T et alertes coronariennes',
      };
    case 5:
      return {
        type: 'pansement',
        label: 'Pansement Stérile',
        description: 'Dispositif de pansement moderne avec compresse centrale et asepsie',
      };
    case 6:
      return {
        type: 'cerveau_neuro',
        label: 'Cerveau & Neurologie',
        description: 'Évaluation des réflexes de conscience et cotation du score de Glasgow',
      };
    case 7:
      return {
        type: 'caducee_sante',
        label: 'Caducée de la Santé',
        description: "Caducée d'Esculape et alliance soignant-patient en éducation pour la santé",
      };
    case 8:
      return {
        type: 'eprouvette_aes',
        label: 'Éprouvette & Prélèvement',
        description: "Éprouvette sécurisée de laboratoire pour la prévention des accidents d'exposition au sang",
      };
    case 9:
      return {
        type: 'medecin',
        label: 'Médecin & Stéthoscope',
        description: 'Examen clinique attentif, écoute active et communication apaisée',
      };
    case 10:
      return {
        type: 'tenue_academique',
        label: 'Tenue Académique & Éthique',
        description: 'Toque universitaire de formation certifiée et respect déontologique absolu',
      };
    default: {
      const lower = (title || '').toLowerCase();
      if (lower.includes('ecg')) {
        return {
          type: 'trace_ecg',
          label: 'Tracé ECG',
          description: 'Tracé électrocardiographique 12 dérivations',
        };
      }
      if (lower.includes('choc') || lower.includes('seringue')) {
        return {
          type: 'seringue',
          label: "Seringue d'Urgence",
          description: "Seringue d'injection d'urgence",
        };
      }
      if (lower.includes('aes') || lower.includes('sang')) {
        return {
          type: 'eprouvette_aes',
          label: 'Éprouvette & Sang',
          description: "Éprouvette et prévention des accidents d'exposition au sang",
        };
      }
      if (lower.includes('arrêt') || lower.includes('dae')) {
        return {
          type: 'defibrillateur_dae',
          label: 'Défibrillateur DAE',
          description: 'Défibrillateur automatisé externe',
        };
      }
      if (lower.includes('pansement')) {
        return {
          type: 'pansement',
          label: 'Pansement Stérile',
          description: 'Soin de plaies et pansement moderne',
        };
      }
      if (lower.includes('éthique') || lower.includes('secret')) {
        return {
          type: 'tenue_academique',
          label: 'Tenue Académique',
          description: 'Tenue académique et déontologie médicale',
        };
      }
      return {
        type: 'ambulance_samu',
        label: 'Voiture de SAMU',
        description: 'Intervention d’urgence médicale',
      };
    }
  }
}

/**
 * Returns standalone SVG markup string for any emblem type
 */
export function getEmblemSvgMarkup(type: EmblemType, color: string, size = 64): string {
  const c = color.startsWith('#') ? color : `#${color}`;
  let inner = '';

  switch (type) {
    case 'ambulance_samu':
      inner = `
        <path d="M6 42h4m36 0h8m-48 0V20a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v22M48 24h6l6 8v10h-12" />
        <circle cx="16" cy="44" r="5" fill="${c}20" />
        <circle cx="42" cy="44" r="5" fill="${c}20" />
        <path d="M26 23v10M21 28h10" stroke-width="2.6" />
        <path d="M24 16v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        <rect x="44" y="24" width="10" height="8" rx="1" />
        <path d="M2 50h60" stroke-dasharray="3 3" opacity="0.6" />
      `;
      break;
    case 'defibrillateur_dae':
      inner = `
        <path d="M32 54s-20-12.5-20-26a11 11 0 0 1 19-7.5l1 1 1-1a11 11 0 0 1 19 7.5c0 13.5-20 26-20 26z" fill="${c}15" />
        <path d="M34 16l-8 14h8l-6 16 14-18h-8l6-12z" fill="${c}" stroke-width="1" />
        <path d="M4 32h8l3-6 4 12 4-6h5" opacity="0.7" />
        <path d="M38 32h5l4-6 4 12 3-6h6" opacity="0.7" />
      `;
      break;
    case 'seringue':
      inner = `
        <path d="M12 52L4 60" stroke-width="2.3" />
        <path d="M16 48l-4 4" />
        <rect x="14" y="20" width="14" height="28" rx="2" transform="rotate(-45 21 34)" fill="${c}18" />
        <path d="M22 26l3 3m-1 5l3 3m-1 5l3 3" />
        <path d="M38 18l8-8" stroke-width="2.6" />
        <path d="M43 7l8 8" stroke-width="2.8" />
        <path d="M50 42c0 3-3 6-6 6s-6-3-6-6c0-3 6-9 6-9s6 6 6 9z" fill="${c}35" />
        <path d="M44 48v2" />
      `;
      break;
    case 'trace_ecg':
      inner = `
        <rect x="4" y="10" width="56" height="44" rx="6" fill="${c}12" />
        <path d="M4 22h56M4 34h56M4 46h56M16 10v44M28 10v44M40 10v44M52 10v44" stroke="${c}" stroke-width="0.5" stroke-dasharray="1 2" opacity="0.3" />
        <path d="M6 34h8 c2 0 3-4 5-4s3 4 5 4 h2 l2 4 4-22 4 30 3-12 h3 c3 0 4-7 6-7s4 7 7 7 h9" stroke="${c}" stroke-width="2.5" />
        <path d="M50 16a2.5 2.5 0 0 0-4 0 2.5 2.5 0 0 0-4 0c0 2 4 4 4 4s4-2 4-4z" fill="${c}" opacity="0.8" />
      `;
      break;
    case 'pansement':
      inner = `
        <rect x="8" y="22" width="48" height="20" rx="10" fill="${c}18" />
        <rect x="24" y="22" width="16" height="20" fill="${c}35" />
        <path d="M32 27v10M27 32h10" stroke-width="2.4" />
        <circle cx="15" cy="28" r="1.5" fill="${c}" />
        <circle cx="19" cy="32" r="1.5" fill="${c}" />
        <circle cx="15" cy="36" r="1.5" fill="${c}" />
        <circle cx="49" cy="28" r="1.5" fill="${c}" />
        <circle cx="45" cy="32" r="1.5" fill="${c}" />
        <circle cx="49" cy="36" r="1.5" fill="${c}" />
      `;
      break;
    case 'cerveau_neuro':
      inner = `
        <path d="M32 14c-4-4-10-3-14 0-5 4-5 10-2 15-4 4-3 11 1 15 0 4 3 8 7 8 3 0 6-2 8-5" fill="${c}15" />
        <path d="M32 14c4-4 10-3 14 0 5 4 5 10 2 15 4 4 3 11-1 15 0 4-3 8-7 8-3 0-6-2-8-5" fill="${c}15" />
        <path d="M32 14v34" stroke-width="2.3" />
        <path d="M22 22c3 2 4 5 2 8m16-8c-3 2-4 5-2 8" />
        <path d="M20 36c4 0 6 3 6 6m18-6c-4 0-6 3-6 6" />
      `;
      break;
    case 'caducee_sante':
      inner = `
        <path d="M32 8v48" stroke-width="2.6" />
        <path d="M29 8h6M30 56h4" />
        <path d="M26 16c4-3 8-1 9 2 2 4-4 7-7 9-4 2-5 6-3 9 2 4 9 3 11 0 2-3-2-7-6-8-4-2-6-6-4-9 2-3 8-2 10 1" stroke-width="2.4" />
        <path d="M20 28c-6 0-10-6-10-10 4 0 10 4 10 10zm24 0c6 0 10-6 10-10-4 0-10 4-10 10z" fill="${c}25" />
        <circle cx="32" cy="7" r="2.5" fill="${c}" />
      `;
      break;
    case 'eprouvette_aes':
      inner = `
        <path d="M24 12v36a8 8 0 0 0 16 0V12" fill="${c}12" />
        <rect x="22" y="8" width="20" height="5" rx="1.5" fill="${c}" />
        <path d="M24 30h16v18a8 8 0 0 1-16 0V30z" fill="${c}35" />
        <path d="M30 20h4m-4 5h6m-6 5h4" stroke-width="1.2" />
        <path d="M12 24c0 18 20 28 20 28s20-10 20-28V16L32 10 12 16v8z" stroke-dasharray="3 3" opacity="0.6" />
      `;
      break;
    case 'medecin':
      inner = `
        <circle cx="32" cy="18" r="9" fill="${c}20" />
        <path d="M16 52c0-8.8 7.2-16 16-16s16 7.2 16 16" />
        <path d="M26 36l6 8 6-8" />
        <path d="M24 32v6a8 8 0 0 0 16 0v-6" stroke-width="2.4" />
        <path d="M24 28v4m16-4v4" />
        <circle cx="32" cy="46" r="3" fill="${c}" />
        <path d="M48 14a6 6 0 0 1 8 6c0 4-4 6-6 6v3l-3-3h-2" opacity="0.8" />
      `;
      break;
    case 'tenue_academique':
      inner = `
        <path d="M32 10L8 22l24 12 24-12L32 10z" fill="${c}30" stroke-width="2.3" />
        <path d="M18 27v11c0 6 6 10 14 10s14-4 14-10V27" />
        <circle cx="32" cy="22" r="2" fill="${c}" />
        <path d="M32 22l18 8v12" stroke-width="1.8" />
        <rect x="48" y="42" width="4" height="6" rx="1" fill="${c}" />
        <path d="M24 54h16m-8-6v6" opacity="0.8" />
      `;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

/**
 * Converts any theme emblem SVG into a crisp PNG Uint8Array buffer for Word docx embedding
 */
export async function getEmblemPngBuffer(
  type: EmblemType,
  color: string,
  pixelSize = 128
): Promise<Uint8Array | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const svgMarkup = getEmblemSvgMarkup(type, color, pixelSize);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = pixelSize;
          canvas.height = pixelSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
          const dataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          const base64 = dataUrl.split(',')[1];
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          resolve(bytes);
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}
