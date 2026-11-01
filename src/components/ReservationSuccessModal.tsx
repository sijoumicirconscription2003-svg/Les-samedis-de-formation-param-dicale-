import React from 'react';
import { CheckCircle2, Calendar, Clock, MapPin, Hash, Download, Check, Sparkles, X } from 'lucide-react';
import { TrainingSession, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  training: TrainingSession;
  user: UserProfile;
  reservationNumber: string;
}

export const ReservationSuccessModal: React.FC<Props> = ({
  isOpen,
  onClose,
  training,
  user,
  reservationNumber,
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF9F5] rounded-3xl shadow-2xl border-2 border-amber-400/40 overflow-hidden my-8">
        {/* Top green/gold celebration band */}
        <div className="bg-gradient-to-r from-emerald-600 via-[#0A2540] to-emerald-700 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 border-2 border-amber-300 flex items-center justify-center shadow-lg mb-3">
            <CheckCircle2 className="w-10 h-10 text-amber-300" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Validation Instantanée
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-white leading-snug">
            FÉLICITATIONS ! VOTRE INSCRIPTION EST CONFIRMÉE.<br />
            VOTRE PLACE EST RÉSERVÉE.
          </h2>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* Official badge box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Statut de réservation
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold tracking-wide">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                CONFIRMÉE
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-400 block mb-0.5">
                Participant(e) :
              </span>
              <div className="text-base font-bold text-[#0A2540]">
                {user.prenom} {user.nom}
              </div>
              <div className="text-xs text-slate-500">
                {user.fonction} • Matricule : <strong className="text-slate-700">{user.matricule}</strong>
              </div>
              <div className="text-xs text-slate-500">{user.etablissement}</div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-400 block mb-0.5">
                Intitulé de la formation :
              </span>
              <div className="text-sm font-bold text-slate-800 leading-snug">
                {training.theme}
              </div>
              <div className="text-xs text-amber-700 font-medium mt-0.5">
                Formateur : {training.formateur}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-start gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-[#0A2540] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 capitalize">
                    {formatDate(training.date)}
                  </div>
                  <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {training.heureDebut} - {training.heureFin}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">
                    {training.lieu || 'Centre Intermédiaire Ali Trad'}
                  </div>
                  <div className="text-slate-500">GSB Tunis Sud</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-amber-300 flex items-center justify-between bg-amber-50/70 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-medium text-amber-900">N° de Réservation :</span>
              </div>
              <span className="font-mono font-bold text-sm text-[#0A2540] bg-white px-2.5 py-1 rounded-md border border-amber-200">
                {reservationNumber}
              </span>
            </div>
          </div>

          {/* Practical reminder */}
          <div className="text-xs text-slate-600 bg-blue-50/70 border border-blue-200/70 p-3.5 rounded-xl space-y-1">
            <div className="font-semibold text-[#0A2540] flex items-center gap-1.5">
              <span>Rappel pour le jour de la formation :</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Le double pointage par QR Code est obligatoire : un scan à l'arrivée (dès 08h30) et un scan à la fin de la séance pour l'obtention de votre attestation officielle A4.
            </p>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-semibold text-sm rounded-xl shadow-md transition-all text-center"
            >
              Consulter mes réservations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
