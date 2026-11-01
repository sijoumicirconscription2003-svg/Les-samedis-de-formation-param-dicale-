import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Target,
  Sparkles,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { TrainingSession, Registration } from '../types';

interface Props {
  training: TrainingSession | null;
  registration?: Registration;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (training: TrainingSession) => void;
  onCancelBooking?: (trainingId: string) => void;
  bookingLoading: boolean;
}

export const TrainingDetailModal: React.FC<Props> = ({
  training,
  registration,
  isOpen,
  onClose,
  onConfirmBooking,
  onCancelBooking,
  bookingLoading,
}) => {
  if (!isOpen || !training) return null;

  const isConfirmed = registration?.statut === 'CONFIRMEE';
  const isWaitlisted = registration?.statut === 'LISTE_ATTENTE';
  const isCancelled = registration?.statut === 'ANNULEE';
  const hasRegistered = !!registration && !isCancelled;

  const isFull = (training.placesRestantes || 0) <= 0;
  const deadlinePassed =
    training.dateLimiteInscription &&
    new Date(training.dateLimiteInscription).getTime() < Date.now();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#0F2F57] to-[#123966] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
            {training.numeroSeance && (
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-xs">
                Séance #{training.numeroSeance}
              </span>
            )}
            {training.domaine && (
              <span className="px-2.5 py-0.5 rounded-lg bg-white/20 text-white font-extrabold text-xs">
                {training.domaine}
              </span>
            )}
            <span>•</span>
            <span>Centre Intermédiaire Ali Trad</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
            {training.theme}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5 capitalize text-amber-200">
              <Calendar className="w-4 h-4 text-amber-400" />
              {formatDate(training.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              {training.heureDebut} - {training.heureFin} ({training.dureeHeures})
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status banner */}
          {isConfirmed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-900">
                    Votre participation est confirmée !
                  </div>
                  <div className="text-xs text-emerald-700">
                    Numéro de réservation : {registration?.numeroReservation}
                  </div>
                </div>
              </div>
              {onCancelBooking && (
                <button
                  onClick={() => onCancelBooking(training.id)}
                  disabled={bookingLoading}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold underline px-2 py-1"
                >
                  Se désister
                </button>
              )}
            </div>
          )}

          {isWaitlisted && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-amber-900">
                    Vous êtes sur liste d'attente (Position #{registration?.positionAttente})
                  </div>
                  <div className="text-xs text-amber-700">
                    Vous recevrez une notification instantanée dès qu'une place se libère.
                  </div>
                </div>
              </div>
              {onCancelBooking && (
                <button
                  onClick={() => onCancelBooking(training.id)}
                  disabled={bookingLoading}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold underline px-2 py-1"
                >
                  Annuler
                </button>
              )}
            </div>
          )}

          {/* Places indicators */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <div>
              <div className="text-xs text-slate-500 font-medium">Capacité totale</div>
              <div className="text-lg font-bold text-slate-800">{training.capaciteMax || 25}</div>
              <div className="text-[10px] text-slate-400">places max</div>
            </div>
            <div className="border-x border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Places réservées</div>
              <div className="text-lg font-bold text-[#0A2540]">{training.placesReservees || 0}</div>
              <div className="text-[10px] text-slate-400">confirmées</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Places restantes</div>
              <div
                className={`text-lg font-bold ${
                  (training.placesRestantes || 0) > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {training.placesRestantes || 0}
              </div>
              <div className="text-[10px] text-slate-400">disponibles</div>
            </div>
          </div>

          {/* Formateur & Lieu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Formateur(s)
              </div>
              <div className="font-bold text-slate-800 text-sm">{training.formateur}</div>
              {training.qualiteFormateur && (
                <div className="text-xs text-slate-500 mt-0.5">{training.qualiteFormateur}</div>
              )}
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                Lieu de Formation
              </div>
              <div className="font-bold text-slate-800 text-sm">
                {training.lieu || 'Salle de réunion du Centre Intermédiaire Ali Trad'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                GSB Tunis Sud • Circonscription Sijoumi
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-[#0A2540] mb-2 flex items-center gap-1.5">
              <span>Description et Contexte Clinique</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {training.description || 'Formation continue paramédicale du samedi.'}
            </p>
          </div>

          {/* Objectifs pédagogiques */}
          {training.objectifs && training.objectifs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Objectifs Pédagogiques</span>
              </h3>
              <ul className="space-y-2">
                {training.objectifs.map((obj, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Consignes aux participants (Direction des Soins) */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <Clock className="w-4 h-4 text-blue-600" />
              Consignes aux participants (Direction des Soins)
            </div>
            <ul className="space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-800 shrink-0">• Ponctualité :</span>
                <span>Les séances débutent à 12h30 précises afin d’assurer les 60 minutes d’échanges.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-800 shrink-0">• Émargement :</span>
                <span>Le pointage de présence (début et fin de séance par QR Code) est obligatoire à chaque session pour valider l’attestation officielle.</span>
              </li>
            </ul>
          </div>

          {/* Double pointage note */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Contrôle des Présences et Attestation
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              La délivrance de l'attestation officielle de FMC est strictement conditionnée par le scan du <strong>QR Code d'Arrivée</strong> au début de la formation ET du <strong>QR Code de Fin de Séance</strong> à la clôture.
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {training.dateLimiteInscription && (
              <span>
                Limite d'inscription : {new Date(training.dateLimiteInscription).toLocaleDateString('fr-FR')} à {new Date(training.dateLimiteInscription).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Fermer
            </button>

            {!hasRegistered && !deadlinePassed && (
              <button
                onClick={() => onConfirmBooking(training)}
                disabled={bookingLoading}
                className={`w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  isFull
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#0A2540] hover:bg-[#0F2F57]'
                } disabled:opacity-50`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {bookingLoading
                  ? 'Réservation en cours...'
                  : isFull
                  ? "S'INSCRIRE SUR LISTE D'ATTENTE"
                  : 'CONFIRMER MA PARTICIPATION'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
