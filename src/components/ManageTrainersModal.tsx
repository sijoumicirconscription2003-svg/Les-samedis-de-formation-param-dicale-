import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { TrainingSession, FormateurItem } from '../types';
import {
  updateTrainingTrainers,
  applyTrainersToMultipleTrainings,
} from '../services/trainingService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trainings: TrainingSession[];
  onSuccessNotification?: (message: string) => void;
}

export const ManageTrainersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trainings,
  onSuccessNotification,
}) => {
  // Sort trainings by date / numeroSeance
  const sortedTrainings = [...trainings].sort((a, b) => {
    return (a.numeroSeance || 0) - (b.numeroSeance || 0) || a.date.localeCompare(b.date);
  });

  // Local state for inline adding per training
  const [activeAddingId, setActiveAddingId] = useState<string | null>(null);
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerQuality, setNewTrainerQuality] = useState('');

  // Local state for batch modal
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchTrainerName, setBatchTrainerName] = useState('');
  const [batchTrainerQuality, setBatchTrainerQuality] = useState('');

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  // Helper to extract trainers array from a training session
  const getTrainers = (t: TrainingSession): FormateurItem[] => {
    if (t.formateurs && t.formateurs.length > 0) {
      return t.formateurs;
    }
    if (t.formateur && t.formateur.trim()) {
      return [{ nom: t.formateur, qualite: t.qualiteFormateur || '' }];
    }
    return [];
  };

  // Add a trainer to a specific training
  const handleAddTrainer = async (training: TrainingSession) => {
    if (!newTrainerName.trim()) return;
    setLoadingId(training.id);
    try {
      const current = getTrainers(training);
      const updated: FormateurItem[] = [
        ...current,
        {
          nom: newTrainerName.trim(),
          qualite: newTrainerQuality.trim(),
        },
      ];
      await updateTrainingTrainers(training.id, updated);
      setNewTrainerName('');
      setNewTrainerQuality('');
      setActiveAddingId(null);
      setFeedback({
        type: 'success',
        message: `Formateur ajouté avec succès à la séance #${training.numeroSeance || ''} (${training.theme}).`,
      });
      if (onSuccessNotification) {
        onSuccessNotification(`Formateur ajouté à la séance #${training.numeroSeance || ''}`);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de l’ajout du formateur.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Remove a trainer from a specific training
  const handleRemoveTrainer = async (training: TrainingSession, indexToRemove: number) => {
    setLoadingId(training.id);
    try {
      const current = getTrainers(training);
      const updated = current.filter((_, idx) => idx !== indexToRemove);
      await updateTrainingTrainers(training.id, updated);
      setFeedback({
        type: 'success',
        message: `Formateur supprimé de la séance #${training.numeroSeance || ''}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Clear all trainers for a specific training
  const handleClearTrainers = async (training: TrainingSession) => {
    setLoadingId(training.id);
    try {
      await updateTrainingTrainers(training.id, []);
      setFeedback({
        type: 'success',
        message: `Formateurs vidés pour la séance #${training.numeroSeance || ''}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Apply trainers from this training to all other trainings
  const handleDuplicateToAll = async (sourceTraining: TrainingSession) => {
    const sourceTrainers = getTrainers(sourceTraining);
    setLoadingId('all');
    try {
      const allIds = sortedTrainings.map((t) => t.id);
      await applyTrainersToMultipleTrainings(allIds, sourceTrainers);
      setFeedback({
        type: 'success',
        message: `L'équipe de formation a été appliquée à l'ensemble des ${sortedTrainings.length} séances restantes.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la duplication.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Batch assign a trainer to all remaining sessions
  const handleBatchAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTrainerName.trim()) return;
    setLoadingId('batch');
    try {
      const newTrainer: FormateurItem = {
        nom: batchTrainerName.trim(),
        qualite: batchTrainerQuality.trim(),
      };
      const allIds = sortedTrainings.map((t) => t.id);
      await applyTrainersToMultipleTrainings(allIds, [newTrainer]);
      setBatchTrainerName('');
      setBatchTrainerQuality('');
      setIsBatchOpen(false);
      setFeedback({
        type: 'success',
        message: `Le formateur "${newTrainer.nom}" a été attribué à toutes les ${sortedTrainings.length} séances.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de l’attribution collective.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Batch clear all trainers across all sessions
  const handleBatchClearAll = async () => {
    setLoadingId('clearAll');
    try {
      const allIds = sortedTrainings.map((t) => t.id);
      await applyTrainersToMultipleTrainings(allIds, []);
      setFeedback({
        type: 'success',
        message: `Tous les formateurs ont été effacés sur les ${sortedTrainings.length} séances. Toutes les cases sont vides.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression collective.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0A2540] to-[#133E68] text-white flex items-start sm:items-center justify-between gap-4 border-b border-amber-500/30 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Gestionnaire Multi-Formateurs</span>
              <span>•</span>
              <span>Ali Trad</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold">
              Formateurs des Séances Restantes
            </h2>
            <p className="text-xs text-slate-300">
              Ajoutez ou supprimez un ou plusieurs formateurs (co-animation) pour chaque séance du programme.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar & Feedback Banner */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchOpen(!isBatchOpen)}
                className="px-3.5 py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                Attribuer un formateur à toutes les séances
                {isBatchOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleBatchClearAll}
                disabled={loadingId === 'clearAll'}
                className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Vider les cases formateurs de toutes les séances"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider toutes les cases
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {sortedTrainings.length} formations disponibles
            </div>
          </div>

          {/* Batch Assignment Dropdown Form */}
          {isBatchOpen && (
            <form
              onSubmit={handleBatchAssign}
              className="p-4 bg-white rounded-2xl border border-amber-300 shadow-sm space-y-3 animate-in slide-in-from-top-2"
            >
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Attribuer simultanément un formateur à l'ensemble des {sortedTrainings.length} séances :
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nom et prénom du formateur (ex: Dr. Ben Salem)"
                  value={batchTrainerName}
                  onChange={(e) => setBatchTrainerName(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
                <input
                  type="text"
                  placeholder="Qualité / Spécialité (ex: Médecin Réanimateur SAMU)"
                  value={batchTrainerQuality}
                  onChange={(e) => setBatchTrainerQuality(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingId === 'batch'}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {loadingId === 'batch' ? 'Application...' : 'Appliquer à toutes les séances'}
                </button>
              </div>
            </form>
          )}

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-red-50 text-red-900 border-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable list of training sessions */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 divide-y divide-slate-100 flex-1">
          {sortedTrainings.map((training) => {
            const trainers = getTrainers(training);
            const isAdding = activeAddingId === training.id;
            const isLoading = loadingId === training.id;

            return (
              <div
                key={training.id}
                className="pt-4 first:pt-0 space-y-3 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs"
              >
                {/* Session Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {training.numeroSeance && (
                      <span className="px-2.5 py-0.5 bg-[#0A2540] text-amber-300 font-extrabold text-xs rounded-lg shadow-2xs">
                        Séance #{training.numeroSeance}
                      </span>
                    )}
                    {training.domaine && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-200">
                        {training.domaine}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      Samedi {training.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {trainers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDuplicateToAll(training)}
                        disabled={isLoading}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                        title="Appliquer cette équipe de formateurs à toutes les autres séances"
                      >
                        Appliquer à toutes les séances
                      </button>
                    )}
                    {trainers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearTrainers(training)}
                        disabled={isLoading}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg border border-red-200 transition-colors"
                        title="Vider les formateurs de cette séance"
                      >
                        Vider
                      </button>
                    )}
                  </div>
                </div>

                {/* Training Theme */}
                <div className="font-bold text-sm text-slate-900 leading-snug">
                  {training.theme}
                </div>

                {/* Assigned Trainers List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Formateur(s) affecté(s) ({trainers.length}) :</span>
                    {!isAdding && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAddingId(training.id);
                          setNewTrainerName('');
                          setNewTrainerQuality('');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0A2540] hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                        + Ajouter un formateur
                      </button>
                    )}
                  </div>

                  {trainers.length === 0 ? (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-dashed border-amber-300 text-xs text-amber-900 flex items-center justify-between">
                      <span className="italic">
                        Aucun formateur désigné pour le moment (case vide). Prêt à être renseigné dès confirmation.
                      </span>
                      {!isAdding && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAddingId(training.id);
                            setNewTrainerName('');
                            setNewTrainerQuality('');
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                        >
                          Désigner un formateur
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trainers.map((tr, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-7 h-7 rounded-full bg-[#0A2540] text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {tr.nom}
                              </div>
                              {tr.qualite && (
                                <div className="text-[10px] text-slate-500 truncate">
                                  {tr.qualite}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTrainer(training, idx)}
                            disabled={isLoading}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Supprimer ce formateur de la séance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Form to Add a Trainer */}
                  {isAdding && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 animate-in slide-in-from-top-1">
                      <div className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                        Ajouter un formateur pour la séance #{training.numeroSeance || ''} :
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Nom et prénom <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            autoFocus
                            placeholder="Ex: Dr. Mohamed Ben Salem"
                            value={newTrainerName}
                            onChange={(e) => setNewTrainerName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Qualité / Spécialité (optionnel)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Médecin Réanimateur, Infirmier Major..."
                            value={newTrainerQuality}
                            onChange={(e) => setNewTrainerQuality(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAddingId(null);
                            setNewTrainerName('');
                            setNewTrainerQuality('');
                          }}
                          className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={isLoading || !newTrainerName.trim()}
                          onClick={() => handleAddTrainer(training)}
                          className="px-3.5 py-1 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-xs rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          {isLoading ? 'Enregistrement...' : 'Confirmer le formateur'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Toutes les modifications sont synchronisées instantanément dans Firestore.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Fermer le gestionnaire
          </button>
        </div>
      </div>
    </div>
  );
};
