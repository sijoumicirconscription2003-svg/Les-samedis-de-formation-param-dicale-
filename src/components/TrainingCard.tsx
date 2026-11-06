import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  QrCode,
  Tv,
  Award,
  BookOpen,
  Layers,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { TrainingSession, Registration } from '../types';
import { getCourseTheme } from '../data/courseThemes';
import { ThemeEmblem } from './ThemeEmblems';

interface Props {
  training: TrainingSession;
  registration?: Registration;
  onOpenDetails: (training: TrainingSession) => void;
  onConfirmBooking: (training: TrainingSession) => void;
  onOpenScan?: (training: TrainingSession) => void;
  onOpenAttendance?: (training: TrainingSession) => void;
  onOpenTemplates?: (training: TrainingSession) => void;
  onOpenPublicRegistration?: (trainingId: string) => void;
  bookingLoading: boolean;
}

export const TrainingCard: React.FC<Props> = ({
  training,
  registration,
  onOpenDetails,
  onConfirmBooking,
  onOpenScan,
  onOpenAttendance,
  onOpenTemplates,
  onOpenPublicRegistration,
  bookingLoading,
}) => {
  const subjectTheme = getCourseTheme(training.numeroSeance, training.theme);
  const isConfirmed = registration?.statut === 'CONFIRMEE';
  const isWaitlisted = registration?.statut === 'LISTE_ATTENTE';
  const isCancelled = registration?.statut === 'ANNULEE';
  const hasRegistered = !!registration && !isCancelled;

  const totalCap = training.capaciteMax || 32;
  const reserved = training.placesReservees || 0;
  const remaining = Math.max(0, training.placesRestantes ?? (totalCap - reserved));
  const isFull = remaining <= 0;

  const percentBooked = Math.min(100, Math.round((reserved / totalCap) * 100));

  const deadlinePassed =
    training.dateLimiteInscription &&
    new Date(training.dateLimiteInscription).getTime() < Date.now();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      {/* Thematic Header Bar for the Course Subject */}
      <div
        className="px-5 py-2.5 flex items-center justify-between border-b text-xs font-bold"
        style={{
          backgroundColor: subjectTheme.bgTint,
          borderColor: `${subjectTheme.borderColor}30`,
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
            style={{
              backgroundColor: subjectTheme.badgeBg,
              border: `1px solid ${subjectTheme.borderColor}50`,
            }}
          >
            <ThemeEmblem
              type={subjectTheme.emblemType || 'ambulance_samu'}
              size={18}
              color={subjectTheme.primaryColor}
            />
          </span>
          <span className="truncate text-[11px] uppercase tracking-wide font-extrabold" style={{ color: subjectTheme.primaryColor }}>
            Thème : {subjectTheme.emblemLabel} • {subjectTheme.themeTagline}
          </span>
        </div>

        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 border"
          style={{
            backgroundColor: subjectTheme.badgeBg,
            color: subjectTheme.badgeText,
            borderColor: `${subjectTheme.borderColor}40`,
          }}
        >
          {subjectTheme.medicalDomain}
        </span>
      </div>

      {/* Top Banner with date tag & status */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {training.numeroSeance && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#0A2540] text-amber-300 font-extrabold text-xs tracking-tight shadow-xs">
                Séance #{training.numeroSeance}
              </span>
            )}
            {training.domaine && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                training.domaine.includes('URGENCE')
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : training.domaine.includes('SÉCURITÉ')
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : training.domaine.includes('SOINS')
                  ? 'bg-teal-100 text-teal-800 border border-teal-200'
                  : training.domaine.includes('PRÉVENTION')
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : training.domaine.includes('PRATIQUE')
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : training.domaine.includes('RELATION')
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {training.domaine}
              </span>
            )}
          </div>

          {/* Saturday Date Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-[#0A2540] text-xs font-bold capitalize border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            {formatDate(training.date)}
          </div>
        </div>

        {/* Registration status badge */}
        <div className="mb-2">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Inscrit • Réf: {registration?.numeroReservation}
            </span>
          ) : isWaitlisted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Liste d'attente #{registration?.positionAttente}
            </span>
          ) : deadlinePassed ? (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
              Inscriptions closes
            </span>
          ) : isFull ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
              Formation complète
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              {remaining} {remaining > 1 ? 'places disponibles' : 'place disponible'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetails(training)}
          className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0A2540] transition-colors leading-snug cursor-pointer line-clamp-2"
        >
          {training.theme}
        </h3>

        {/* Thematic Subject Presentation */}
        <div
          className="mt-3 p-3 rounded-2xl border text-xs space-y-2 transition-all"
          style={{
            backgroundColor: subjectTheme.bgTint,
            borderColor: `${subjectTheme.borderColor}30`,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10.5px] font-extrabold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: subjectTheme.primaryColor }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Présentation du Sujet
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.2 rounded"
              style={{
                backgroundColor: subjectTheme.badgeBg,
                color: subjectTheme.badgeText,
              }}
            >
              Thème #{subjectTheme.seanceNumber}
            </span>
          </div>

          <p className="text-[11.5px] text-slate-700 leading-relaxed line-clamp-2">
            {subjectTheme.themePresentation}
          </p>

          {/* Key theme concepts / competencies */}
          <div className="flex flex-wrap gap-1 pt-1">
            {subjectTheme.keyConcepts.slice(0, 3).map((concept, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-white/95 text-slate-700 border border-slate-200/90 shadow-2xs"
              >
                • {concept}
              </span>
            ))}
          </div>
        </div>

        {/* Formateur & Horaires */}
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-slate-700">
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span
              className={`font-medium ${
                (training.formateurs && training.formateurs.length > 0) || training.formateur
                  ? 'text-slate-900'
                  : 'text-slate-400 italic'
              }`}
            >
              {training.formateurs && training.formateurs.length > 1
                ? `Formateurs (${training.formateurs.length}) : ${training.formateurs.map((f) => f.nom).join(', ')}`
                : training.formateurs && training.formateurs.length === 1
                ? `Formateur : ${training.formateurs[0].nom}${training.formateurs[0].qualite ? ` (${training.formateurs[0].qualite})` : ''}`
                : training.formateur
                ? `Formateur : ${training.formateur}`
                : 'Formateur : À désigner (à remplir ultérieurement)'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {training.heureDebut} - {training.heureFin} ({training.dureeHeures})
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
              <span>Centre Ali Trad</span>
            </div>
          </div>
        </div>

        {/* Real-time gauge for seats */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Capacité : <strong className="text-slate-700">{totalCap} places</strong>
            </span>
            <span className="font-semibold text-slate-700">
              {reserved} réservées ({remaining} restantes)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFull
                  ? 'bg-rose-500'
                  : percentBooked > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentBooked}%` }}
            />
          </div>

          {training.nbListeAttente > 0 && (
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              {training.nbListeAttente} personne(s) sur liste d'attente
            </div>
          )}
        </div>
      </div>

      {/* Card Footer with CTA buttons */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenDetails(training)}
            className="text-xs font-semibold text-slate-600 hover:text-[#0A2540] transition-colors py-2 px-2.5 rounded-xl hover:bg-slate-200/60"
          >
            Détails
          </button>

          {onOpenAttendance && (
            <button
              onClick={() => onOpenAttendance(training)}
              className="text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors py-2 px-2.5 rounded-xl flex items-center gap-1 shadow-2xs"
              title="Consulter les personnes enregistrées, présents et absents"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Présences</span>
            </button>
          )}

          {onOpenTemplates && (
            <button
              onClick={() => onOpenTemplates(training)}
              className="text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors py-2 px-2.5 rounded-xl flex items-center gap-1 shadow-2xs"
              title="Afficher les modèles élégants Full HD (1080p)"
            >
              <Tv className="w-3.5 h-3.5 text-amber-600" />
              <span>Modèles HD</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenPublicRegistration && (
            <button
              onClick={() => onOpenPublicRegistration(training.id)}
              className="px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Ouvrir la page publique d'inscription (sans compte ni mot de passe)"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-700" />
              <span>Page Publique</span>
            </button>
          )}

          {isConfirmed ? (
            <div className="flex items-center gap-2">
              {onOpenScan && (training.pointageArriveeOuvert || training.pointageSortieOuvert) && (
                <button
                  onClick={() => onOpenScan(training)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Scanner Présence
                </button>
              )}
              <span className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Place Confirmée
              </span>
            </div>
          ) : isWaitlisted ? (
            <span className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-100 rounded-xl">
              Sur liste d'attente
            </span>
          ) : deadlinePassed ? (
            <span className="text-xs text-slate-400 font-medium px-3 py-2">
              Inscriptions closes
            </span>
          ) : (
            <button
              onClick={() => onConfirmBooking(training)}
              disabled={bookingLoading}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                isFull
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#0A2540] hover:bg-[#0F2F57]'
              } disabled:opacity-50 cursor-pointer`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {bookingLoading
                ? 'Enregistrement...'
                : isFull
                ? "S'INSCRIRE SUR LISTE D'ATTENTE"
                : 'CONFIRMER MA PARTICIPATION'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
