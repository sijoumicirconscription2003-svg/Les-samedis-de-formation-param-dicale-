import { Award, Shield, MapPin, Building2, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  onOpenPublicRegistration?: (trainingId: string) => void;
}

export const InstitutionalBanner: React.FC<Props> = ({ onOpenPublicRegistration }) => {
  return (
    <header className="bg-gradient-to-r from-[#0A2540] via-[#0F2F57] to-[#123966] text-white border-b-2 border-amber-500/30 shadow-md">
      {/* Top micro bar with Republic & Health Ministry */}
      <div className="bg-[#07192C] text-xs py-1.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/40" />
            <span className="font-semibold text-slate-200 tracking-wide">
              RÉPUBLIQUE TUNISIENNE — MINISTÈRE DE LA SANTÉ
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-300">
              Direction Régionale de la Santé de Tunis
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-amber-300/90 font-medium">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Plateforme Officielle Certifiée
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline text-slate-300">Sessions du Samedi</span>
          </div>
        </div>
      </div>

      {/* Main institutional brand header */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Emblem / Caduceus Crest */}
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-xl bg-gradient-to-br from-amber-400/20 via-white/10 to-amber-500/20 border border-amber-400/40 p-2 flex items-center justify-center shadow-inner shrink-0 relative group">
              <div className="w-full h-full rounded-lg bg-[#0A2540] flex flex-col items-center justify-center border border-amber-300/30">
                <Award className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                <span className="text-[9px] font-bold text-amber-300 tracking-tighter leading-none mt-0.5">
                  FMC
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold tracking-wider uppercase">
                <span>Groupement de Santé de Base de Tunis Sud</span>
                <span className="text-white/40">•</span>
                <span>Circonscription Sanitaire de Sijoumi</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Centre Intermédiaire Ali Trad</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-0.5">
                <span className="text-amber-400 font-medium">Formations Continues Paramédicales</span>
                <span className="text-white/30">—</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  Salle de réunion • Tous les samedis
                </span>
              </p>
            </div>
          </div>

          {/* Quick stats or info tag */}
          <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <div className="text-right border-r border-white/10 pr-3">
              <div className="text-xs text-slate-400">Gestion des Présences</div>
              <div className="text-sm font-semibold text-amber-300">Double Pointage QR Code</div>
            </div>
            <div className="pl-1 text-slate-300 text-xs">
              <div className="font-medium text-white flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                GSB Tunis Sud
              </div>
              <div className="text-[11px] text-slate-400">Attestations officielles A4</div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Inscription Banner for Séance #3 */}
      {onOpenPublicRegistration && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 border-t border-amber-300 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#0A2540] text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                INSCRIPTION OUVERTE
              </span>
              <span className="font-medium text-slate-950">
                <strong>Séance #3 • Samedi 7 Novembre 2026 :</strong> Urgences fréquentes : Choc anaphylactique & malaise vagal (Mme Hamdani Inès)
              </span>
            </div>

            <button
              onClick={() => onOpenPublicRegistration('training-fmc-s03')}
              className="px-3.5 py-1.5 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
            >
              <span>Accéder au Formulaire d'Inscription</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
