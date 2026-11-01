import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  X,
  Building2,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Check,
  UserCheck,
} from 'lucide-react';
import { TrainingSession, Registration, UserProfile } from '../types';
import { listenTrainingRegistrations } from '../services/trainingService';
import { manualAttendanceOverride } from '../services/attendanceService';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  training: TrainingSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionAttendanceModal: React.FC<Props> = ({
  training,
  isOpen,
  onClose,
}) => {
  const { userProfile, isAdmin, isResponsable } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [search, setSearch] = useState('');

  // Manual check-in state
  const [manualTarget, setManualTarget] = useState<Registration | null>(null);
  const [manualMotif, setManualMotif] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !training) return;
    const unsub = listenTrainingRegistrations(training.id, (regs) => {
      setRegistrations(regs);
    });
    return () => unsub();
  }, [isOpen, training]);

  // Calculations
  const stats = useMemo(() => {
    const confirmed = registrations.filter((r) => r.statut === 'CONFIRMEE');
    const totalEnregistres = confirmed.length;
    // Participants having joined = arrival or departure validated
    const presents = confirmed.filter(
      (r) => r.pointageArriveeValide || r.pointageSortieValide
    ).length;
    // Those who have not joined = 0 scans
    const nOntPasRejoint = confirmed.filter(
      (r) => !r.pointageArriveeValide && !r.pointageSortieValide
    ).length;
    const complets = confirmed.filter(
      (r) => r.pointageArriveeValide && r.pointageSortieValide
    ).length;
    const listeAttenteCount = registrations.filter(
      (r) => r.statut === 'LISTE_ATTENTE'
    ).length;

    return {
      totalEnregistres,
      presents,
      nOntPasRejoint,
      complets,
      listeAttenteCount,
    };
  }, [registrations]);

  // Filtered list
  const filteredList = useMemo(() => {
    return registrations
      .filter((r) => r.statut === 'CONFIRMEE')
      .filter((r) => {
        const isPresent = r.pointageArriveeValide || r.pointageSortieValide;
        if (filterTab === 'PRESENT') return isPresent;
        if (filterTab === 'ABSENT') return !isPresent;
        return true;
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          `${r.nom} ${r.prenom} ${r.matricule} ${r.etablissement} ${r.fonction}`
            .toLowerCase()
            .includes(q)
        );
      });
  }, [registrations, filterTab, search]);

  if (!isOpen || !training) return null;

  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTarget || !userProfile) return;
    setManualLoading(true);
    try {
      await manualAttendanceOverride(
        manualTarget.id,
        training.id,
        'complete',
        manualMotif,
        userProfile
      );
      setManualTarget(null);
      setManualMotif('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur de validation.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Séance',
      'Matricule',
      'Nom',
      'Prénom',
      'Fonction',
      'Établissement',
      'Statut Présence',
      'Heure Arrivée',
      'Heure Sortie',
      'Validation Manuelle',
    ];

    const rows = filteredList.map((r) => [
      `"${training.numeroSeance ? `Séance #${training.numeroSeance}` : training.date}"`,
      `"${r.matricule}"`,
      `"${r.nom}"`,
      `"${r.prenom}"`,
      `"${r.fonction}"`,
      `"${r.etablissement}"`,
      `"${r.pointageArriveeValide ? (r.pointageSortieValide ? 'COMPLÈTE' : 'ARRIVÉE') : 'ABSENT (NON REJOINT)'}"`,
      `"${r.heureArrivee || ''}"`,
      `"${r.heureSortie || ''}"`,
      `"${r.validationManuelle ? 'OUI' : 'NON'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `presences_${training.date}_s${training.numeroSeance || 1}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#0F2F57] to-[#123966] text-white p-5 sm:p-6 shrink-0 border-b border-amber-500/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                {training.numeroSeance && <span>Séance #{training.numeroSeance} • </span>}
                <span>Samedi {training.date} • 12h30</span>
                <span>•</span>
                <span>Centre Intermédiaire Ali Trad</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                {training.theme}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>Formateur : {training.formateur}</span>
                <span>•</span>
                <span>Capacité : {training.capaciteMax || 25} places</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 3 CORE COUNTERS (Exact User Request) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-6 bg-[#FAF9F5] border-b border-slate-200 shrink-0">
          {/* 1. Personnes enregistrées */}
          <div
            onClick={() => setFilterTab('ALL')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterTab === 'ALL'
                ? 'bg-white border-[#0A2540] ring-2 ring-[#0A2540]/20'
                : 'bg-white/80 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0A2540]" />
                Personnes Enregistrées
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                Inscrits
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#0A2540]">
              {stats.totalEnregistres}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              sur {training.capaciteMax || 25} places ({training.placesRestantes ?? (training.capaciteMax - stats.totalEnregistres)} libres)
            </div>
          </div>

          {/* 2. Nombre de participants (Présents / Ont rejoint) */}
          <div
            onClick={() => setFilterTab('PRESENT')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterTab === 'PRESENT'
                ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20'
                : 'bg-white/80 border-slate-200 hover:bg-emerald-50/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Participants Ayant Rejoint
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-mono font-bold">
                Présents
              </span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">
              {stats.presents}
            </div>
            <div className="text-[11px] text-emerald-800 mt-1 font-medium">
              {stats.totalEnregistres > 0
                ? `${Math.round((stats.presents / stats.totalEnregistres) * 100)}% de taux de présence`
                : '0%'}
              {' '}({stats.complets} présence complète)
            </div>
          </div>

          {/* 3. Nombre qui n'ont pas rejoint la formation (Absents) */}
          <div
            onClick={() => setFilterTab('ABSENT')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterTab === 'ABSENT'
                ? 'bg-rose-50/80 border-rose-600 ring-2 ring-rose-500/20'
                : 'bg-white/80 border-slate-200 hover:bg-rose-50/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-800 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                N'ont Pas Rejoint la Formation
              </span>
              <span className="text-[10px] bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full font-mono font-bold">
                Absents
              </span>
            </div>
            <div className="text-3xl font-extrabold text-rose-700">
              {stats.nOntPasRejoint}
            </div>
            <div className="text-[11px] text-rose-800 mt-1 font-medium">
              Inscrits n'ayant pas encore validé leur arrivée
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher participant, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous ({stats.totalEnregistres})
              </button>
              <button
                onClick={() => setFilterTab('PRESENT')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterTab === 'PRESENT'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Présents ({stats.presents})
              </button>
              <button
                onClick={() => setFilterTab('ABSENT')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterTab === 'ABSENT'
                    ? 'bg-white text-rose-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                N'ont pas rejoint ({stats.nOntPasRejoint})
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              title="Exporter la liste en CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Nominative Attendance List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic space-y-1">
              <div>Aucun participant ne correspond aux critères.</div>
              {filterTab === 'ABSENT' && stats.nOntPasRejoint === 0 && (
                <div className="text-emerald-700 font-bold not-italic">
                  🎉 Tous les participants enregistrés ont rejoint la formation !
                </div>
              )}
            </div>
          ) : (
            filteredList.map((r) => {
              const hasJoined = r.pointageArriveeValide || r.pointageSortieValide;
              const isComplete = r.pointageArriveeValide && r.pointageSortieValide;

              return (
                <div
                  key={r.id}
                  className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {r.prenom} {r.nom}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                        Mat : {r.matricule}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      <span>{r.fonction}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {r.etablissement}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Réf: {r.numeroReservation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Status Pill */}
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Présence Complète
                      </span>
                    ) : r.pointageArriveeValide ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Arrivé à {r.heureArrivee}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        N'a pas rejoint (Absent)
                      </span>
                    )}

                    {/* Manual override action if absent or incomplete */}
                    {!isComplete && (isAdmin || isResponsable) && (
                      <button
                        onClick={() => setManualTarget(r)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                        title="Valider la présence manuellement"
                      >
                        <ShieldAlert className="w-3 h-3 text-amber-700" />
                        Valider présence
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Total : <strong>{stats.totalEnregistres}</strong> inscrits • <strong>{stats.presents}</strong> présents • <strong>{stats.nOntPasRejoint}</strong> absents
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold rounded-xl shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Manual Check-in Modal */}
      {manualTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0A2540] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Validation Manuelle de Présence
              </h4>
              <button
                onClick={() => setManualTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950 space-y-1">
              <div>Participant : <strong>{manualTarget.prenom} {manualTarget.nom}</strong></div>
              <div>Matricule : {manualTarget.matricule} • {manualTarget.fonction}</div>
              <div>Établissement : {manualTarget.etablissement}</div>
            </div>

            <form onSubmit={handleManualOverride} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motif de validation d'assiduité <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={manualMotif}
                  onChange={(e) => setManualMotif(e.target.value)}
                  placeholder="Ex: Présent en salle, problème d'accès caméra sur smartphone constaté sur place..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualTarget(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={manualLoading || !manualMotif.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {manualLoading ? 'Enregistrement...' : 'Valider la Présence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
