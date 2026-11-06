import React from 'react';

export type WatermarkVariant = 'flag_official' | 'flag_seal' | 'flag_waving' | 'arms_tunisia';

interface Props {
  opacity?: number;
  size?: number; // width in px
  variant?: WatermarkVariant;
  className?: string;
}

export const TunisianWatermark: React.FC<Props> = ({
  opacity = 0.11,
  size = 460,
  variant = 'flag_official',
  className = '',
}) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {variant === 'flag_official' && (
        /* ============================================================== */
        /* 1. OFFICIAL RECTANGULAR TUNISIAN FLAG (علم الجمهورية التونسية)   */
        /* ============================================================== */
        <svg
          viewBox="0 0 600 400"
          width={size}
          height={Math.round((size * 2) / 3)}
          className="max-w-[85%] max-h-[85%] object-contain filter drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Outer Border for certificate security */}
          <rect
            x="48"
            y="28"
            width="504"
            height="344"
            rx="12"
            fill="none"
            stroke="#E70013"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Official Flag Red Field (Rouge Tunisien #E70013) */}
          <rect
            x="54"
            y="34"
            width="492"
            height="332"
            rx="8"
            fill="#E70013"
          />

          {/* Central White Disc (Disque blanc au centre) */}
          <circle cx="300" cy="200" r="82" fill="#FFFFFF" />

          {/* Red Crescent (Croissant rouge) - Clean geometric path without masks */}
          {/* Outer arc: R=60. Inner arc: R=50 shifted right to cx=314 */}
          <path
            d="
              M 300 140
              A 60 60 0 1 0 300 260
              A 50 50 0 1 1 300 140
              Z
            "
            fill="#E70013"
          />

          {/* Red 5-pointed Star (Étoile rouge à 5 branches) */}
          <polygon
            points="
              325,170
              331.5,188
              350,188
              335,199
              341,217
              325,206
              309,217
              315,199
              300,188
              318.5,188
            "
            fill="#E70013"
          />
        </svg>
      )}

      {variant === 'flag_seal' && (
        /* ============================================================== */
        /* 2. OFFICIAL ROUND FLAG SEAL & SECURITY GUILLOCHE               */
        /* ============================================================== */
        <svg
          viewBox="0 0 600 600"
          width={size}
          height={size}
          className="max-w-[85%] max-h-[85%] object-contain"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric Guilloche Security Circles */}
          <circle cx="300" cy="300" r="280" fill="none" stroke="#E70013" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="300" cy="300" r="270" fill="none" stroke="#E70013" strokeWidth="0.75" />
          <circle cx="300" cy="300" r="260" fill="none" stroke="#E70013" strokeWidth="3" />
          <circle cx="300" cy="300" r="215" fill="none" stroke="#E70013" strokeWidth="1" strokeDasharray="5 3" />
          <circle cx="300" cy="300" r="205" fill="none" stroke="#E70013" strokeWidth="0.75" />

          {/* Central Flag Cockade (Round flag) */}
          <circle cx="300" cy="300" r="195" fill="#E70013" />
          <circle cx="300" cy="300" r="105" fill="#FFFFFF" />

          {/* Red Crescent in Cockade */}
          <path
            d="
              M 300 225
              A 75 75 0 1 0 300 375
              A 62 62 0 1 1 300 225
              Z
            "
            fill="#E70013"
          />

          {/* Red Star in Cockade */}
          <polygon
            points="
              332,262
              340,285
              364,285
              345,299
              352,322
              332,308
              312,322
              319,299
              300,285
              324,285
            "
            fill="#E70013"
          />

          {/* Top Inscription Arc: RÉPUBLIQUE TUNISIENNE */}
          <path id="seal-top-text-path" d="M 75,300 A 225,225 0 0,1 525,300" fill="none" />
          <text fill="#E70013" fontSize="17" fontWeight="bold" letterSpacing="5">
            <textPath href="#seal-top-text-path" startOffset="50%" textAnchor="middle">
              ★ RÉPUBLIQUE TUNISIENNE ★
            </textPath>
          </text>

          {/* Bottom Inscription Arc: MINISTÈRE DE LA SANTÉ */}
          <path id="seal-bottom-text-path" d="M 525,300 A 225,225 0 0,1 75,300" fill="none" />
          <text fill="#E70013" fontSize="15" fontWeight="bold" letterSpacing="4">
            <textPath href="#seal-bottom-text-path" startOffset="50%" textAnchor="middle">
              MINISTÈRE DE LA SANTÉ • GSB TUNIS SUD
            </textPath>
          </text>
        </svg>
      )}

      {variant === 'flag_waving' && (
        /* ============================================================== */
        /* 3. DYNAMIC WAVING FLAG WITH SILK FOLDS (DRAPEAU FLOTTANT)     */
        /* ============================================================== */
        <svg
          viewBox="0 0 600 400"
          width={size}
          height={Math.round((size * 2) / 3)}
          className="max-w-[85%] max-h-[85%] object-contain filter drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flag Pole (subtle silver staff) */}
          <rect x="36" y="25" width="8" height="350" rx="3" fill="#888888" opacity="0.4" />
          <circle cx="40" cy="25" r="7" fill="#DAA520" opacity="0.6" />

          {/* Waving Flag Body */}
          <path
            d="
              M 44,45
              C 180,25 320,65 540,45
              L 540,325
              C 320,345 180,305 44,325
              Z
            "
            fill="#E70013"
          />

          {/* Silk Wave Shading Highlight */}
          <path
            d="
              M 44,45
              C 180,25 320,65 540,45
              L 540,185
              C 320,205 180,165 44,185
              Z
            "
            fill="#FFFFFF"
            opacity="0.12"
          />

          {/* Shadow Fold */}
          <path
            d="
              M 200,40
              C 260,50 280,60 340,55
              L 340,335
              C 280,340 260,330 200,320
              Z
            "
            fill="#000000"
            opacity="0.08"
          />

          {/* Central White Disc */}
          <circle cx="290" cy="185" r="75" fill="#FFFFFF" />

          {/* Red Crescent */}
          <path
            d="
              M 290 130
              A 55 55 0 1 0 290 240
              A 45 45 0 1 1 290 130
              Z
            "
            fill="#E70013"
          />

          {/* Red Star */}
          <polygon
            points="
              312,157
              318,173
              335,173
              321,183
              327,200
              312,190
              297,200
              303,183
              289,173
              306,173
            "
            fill="#E70013"
          />
        </svg>
      )}

      {variant === 'arms_tunisia' && (
        /* ============================================================== */
        /* 4. COAT OF ARMS OF TUNISIA (ARMOIRIES DE LA TUNISIE)            */
        /* ============================================================== */
        <svg
          viewBox="0 0 500 550"
          width={Math.round((size * 5) / 6)}
          height={size}
          className="max-w-[80%] max-h-[85%] object-contain"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Flag Crescent & Star */}
          <circle cx="250" cy="65" r="45" fill="#FFFFFF" stroke="#E70013" strokeWidth="1" />
          <path
            d="
              M 250 32
              A 33 33 0 1 0 250 98
              A 27 27 0 1 1 250 32
              Z
            "
            fill="#E70013"
          />
          <polygon
            points="
              263,49
              267,59
              278,59
              269,65
              273,75
              263,69
              253,75
              257,65
              248,59
              259,59
            "
            fill="#E70013"
          />

          {/* Shield Outline (Blason doré / rouge) */}
          <path
            d="
              M 100,120
              L 400,120
              C 400,280 370,410 250,470
              C 130,410 100,280 100,120
              Z
            "
            fill="none"
            stroke="#E70013"
            strokeWidth="4"
          />
          <path
            d="
              M 110,128
              L 390,128
              C 390,275 362,398 250,455
              C 138,398 110,275 110,128
              Z
            "
            fill="none"
            stroke="#DAA520"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Horizontal Divider Line in Shield */}
          <line x1="105" y1="260" x2="395" y2="260" stroke="#E70013" strokeWidth="2.5" />
          {/* Vertical Divider in Bottom Half */}
          <line x1="250" y1="260" x2="250" y2="470" stroke="#E70013" strokeWidth="2.5" />

          {/* Top Section: Punic Galley Ship (Navire Carthaginois / Liberté) */}
          <g stroke="#E70013" strokeWidth="2.5" fill="none">
            {/* Waves */}
            <path d="M 160,240 Q 200,246 250,240 T 340,240" />
            <path d="M 180,247 Q 215,252 250,247 T 320,247" />
            {/* Hull */}
            <path d="M 160,225 C 190,240 310,240 340,215 L 325,232 C 290,242 200,242 175,232 Z" fill="#E70013" />
            {/* Mast and Sail */}
            <line x1="250" y1="150" x2="250" y2="225" />
            <path d="M 250,155 C 290,170 290,200 250,215 Z" fill="#E70013" fillOpacity="0.3" />
            <path d="M 250,155 C 210,170 210,200 250,215 Z" fill="#E70013" fillOpacity="0.2" />
          </g>

          {/* Bottom Left: Scales of Justice (Balance / Justice) */}
          <g stroke="#E70013" strokeWidth="2" fill="none" transform="translate(130, 280)">
            <line x1="45" y1="15" x2="45" y2="95" strokeWidth="3" />
            <line x1="25" y1="95" x2="65" y2="95" strokeWidth="3" />
            <line x1="10" y1="30" x2="80" y2="30" strokeWidth="3" />
            {/* Left Pan */}
            <line x1="15" y1="30" x2="5" y2="60" />
            <line x1="30" y1="30" x2="35" y2="60" />
            <path d="M 5,60 Q 20,72 35,60 Z" fill="#E70013" fillOpacity="0.4" />
            {/* Right Pan */}
            <line x1="60" y1="30" x2="55" y2="60" />
            <line x1="75" y1="30" x2="85" y2="60" />
            <path d="M 55,60 Q 70,72 85,60 Z" fill="#E70013" fillOpacity="0.4" />
          </g>

          {/* Bottom Right: Lion holding a scimitar sword (Lion avec sabre / Ordre) */}
          <g stroke="#E70013" strokeWidth="2" fill="none" transform="translate(270, 280)">
            {/* Lion Mane and Body outline */}
            <path
              d="
                M 35,70
                C 30,50 45,35 60,35
                C 75,35 90,45 85,65
                C 80,85 70,105 45,105
                C 30,105 25,95 25,85
              "
              fill="#E70013"
              fillOpacity="0.25"
            />
            {/* Sword / Sabre */}
            <line x1="75" y1="30" x2="110" y2="15" strokeWidth="3" stroke="#E70013" />
            <path d="M 110,15 Q 120,20 115,25 Z" fill="#E70013" />
          </g>

          {/* Ribbon with National Motto: حرية - نظام - عدالة */}
          <g transform="translate(0, 480)">
            <rect x="130" y="0" width="240" height="32" rx="6" fill="#FFFFFF" stroke="#E70013" strokeWidth="2" />
            <text x="250" y="21" textAnchor="middle" fill="#E70013" fontSize="13" fontWeight="bold">
              حرية - نظام - عدالة • LIBERTÉ - ORDRE - JUSTICE
            </text>
          </g>
        </svg>
      )}
    </div>
  );
};
