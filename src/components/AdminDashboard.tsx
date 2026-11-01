import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Award,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Sliders,
  Building2,
  Eye,
  Tv,
  FileCheck,
  Check,
  X,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  TrainingSession,
  Registration,
  UserProfile,
  Certificate,
  AttendanceStatus,
} from '../types';
import {
  createTraining,
  updateTraining,
  deleteTraining,
  toggleCheckinStatus,
  listenTrainingRegistrations,
  DEFAULT_TRAINING_LOCATION,
} from '../services/trainingService';
import { manualAttendanceOverride } from '../services/attendanceService';
import { issueCertificate } from '../services/certificateService';
import { syncOfficial19Trainings } from '../services/seedData';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  trainings: TrainingSession[];
  onOpenProjector: (training: TrainingSession) => void;
  onViewCertificate: (cert: Certificate) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  trainings,
  onOpenProjector,
  onViewCertificate,
}) => {
  const { userProfile } = useAuth();

  // Selected training for inspection & roster
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(
    trainings[0]?.id || ''
  );
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Filters for the nominative roster
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtablissement, setFilterEtablissement] = useState('ALL');
  const [filterPresence, setFilterPresence] = useState('ALL');
  const [filterDomaine, setFilterDomaine] = useState('ALL');

  // Syncing state
  const [syncingOfficial, setSyncingOfficial] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingSession | null>(null);

  // Manual Check-in Modal
  const [manualOverrideTarget, setManualOverrideTarget] = useState<Registration | null>(null);
  const [overrideType, setOverrideType] = useState<'arrivee' | 'sortie' | 'complete'>('complete');
  const [overrideMotif, setOverrideMotif] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Derogation Certificate Modal
  const [derogationTarget, setDerogationTarget] = useState<Registration | null>(null);
  const [derogationMotif, setDerogationMotif] = useState('');
  const [certLoading, setCertLoading] = useState(false);

  // Training form state
  const [formData, setFormData] = useState({
    theme: '',
    domaine: 'URGENCES',
    numeroSeance: 1,
    description: '',
    formateur: '',
    qualiteFormateur: '',
    date: '',
    heureDebut: '12:30',
    heureFin: '13:30',
    dureeHeures: '60 minutes',
    lieu: DEFAULT_TRAINING_LOCATION,
    capaciteMax: 25,
    dateLimiteInscription: '',
    estPublie: true,
    objectifsText: '',
  });

  // Keep selected training id synced if deleted or on load
  useEffect(() => {
    if (!selectedTrainingId && trainings.length > 0) {
      setSelectedTrainingId(trainings[0].id);
    }
  }, [trainings, selectedTrainingId]);

  // Listen to registrations of selected training
  useEffect(() => {
    if (!selectedTrainingId) {
      setRegistrations([]);
      return;
    }
    const unsub = listenTrainingRegistrations(selectedTrainingId, (regs) => {
      setRegistrations(regs);
    });
    return () => unsub();
  }, [selectedTrainingId]);

  const activeTraining = useMemo(
    () => trainings.find((t) => t.id === selectedTrainingId),
    [trainings, selectedTrainingId]
  );

  // Global KPIs across all trainings
  const stats = useMemo(() => {
    const totalTrainings = trainings.length;
    const programmedTrainings = trainings.filter(
      (t) => t.statut === 'a_venir' || t.statut === 'en_cours'
    ).length;
    const totalCapacite = trainings.reduce((acc, t) => acc + (t.capaciteMax || 25), 0);
    const totalPlacesReservees = trainings.reduce(
      (acc, t) => acc + (t.placesReservees || 0),
      0
    );
    const totalPlacesRestantes = Math.max(0, totalCapacite - totalPlacesReservees);

    // Selected training specific stats
    const confirmedRegs = registrations.filter((r) => r.statut === 'CONFIRMEE');
    const totalInscriptions = confirmedRegs.length;
    const arrives = confirmedRegs.filter((r) => r.pointageArriveeValide).length;
    const sortis = confirmedRegs.filter((r) => r.pointageSortieValide).length;
    const completePresent = confirmedRegs.filter(
      (r) => r.pointageArriveeValide && r.pointageSortieValide
    ).length;
    const singleScan = confirmedRegs.filter(
      (r) =>
        (r.pointageArriveeValide && !r.pointageSortieValide) ||
        (!r.pointageArriveeValide && r.pointageSortieValide)
    ).length;
    const absents = confirmedRegs.filter(
      (r) => !r.pointageArriveeValide && !r.pointageSortieValide
    ).length;
    const participationRate =
      totalInscriptions > 0
        ? Math.round((completePresent / totalInscriptions) * 100)
        : 0;

    return {
      totalTrainings,
      programmedTrainings,
      totalPlacesRestantes,
      totalInscriptions,
      arrives,
      sortis,
      completePresent,
      singleScan,
      absents,
      participationRate,
    };
  }, [trainings, registrations]);

  // List of unique etablissements in current registrations
  const etablissementsList = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => {
      if (r.etablissement) set.add(r.etablissement);
    });
    return Array.from(set);
  }, [registrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchSearch =
        !searchTerm ||
        `${r.nom} ${r.prenom} ${r.matricule} ${r.numeroReservation}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchEtab =
        filterEtablissement === 'ALL' || r.etablissement === filterEtablissement;

      let matchPresence = true;
      if (filterPresence === 'CONFIRMEE') matchPresence = r.statut === 'CONFIRMEE';
      if (filterPresence === 'ATTENTE') matchPresence = r.statut === 'LISTE_ATTENTE';
      if (filterPresence === 'ARRIVEE') matchPresence = r.pointageArriveeValide;
      if (filterPresence === 'SORTIE') matchPresence = r.pointageSortieValide;
      if (filterPresence === 'COMPLETE')
        matchPresence = r.pointageArriveeValide && r.pointageSortieValide;
      if (filterPresence === 'SINGLE_SCAN')
        matchPresence =
          (r.pointageArriveeValide && !r.pointageSortieValide) ||
          (!r.pointageArriveeValide && r.pointageSortieValide);
      if (filterPresence === 'ABSENT')
        matchPresence = !r.pointageArriveeValide && !r.pointageSortieValide;

      return matchSearch && matchEtab && matchPresence;
    });
  }, [registrations, searchTerm, filterEtablissement, filterPresence]);

  const handleOpenCreate = () => {
    setEditingTraining(null);
    setFormData({
      theme: '',
      domaine: 'URGENCES',
      numeroSeance: trainings.length + 1,
      description: '',
      formateur: '',
      qualiteFormateur: '',
      date: '',
      heureDebut: '12:30',
      heureFin: '13:30',
      dureeHeures: '60 minutes',
      lieu: DEFAULT_TRAINING_LOCATION,
      capaciteMax: 25,
      dateLimiteInscription: '',
      estPublie: true,
      objectifsText: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (t: TrainingSession) => {
    setEditingTraining(t);
    setFormData({
      theme: t.theme,
      domaine: t.domaine || 'URGENCES',
      numeroSeance: t.numeroSeance || 1,
      description: t.description || '',
      formateur: t.formateur,
      qualiteFormateur: t.qualiteFormateur || '',
      date: t.date,
      heureDebut: t.heureDebut || '12:30',
      heureFin: t.heureFin || '13:30',
      dureeHeures: t.dureeHeures || '60 minutes',
      lieu: t.lieu || DEFAULT_TRAINING_LOCATION,
      capaciteMax: t.capaciteMax || 25,
      dateLimiteInscription: t.dateLimiteInscription || '',
      estPublie: t.estPublie,
      objectifsText: (t.objectifs || []).join('\n'),
    });
    setIsCreateModalOpen(true);
  };

  const handleSync19Official = async () => {
    if (
      window.confirm(
        'Voulez-vous synchroniser les 19 formations du référentiel officiel (Direction des Soins • Dernier Trimestre 2026 / Six Circonscriptions Sanitaires) ?'
      )
    ) {
      setSyncingOfficial(true);
      try {
        const count = await syncOfficial19Trainings(true);
        alert(`Synchronisation réussie ! ${count} formations officielles ont été mises à jour dans Firestore.`);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur de synchronisation.');
      } finally {
        setSyncingOfficial(false);
      }
    }
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const objectifs = formData.objectifsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingTraining) {
        await updateTraining(editingTraining.id, {
          theme: formData.theme,
          domaine: formData.domaine,
          numeroSeance: Number(formData.numeroSeance) || 1,
          description: formData.description,
          formateur: formData.formateur,
          qualiteFormateur: formData.qualiteFormateur,
          date: formData.date,
          heureDebut: formData.heureDebut,
          heureFin: formData.heureFin,
          dureeHeures: formData.dureeHeures,
          lieu: formData.lieu,
          capaciteMax: Number(formData.capaciteMax) || 25,
          dateLimiteInscription: formData.dateLimiteInscription,
          estPublie: formData.estPublie,
          objectifs,
        });
      } else {
        const newId = await createTraining(
          {
            theme: formData.theme,
            domaine: formData.domaine,
            numeroSeance: Number(formData.numeroSeance) || 1,
            description: formData.description,
            formateur: formData.formateur,
            qualiteFormateur: formData.qualiteFormateur,
            date: formData.date,
            heureDebut: formData.heureDebut,
            heureFin: formData.heureFin,
            dureeHeures: formData.dureeHeures,
            lieu: formData.lieu,
            capaciteMax: Number(formData.capaciteMax) || 25,
            dateLimiteInscription: formData.dateLimiteInscription,
            estPublie: formData.estPublie,
            statut: 'a_venir',
            pointageArriveeOuvert: false,
            pointageSortieOuvert: false,
            objectifs,
          },
          userProfile.uid
        );
        setSelectedTrainingId(newId);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    }
  };

  const handleDeleteTraining = async (t: TrainingSession) => {
    if (
      window.confirm(
        `Voulez-vous vraiment supprimer la formation "${t.theme}" du ${t.date} ?`
      )
    ) {
      await deleteTraining(t.id);
      if (selectedTrainingId === t.id) {
        setSelectedTrainingId(trainings.find((x) => x.id !== t.id)?.id || '');
      }
    }
  };

  const handleToggleCheckin = async (
    type: 'arrivee' | 'sortie',
    currentVal: boolean
  ) => {
    if (!activeTraining) return;
    await toggleCheckinStatus(activeTraining.id, type, !currentVal);
  };

  const handleTogglePublish = async (t: TrainingSession) => {
    await updateTraining(t.id, { estPublie: !t.estPublie });
  };

  const handleManualOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOverrideTarget || !activeTraining || !userProfile) return;
    setOverrideLoading(true);

    try {
      await manualAttendanceOverride(
        manualOverrideTarget.id,
        activeTraining.id,
        overrideType,
        overrideMotif,
        userProfile
      );
      setManualOverrideTarget(null);
      setOverrideMotif('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur de validation manuelle.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleIssueCert = async (reg: Registration, isDerogation = false) => {
    if (!activeTraining || !userProfile) return;
    setCertLoading(true);

    try {
      const cert = await issueCertificate(
        reg,
        activeTraining,
        userProfile,
        isDerogation,
        derogationMotif
      );
      setDerogationTarget(null);
      setDerogationMotif('');
      onViewCertificate(cert);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l’émission de l’attestation.');
    } finally {
      setCertLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!activeTraining) return;

    const headers = [
      'Matricule',
      'Nom',
      'Prénom',
      'Fonction',
      'Établissement',
      'N° Réservation',
      'Statut Réservation',
      'Arrivée Validée',
      'Heure Arrivée',
      'Sortie Validée',
      'Heure Sortie',
      'Présence Finale',
      'Validation Manuelle',
      'Motif Dérogation',
    ];

    const rows = filteredRegistrations.map((r) => [
      `"${r.matricule || ''}"`,
      `"${r.nom || ''}"`,
      `"${r.prenom || ''}"`,
      `"${r.fonction || ''}"`,
      `"${r.etablissement || ''}"`,
      `"${r.numeroReservation || ''}"`,
      `"${r.statut}"`,
      `"${r.pointageArriveeValide ? 'OUI' : 'NON'}"`,
      `"${r.heureArrivee || ''}"`,
      `"${r.pointageSortieValide ? 'OUI' : 'NON'}"`,
      `"${r.heureSortie || ''}"`,
      `"${r.presenceFinale}"`,
      `"${r.validationManuelle ? 'OUI' : 'NON'}"`,
      `"${r.motifValidationManuelle || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `presence_ali_trad_${activeTraining.date}_${activeTraining.id}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Admin Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
            <span>Espace d'Administration Officiel</span>
            <span>•</span>
            <span>GSB Tunis Sud</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]">
            Tableau de Bord & Gestion des Présences
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision des formations du samedi au Centre Intermédiaire Ali Trad
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSync19Official}
            disabled={syncingOfficial}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            title="Synchroniser le référentiel officiel des 19 formations de la Direction des Soins"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            {syncingOfficial ? 'Synchronisation en cours...' : 'Synchroniser les 19 Formations Officielles'}
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Créer une Formation
          </button>
        </div>
      </div>

      {/* KPI Global Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Formations</div>
          <div className="text-2xl font-extrabold text-[#0A2540] mt-1">
            {stats.totalTrainings}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.programmedTrainings} programmées
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Inscriptions Séance</div>
          <div className="text-2xl font-extrabold text-[#0A2540] mt-1">
            {stats.totalInscriptions}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            sur {activeTraining?.capaciteMax || 25} places
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Pointages Arrivée</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {stats.arrives}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.totalInscriptions > 0
              ? `${Math.round((stats.arrives / stats.totalInscriptions) * 100)}% présents`
              : '0%'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Présence Complète</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {stats.completePresent}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Arrivée + Sortie validées
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 font-medium">Taux d'Assiduité</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {stats.participationRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.singleScan} scan unique • {stats.absents} absents
          </div>
        </div>
      </div>

      {/* Selected Training Selector & Control Station */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Séance Sélectionnée pour Gestion et Pointages
            </span>
            <div className="flex items-center gap-3">
              <select
                value={selectedTrainingId}
                onChange={(e) => setSelectedTrainingId(e.target.value)}
                className="font-bold text-slate-900 text-sm sm:text-base px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] bg-[#FAF9F5]"
              >
                {trainings.map((t) => (
                  <option key={t.id} value={t.id}>
                    Samedi {t.date} — {t.theme.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick operations for the active training */}
          {activeTraining && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onOpenProjector(activeTraining)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Tv className="w-4 h-4" />
                Mode Projecteur Salle
              </button>

              <button
                onClick={() =>
                  handleToggleCheckin(
                    'arrivee',
                    activeTraining.pointageArriveeOuvert
                  )
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTraining.pointageArriveeOuvert
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Arrivée : {activeTraining.pointageArriveeOuvert ? 'OUVERT' : 'FERMÉ'}
              </button>

              <button
                onClick={() =>
                  handleToggleCheckin(
                    'sortie',
                    activeTraining.pointageSortieOuvert
                  )
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTraining.pointageSortieOuvert
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Sortie : {activeTraining.pointageSortieOuvert ? 'OUVERT' : 'FERMÉ'}
              </button>

              <button
                onClick={() => handleTogglePublish(activeTraining)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                  activeTraining.estPublie
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                {activeTraining.estPublie ? 'Publiée' : 'Brouillon'}
              </button>

              <button
                onClick={() => handleOpenEdit(activeTraining)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDeleteTraining(activeTraining)}
                className="p-2 text-red-600 hover:text-red-700 rounded-xl hover:bg-red-50"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Selected Training Quick Details */}
        {activeTraining && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF9F5] border border-amber-200/60 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Thème :</span>
              <span className="font-bold text-slate-900 block leading-tight">
                {activeTraining.theme}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Formateur & Lieu :</span>
              <span className="font-semibold text-slate-800 block">
                {activeTraining.formateur}
              </span>
              <span className="text-[11px] text-slate-500">
                {activeTraining.lieu || DEFAULT_TRAINING_LOCATION}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Horaires :</span>
              <span className="font-semibold text-slate-800 block">
                Samedi {activeTraining.date} • {activeTraining.heureDebut} à {activeTraining.heureFin}
              </span>
              <span className="text-[11px] text-slate-500">
                Durée : {activeTraining.dureeHeures}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Jauge des places :</span>
              <span className="font-bold text-[#0A2540] block">
                {activeTraining.placesReservees || 0} / {activeTraining.capaciteMax || 25} réservées
              </span>
              <span className="text-[11px] text-amber-700 font-medium">
                {activeTraining.nbListeAttente || 0} en liste d'attente
              </span>
            </div>
          </div>
        )}

        {/* 3 Real-time Status Counters for the Selected Session */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Personnes enregistrées */}
          <div
            onClick={() => setFilterPresence('CONFIRMEE')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterPresence === 'CONFIRMEE'
                ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-md ring-2 ring-amber-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                1. Personnes Enregistrées
              </span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-extrabold mt-2">
              {stats.totalInscriptions}
            </div>
            <div className="text-[11px] opacity-75 mt-0.5">
              Inscriptions confirmées dans la base (Capacité: {activeTraining?.capaciteMax || 25})
            </div>
          </div>

          {/* 2. Participants ayant rejoint */}
          <div
            onClick={() => setFilterPresence('ARRIVEE')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterPresence === 'ARRIVEE' || filterPresence === 'COMPLETE'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400'
                : 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                2. Participants Ayant Rejoint
              </span>
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold mt-2 text-emerald-700">
              {stats.arrives}
            </div>
            <div className="text-[11px] text-emerald-800 opacity-80 mt-0.5">
              Présents en salle ({stats.totalInscriptions > 0 ? Math.round((stats.arrives / stats.totalInscriptions) * 100) : 0}% du total inscrit)
            </div>
          </div>

          {/* 3. N'ont pas rejoint la formation */}
          <div
            onClick={() => setFilterPresence('ABSENT')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterPresence === 'ABSENT'
                ? 'bg-rose-800 text-white border-rose-900 shadow-md ring-2 ring-rose-400'
                : 'bg-rose-50/70 hover:bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                3. N'ont Pas Rejoint la Formation
              </span>
              <UserX className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-3xl font-extrabold mt-2 text-rose-700">
              {stats.absents}
            </div>
            <div className="text-[11px] text-rose-800 opacity-80 mt-0.5">
              Inscrits absents / sans pointage scanné
            </div>
          </div>
        </div>

        {/* Roster Controls & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#0A2540] flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Liste Nominative des Participants ({filteredRegistrations.length})
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter CSV
              </button>
            </div>
          </div>

          {/* Search and filters bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher nom, matricule, réf..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
              />
            </div>

            {/* Filter by Etablissement */}
            <div>
              <select
                value={filterEtablissement}
                onChange={(e) => setFilterEtablissement(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] bg-white"
              >
                <option value="ALL">Tous les établissements</option>
                {etablissementsList.map((etab) => (
                  <option key={etab} value={etab}>
                    {etab}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Presence */}
            <div>
              <select
                value={filterPresence}
                onChange={(e) => setFilterPresence(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] bg-white"
              >
                <option value="ALL">Tous les statuts de présence</option>
                <option value="CONFIRMEE">Réservations Confirmées</option>
                <option value="COMPLETE">Présence Complète (2 Scans)</option>
                <option value="SINGLE_SCAN">Anomalie (1 Seul Scan)</option>
                <option value="ARRIVEE">Arrivée Validée</option>
                <option value="SORTIE">Sortie Validée</option>
                <option value="ABSENT">Absents (0 Scan)</option>
                <option value="ATTENTE">Liste d'attente</option>
              </select>
            </div>
          </div>

          {/* Nominative Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A2540] text-white text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Nom et Prénom</th>
                  <th className="py-3 px-3">Établissement</th>
                  <th className="py-3 px-3">Fonction & Matricule</th>
                  <th className="py-3 px-3">Réservation</th>
                  <th className="py-3 px-3 text-center">Arrivée</th>
                  <th className="py-3 px-3 text-center">Sortie</th>
                  <th className="py-3 px-3 text-center">Présence Finale</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-slate-400 italic"
                    >
                      Aucun participant correspondant aux filtres.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((r) => {
                    const isFullyAttended =
                      r.pointageArriveeValide && r.pointageSortieValide;
                    const isSingleScan =
                      (r.pointageArriveeValide && !r.pointageSortieValide) ||
                      (!r.pointageArriveeValide && r.pointageSortieValide);

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Name */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">
                            {r.prenom} {r.nom}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {r.email}
                          </div>
                        </td>

                        {/* Etablissement */}
                        <td className="py-3 px-3 text-slate-700">
                          <div className="flex items-center gap-1 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]" title={r.etablissement}>
                              {r.etablissement}
                            </span>
                          </div>
                        </td>

                        {/* Fonction & Matricule */}
                        <td className="py-3 px-3">
                          <div className="text-slate-800 font-medium">
                            {r.fonction}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Mat : {r.matricule}
                          </div>
                        </td>

                        {/* Statut Reservation */}
                        <td className="py-3 px-3">
                          {r.statut === 'CONFIRMEE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                              Confirmée
                            </span>
                          ) : r.statut === 'LISTE_ATTENTE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Attente #{r.positionAttente}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                              Annulée
                            </span>
                          )}
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {r.numeroReservation}
                          </div>
                        </td>

                        {/* Pointage Arrivée */}
                        <td className="py-3 px-3 text-center">
                          {r.pointageArriveeValide ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                {r.heureArrivee || 'Validé'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Pointage Sortie */}
                        <td className="py-3 px-3 text-center">
                          {r.pointageSortieValide ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                <CheckCircle2 className="w-3 h-3" />
                                {r.heureSortie || 'Validé'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Présence Finale */}
                        <td className="py-3 px-3 text-center">
                          {isFullyAttended ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] inline-block">
                              COMPLÈTE
                            </span>
                          ) : isSingleScan ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-block" title="Un seul scan enregistré">
                              1 SCAN SEUL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px] inline-block">
                              ABSENT
                            </span>
                          )}

                          {r.validationManuelle && (
                            <div
                              className="text-[9px] text-amber-700 font-semibold mt-0.5"
                              title={`Validé manuellement : ${r.motifValidationManuelle}`}
                            >
                              [Manuelle]
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Manual checkin button */}
                            <button
                              onClick={() => {
                                setManualOverrideTarget(r);
                                setOverrideType(
                                  !r.pointageArriveeValide
                                    ? 'arrivee'
                                    : !r.pointageSortieValide
                                    ? 'sortie'
                                    : 'complete'
                                );
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              title="Validation manuelle exceptionnelle"
                            >
                              <ShieldAlert className="w-4 h-4 text-amber-600" />
                            </button>

                            {/* Issue Certificate button */}
                            {isFullyAttended ? (
                              <button
                                onClick={() => handleIssueCert(r, false)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Émettre ou voir l'attestation"
                              >
                                <Award className="w-3.5 h-3.5" />
                                Attestation
                              </button>
                            ) : (
                              <button
                                onClick={() => setDerogationTarget(r)}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-semibold"
                                title="Émettre avec dérogation administrative"
                              >
                                Dérogation
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Create / Edit Training */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#0A2540] text-white p-5 flex items-center justify-between border-b border-amber-500/30">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                {editingTraining ? 'Modifier la Formation' : 'Créer une Nouvelle Formation du Samedi'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTraining} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° Séance
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.numeroSeance}
                    onChange={(e) => setFormData({ ...formData, numeroSeance: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Domaine / Spécialité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.domaine}
                    onChange={(e) => setFormData({ ...formData, domaine: e.target.value.toUpperCase() })}
                    placeholder="URGENCES, SOINS, PRATIQUE, PRÉVENTION, SÉCURITÉ..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 uppercase font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thème de la formation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  placeholder="Ex: Trousse d'urgence : Composition, vérification et utilisation pratique..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description clinique et contenu
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détail du programme, ateliers pratiques..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom du Formateur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.formateur}
                    onChange={(e) => setFormData({ ...formData, formateur: e.target.value })}
                    placeholder="Ex: Dr. Khaled Ben Salem"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualité / Spécialité du formateur
                  </label>
                  <input
                    type="text"
                    value={formData.qualiteFormateur}
                    onChange={(e) => setFormData({ ...formData, qualiteFormateur: e.target.value })}
                    placeholder="Ex: Médecin Réanimateur SAMU"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date (Samedi) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heure de début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.heureDebut}
                    onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heure de fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.heureFin}
                    onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacité maximale de participants <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    required
                    value={formData.capaciteMax}
                    onChange={(e) => setFormData({ ...formData, capaciteMax: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date et heure limites des inscriptions
                </label>
                <input
                  type="datetime-local"
                  value={formData.dateLimiteInscription}
                  onChange={(e) => setFormData({ ...formData, dateLimiteInscription: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objectifs pédagogiques (1 par ligne)
                </label>
                <textarea
                  rows={3}
                  value={formData.objectifsText}
                  onChange={(e) => setFormData({ ...formData, objectifsText: e.target.value })}
                  placeholder="Maîtriser le geste de ponction..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="estPublie"
                  checked={formData.estPublie}
                  onChange={(e) => setFormData({ ...formData, estPublie: e.target.checked })}
                  className="w-4 h-4 text-[#0A2540] rounded-sm focus:ring-[#0A2540]"
                />
                <label htmlFor="estPublie" className="text-xs font-semibold text-slate-800">
                  Publier immédiatement la formation sur le catalogue public
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  {editingTraining ? 'Mettre à jour' : 'Enregistrer la formation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manual Check-in Override with Mandatory Audit Log */}
      {manualOverrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0A2540] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Validation Manuelle Exceptionnelle
              </h4>
              <button
                onClick={() => setManualOverrideTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-1">
              <div>
                Participant : <strong>{manualOverrideTarget.prenom} {manualOverrideTarget.nom}</strong>
              </div>
              <div>Matricule : {manualOverrideTarget.matricule}</div>
              <div>Établissement : {manualOverrideTarget.etablissement}</div>
            </div>

            <form onSubmit={handleManualOverrideSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Type de pointage à valider :
                </label>
                <select
                  value={overrideType}
                  onChange={(e) => setOverrideType(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="arrivee">Pointage Arrivée uniquement</option>
                  <option value="sortie">Pointage Sortie uniquement</option>
                  <option value="complete">Présence Complète (Arrivée + Sortie)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motif obligatoire pour le journal d'audit <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={overrideMotif}
                  onChange={(e) => setOverrideMotif(e.target.value)}
                  placeholder="Ex: Problème d'appareil mobile du participant constaté sur place par l'administrateur..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
                <span className="text-[10px] text-slate-400">
                  Cette validation sera enregistrée dans le journal de traçabilité avec votre compte administrateur.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualOverrideTarget(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {overrideLoading ? 'Validation...' : 'Valider avec traçabilité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Derogation Certificate Generation */}
      {derogationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0A2540] flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Dérogation Administrative d'Attestation
              </h4>
              <button
                onClick={() => setDerogationTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1">
              <div className="text-rose-900 font-bold">
                Attention : Le participant n'a pas validé les deux scans réglementaires.
              </div>
              <div>
                Participant : <strong>{derogationTarget.prenom} {derogationTarget.nom}</strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motif formel de la dérogation <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={derogationMotif}
                  onChange={(e) => setDerogationMotif(e.target.value)}
                  placeholder="Ex: Participation physique continue constatée par le formateur malgré défaillance de connexion..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDerogationTarget(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={certLoading || !derogationMotif.trim()}
                  onClick={() => handleIssueCert(derogationTarget, true)}
                  className="px-4 py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {certLoading ? 'Génération...' : 'Émettre l’attestation sous dérogation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
