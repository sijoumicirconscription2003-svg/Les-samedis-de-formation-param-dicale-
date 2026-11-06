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
  UserPlus,
  GraduationCap,
  Share2,
  Copy,
  ExternalLink,
  Printer,
  Lock,
  Unlock,
  Phone,
  RotateCcw,
  History,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  TrainingSession,
  Registration,
  UserProfile,
  Certificate,
  AttendanceStatus,
  FormateurItem,
  AuditLog,
} from '../types';
import {
  createTraining,
  updateTraining,
  deleteTraining,
  toggleCheckinStatus,
  listenTrainingRegistrations,
  DEFAULT_TRAINING_LOCATION,
  toggleTrainingExtraSeats,
  toggleTrainingInscriptionsLock,
  adminSetRegistrationStatus,
  logAuditAction,
} from '../services/trainingService';
import { manualAttendanceOverride } from '../services/attendanceService';
import { issueCertificate } from '../services/certificateService';
import {
  syncOfficial19Trainings,
  resetAllTrainingsPlacesAndCapacity,
  delete2027Trainings,
} from '../services/seedData';
import { useAuth } from '../contexts/AuthContext';
import { ManageTrainersModal } from './ManageTrainersModal';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  trainings: TrainingSession[];
  onOpenProjector: (training: TrainingSession) => void;
  onViewCertificate: (cert: Certificate) => void;
  onOpenTemplates?: (training: TrainingSession) => void;
  onOpenCertStudio?: () => void;
  onOpenPublicRegistration?: (trainingId: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  trainings,
  onOpenProjector,
  onViewCertificate,
  onOpenTemplates,
  onOpenCertStudio,
  onOpenPublicRegistration,
}) => {
  const { userProfile } = useAuth();

  // Selected training for inspection & roster
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(
    trainings[0]?.id || ''
  );
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Sub-tab selection: 'inscriptions' (Registration management) vs 'presences' (Attendance QR pointage)
  const [activeSubTab, setActiveSubTab] = useState<'inscriptions' | 'presences'>('inscriptions');

  // Inscriptions management filters
  const [inscriptionsSearch, setInscriptionsSearch] = useState('');
  const [inscriptionsFilterStatus, setInscriptionsFilterStatus] = useState<
    'ALL' | 'CONFIRMEE' | 'LISTE_ATTENTE' | 'ANNULEE' | 'REFUSEE'
  >('ALL');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Filters for the attendance roster
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtablissement, setFilterEtablissement] = useState('ALL');
  const [filterPresence, setFilterPresence] = useState('ALL');
  const [filterDomaine, setFilterDomaine] = useState('ALL');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);

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

  // Action feedback banner (replaces blocked window.alert)
  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<TrainingSession | null>(null);
  const [isManageTrainersOpen, setIsManageTrainersOpen] = useState(false);

  // Training form state
  const [formData, setFormData] = useState({
    theme: '',
    domaine: 'URGENCES',
    numeroSeance: 1,
    description: '',
    formateur: '',
    qualiteFormateur: '',
    formateurs: [] as FormateurItem[],
    date: '',
    heureDebut: '12:30',
    heureFin: '13:30',
    dureeHeures: '60 minutes',
    lieu: DEFAULT_TRAINING_LOCATION,
    capaciteMax: 32,
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

  // Listen to real-time audit logs for transparency
  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('horodatage', 'desc'),
      limit(40)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AuditLog, 'id'>),
        }));
        setAuditLogs(list);
      },
      (err) => console.warn('Audit logs listener warning:', err)
    );
    return () => unsub();
  }, []);

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
    const totalCapacite = trainings.reduce((acc, t) => acc + (t.capaciteMax || 32), 0);
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

  // Inscriptions management stats
  const inscriptionStats = useMemo(() => {
    const demandesTotales = registrations.length;
    const confirmes = registrations.filter((r) => r.statut === 'CONFIRMEE').length;
    const attente = registrations.filter((r) => r.statut === 'LISTE_ATTENTE').length;
    const annulees = registrations.filter(
      (r) => r.statut === 'ANNULEE' || r.statut === 'REFUSEE'
    ).length;

    const capaciteNormale = activeTraining?.capaciteNormale || 32;
    const autoriserPlacesSupp = Boolean(activeTraining?.autoriserPlacesSupp);
    const capaciteMaxAutorisee = activeTraining?.capaciteMaxAutorisee || 35;
    const effectiveCap = autoriserPlacesSupp ? capaciteMaxAutorisee : capaciteNormale;
    const placesRestantes = Math.max(0, effectiveCap - confirmes);

    return {
      demandesTotales,
      confirmes,
      attente,
      annulees,
      capaciteNormale,
      autoriserPlacesSupp,
      capaciteMaxAutorisee,
      effectiveCap,
      placesRestantes,
      inscriptionsFermees: Boolean(activeTraining?.inscriptionsFermees),
    };
  }, [registrations, activeTraining]);

  // Filtered registrations for Inscriptions Management table
  const filteredInscriptions = useMemo(() => {
    return registrations.filter((r) => {
      const q = inscriptionsSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        `${r.nom} ${r.prenom} ${r.telephone || ''} ${r.profession || r.fonction || ''} ${r.etablissement || ''} ${r.circonscription || ''} ${r.numeroReservation || ''}`
          .toLowerCase()
          .includes(q);

      let matchStatus = true;
      if (inscriptionsFilterStatus !== 'ALL') {
        matchStatus = r.statut === inscriptionsFilterStatus;
      }
      return matchSearch && matchStatus;
    });
  }, [registrations, inscriptionsSearch, inscriptionsFilterStatus]);

  const handleOpenCreate = () => {
    setEditingTraining(null);
    setFormData({
      theme: '',
      domaine: 'URGENCES',
      numeroSeance: trainings.length + 1,
      description: '',
      formateur: '',
      qualiteFormateur: '',
      formateurs: [],
      date: '',
      heureDebut: '12:30',
      heureFin: '13:30',
      dureeHeures: '60 minutes',
      lieu: DEFAULT_TRAINING_LOCATION,
      capaciteMax: 32,
      dateLimiteInscription: '',
      estPublie: true,
      objectifsText: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (t: TrainingSession) => {
    setEditingTraining(t);
    const initialTrainers: FormateurItem[] =
      t.formateurs && t.formateurs.length > 0
        ? t.formateurs
        : t.formateur && t.formateur.trim()
        ? [{ nom: t.formateur, qualite: t.qualiteFormateur || '' }]
        : [];

    setFormData({
      theme: t.theme,
      domaine: t.domaine || 'URGENCES',
      numeroSeance: t.numeroSeance || 1,
      description: t.description || '',
      formateur: t.formateur || '',
      qualiteFormateur: t.qualiteFormateur || '',
      formateurs: initialTrainers,
      date: t.date,
      heureDebut: t.heureDebut || '12:30',
      heureFin: t.heureFin || '13:30',
      dureeHeures: t.dureeHeures || '60 minutes',
      lieu: t.lieu || DEFAULT_TRAINING_LOCATION,
      capaciteMax: t.capaciteMax || 32,
      dateLimiteInscription: t.dateLimiteInscription || '',
      estPublie: t.estPublie,
      objectifsText: (t.objectifs || []).join('\n'),
    });
    setIsCreateModalOpen(true);
  };

  const handleSync19Official = async () => {
    setSyncingOfficial(true);
    setActionBanner({
      type: 'info',
      message: 'Synchronisation du programme officiel (Dernier Trimestre 2026, 10 séances)...',
    });
    try {
      const count = await syncOfficial19Trainings(true);
      setActionBanner({
        type: 'success',
        message: `Synchronisation réussie ! Les ${count} formations officielles (24/10/2026 au 26/12/2026) sont actives dans Firestore avec 32 places max, 0 réservations et case formateur vide. Toutes les séances de 2027 ont été supprimées.`,
      });
    } catch (err) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur de synchronisation.',
      });
    } finally {
      setSyncingOfficial(false);
    }
  };

  const handleDelete2027Trainings = async () => {
    setSyncingOfficial(true);
    setActionBanner({
      type: 'info',
      message: 'Suppression en cours des formations du 02/01/2027 au 27/02/2027...',
    });
    try {
      const count = await delete2027Trainings();
      setActionBanner({
        type: 'success',
        message: `Opération réussie ! ${count} formations de 2027 (du 02/01/2027 au 27/02/2027) ont été supprimées de Firestore. Seules les formations du dernier trimestre 2026 sont conservées.`,
      });
    } catch (err) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression des formations de 2027.',
      });
    } finally {
      setSyncingOfficial(false);
    }
  };

  const handleResetPlacesAndCapacity = async () => {
    setSyncingOfficial(true);
    setActionBanner({
      type: 'info',
      message: 'Réinitialisation à 32 places et suppression des formateurs en cours...',
    });
    try {
      const count = await resetAllTrainingsPlacesAndCapacity(32, true);
      setActionBanner({
        type: 'success',
        message: `Opération réussie ! ${count} séances ont été réinitialisées à 32 places max disponibles (0 réservées) et les noms des formateurs ont été effacés (case vide prête pour votre saisie dès confirmation).`,
      });
    } catch (err) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.',
      });
    } finally {
      setSyncingOfficial(false);
    }
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const objectifs = formData.objectifsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const nonBlankTrainers = formData.formateurs.filter((f) => f.nom && f.nom.trim());
    const synthFormateur = nonBlankTrainers.map((f) => f.nom.trim()).join(' & ') || formData.formateur.trim();
    const synthQualite = nonBlankTrainers.map((f) => f.qualite?.trim()).filter(Boolean).join(' / ') || formData.qualiteFormateur.trim();

    try {
      if (editingTraining) {
        await updateTraining(editingTraining.id, {
          theme: formData.theme,
          domaine: formData.domaine,
          numeroSeance: Number(formData.numeroSeance) || 1,
          description: formData.description,
          formateur: synthFormateur,
          qualiteFormateur: synthQualite,
          formateurs: nonBlankTrainers,
          date: formData.date,
          heureDebut: formData.heureDebut,
          heureFin: formData.heureFin,
          dureeHeures: formData.dureeHeures,
          lieu: formData.lieu,
          capaciteMax: Number(formData.capaciteMax) || 32,
          dateLimiteInscription: formData.dateLimiteInscription,
          estPublie: formData.estPublie,
          objectifs,
        });
        setActionBanner({
          type: 'success',
          message: `Formation "${formData.theme}" modifiée avec succès.`,
        });
      } else {
        const newId = await createTraining(
          {
            theme: formData.theme,
            domaine: formData.domaine,
            numeroSeance: Number(formData.numeroSeance) || 1,
            description: formData.description,
            formateur: synthFormateur,
            qualiteFormateur: synthQualite,
            formateurs: nonBlankTrainers,
            date: formData.date,
            heureDebut: formData.heureDebut,
            heureFin: formData.heureFin,
            dureeHeures: formData.dureeHeures,
            lieu: formData.lieu,
            capaciteMax: Number(formData.capaciteMax) || 32,
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
        setActionBanner({
          type: 'success',
          message: `Formation "${formData.theme}" créée avec succès avec 32 places max.`,
        });
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.',
      });
    }
  };

  const handleDeleteTraining = async (t: TrainingSession) => {
    setDeleteConfirmTarget(t);
  };

  const confirmDeleteTraining = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await deleteTraining(deleteConfirmTarget.id);
      if (selectedTrainingId === deleteConfirmTarget.id) {
        setSelectedTrainingId(trainings.find((x) => x.id !== deleteConfirmTarget.id)?.id || '');
      }
      setActionBanner({
        type: 'success',
        message: `La formation "${deleteConfirmTarget.theme}" a été supprimée.`,
      });
    } catch (err) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur de suppression.',
      });
    } finally {
      setDeleteConfirmTarget(null);
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
      setActionBanner({
        type: 'success',
        message: `Validation manuelle enregistrée pour ${manualOverrideTarget.prenom} ${manualOverrideTarget.nom}.`,
      });
    } catch (err) {
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur de validation manuelle.',
      });
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
      setActionBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de l’émission de l’attestation.',
      });
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

  // Toggle the 3 extra places option (32 to 35)
  const handleToggleExtraSeats = async () => {
    if (!activeTraining) return;
    setActionInProgress(true);
    try {
      const nextVal = !activeTraining.autoriserPlacesSupp;
      const { promotedCount, newCapaciteMax } = await toggleTrainingExtraSeats(
        activeTraining.id,
        nextVal,
        userProfile?.email
      );
      setActionBanner({
        type: 'success',
        message: nextVal
          ? `Option des 3 places supplémentaires activée ! Capacité étendue à ${newCapaciteMax} participants.${
              promotedCount > 0
                ? ` ${promotedCount} candidat(s) en attente ont été promus automatiquement en statut CONFIRMÉ.`
                : ''
            }`
          : `Option des 3 places supplémentaires désactivée. Capacité ramenée à ${newCapaciteMax} participants standard.`,
      });
    } catch (err: any) {
      setActionBanner({
        type: 'error',
        message: err?.message || 'Erreur lors de la modification de la capacité.',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Toggle opening / closing of registrations
  const handleToggleInscriptionsLock = async () => {
    if (!activeTraining) return;
    setActionInProgress(true);
    try {
      const nextClosed = !activeTraining.inscriptionsFermees;
      await toggleTrainingInscriptionsLock(
        activeTraining.id,
        nextClosed,
        userProfile?.email
      );
      setActionBanner({
        type: 'success',
        message: nextClosed
          ? 'Les inscriptions publiques pour cette séance sont maintenant FERMÉES.'
          : 'Les inscriptions publiques pour cette séance sont maintenant OUVERTES.',
      });
    } catch (err: any) {
      setActionBanner({
        type: 'error',
        message: err?.message || 'Erreur lors de la modification du verrouillage.',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Admin update registration status
  const handleAdminChangeStatus = async (
    reg: Registration,
    newStatus: 'CONFIRMEE' | 'REFUSEE' | 'ANNULEE'
  ) => {
    if (!activeTraining) return;
    setActionInProgress(true);
    try {
      const res = await adminSetRegistrationStatus(
        activeTraining.id,
        reg.id,
        newStatus,
        userProfile?.email,
        'Action manuelle administrateur'
      );
      setActionBanner({
        type: 'success',
        message: `Inscription de ${reg.prenom} ${reg.nom} passée à ${newStatus}.${
          res.promotedCandidateName
            ? ` La place libérée a été automatiquement attribuée à ${res.promotedCandidateName} (premier sur la liste d'attente).`
            : ''
        }`,
      });
    } catch (err: any) {
      setActionBanner({
        type: 'error',
        message: err?.message || 'Erreur lors de la modification du statut.',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Public Share URL & Helpers
  const getPublicShareUrl = (trainingId: string) => {
    return `${window.location.origin}/?inscription=${trainingId}`;
  };

  const getShareTextForTraining = (t: TrainingSession) => {
    const cap = t.capaciteNormale || 32;
    const dateFormatted =
      t.date === '2026-11-07' ? 'Samedi 7 novembre 2026' : `Samedi ${t.date}`;
    const trainer = t.formateur || 'Mme Hamdani Inès';
    const url = getPublicShareUrl(t.id);

    return `Formation Continue Paramédicale – Centre Intermédiaire Ali Trad | GSB Tunis Sud
Date : ${dateFormatted} de ${t.heureDebut} à ${t.heureFin}
Thème : ${t.theme}
Formatrice : ${trainer}
Lieu : ${t.lieu || 'Salle de réunion du Centre Intermédiaire Ali Trad'}
Inscriptions ouvertes (places limitées à ${cap} participants) :
👉 Lien d'inscription : ${url}`;
  };

  const handleShareWhatsApp = (t: TrainingSession) => {
    const text = getShareTextForTraining(t);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = (t: TrainingSession) => {
    const shareUrl = getPublicShareUrl(t.id);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleCopyShareLink = (t: TrainingSession) => {
    const shareUrl = getPublicShareUrl(t.id);
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
    setActionBanner({
      type: 'success',
      message: 'Lien d’inscription copié ! Prêt à être partagé sur WhatsApp ou Facebook.',
    });
  };

  // Export registrations table to CSV
  const handleExportInscriptionsCSV = () => {
    if (!activeTraining) return;

    const headers = [
      'N° Réservation',
      'Nom',
      'Prénom',
      'Profession / Fonction',
      'Établissement',
      'Circonscription',
      'Téléphone',
      'Statut Inscription',
      'Position Attente',
      'Date Inscription',
    ];

    const rows = filteredInscriptions.map((r) => [
      `"${r.numeroReservation || ''}"`,
      `"${r.nom || ''}"`,
      `"${r.prenom || ''}"`,
      `"${r.profession || r.fonction || ''}"`,
      `"${r.etablissement || ''}"`,
      `"${r.circonscription || ''}"`,
      `"${r.telephone || ''}"`,
      `"${r.statut}"`,
      `"${r.positionAttente || ''}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `inscriptions_ali_trad_${activeTraining.date}_${activeTraining.id}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintInscriptionsPDF = () => {
    window.print();
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
            title="Synchroniser les 10 formations officielles (du 24/10/2026 au 26/12/2026) avec 32 places max, 0 réservations et formateur vide"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            {syncingOfficial ? 'Synchronisation...' : 'Synchroniser les 10 Séances (2026)'}
          </button>

          <button
            onClick={handleDelete2027Trainings}
            disabled={syncingOfficial}
            className="px-3.5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            title="Supprimer les séances programmées en 2027 (du 02/01/2027 au 27/02/2027)"
          >
            <Trash2 className="w-4 h-4 text-red-200" />
            Supprimer Séances 2027
          </button>

          <button
            onClick={handleResetPlacesAndCapacity}
            disabled={syncingOfficial}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            title="Remettre le nombre de places disponibles à 32 max pour toutes les séances et réinitialiser les réservations à zéro"
          >
            <Users className="w-4 h-4 text-amber-300" />
            Remettre à 32 places (0 réservées)
          </button>

          <button
            onClick={() => setIsManageTrainersOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            title="Gérer, ajouter ou supprimer les formateurs de toutes les séances restantes"
          >
            <GraduationCap className="w-4 h-4 text-amber-300" />
            Gérer les Formateurs
          </button>

          {onOpenTemplates && (
            <button
              onClick={() => onOpenTemplates(activeTraining || trainings[0])}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              title="Ouvrir le studio des modèles élégants Full HD (1080p) pour chaque thème de formation"
            >
              <Tv className="w-4 h-4 text-amber-300" />
              Modèles Full HD (1080p)
            </button>
          )}

          {onOpenCertStudio && (
            <button
              onClick={onOpenCertStudio}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              title="Générer les attestations pour chaque cours de formation en Full HD (1 Cours = 1 Thème Spécifique)"
            >
              <Award className="w-4 h-4 text-amber-300" />
              Attestations par Thème HD
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Créer une Formation
          </button>
        </div>
      </div>

      {/* Real-time Status & Action Feedback Banner */}
      {actionBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 ${
            actionBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : actionBanner.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionBanner.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {actionBanner.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
            {actionBanner.type === 'info' && <Clock className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />}
            <span className="text-xs sm:text-sm font-semibold">{actionBanner.message}</span>
          </div>
          <button
            onClick={() => setActionBanner(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            sur {activeTraining?.capaciteMax || 32} places
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
              <span className={`font-semibold block ${activeTraining.formateur ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                {activeTraining.formateur || 'À désigner (à remplir)'}
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
                {activeTraining.placesReservees || 0} / {activeTraining.capaciteMax || 32} réservées
              </span>
              <span className="text-[11px] text-amber-700 font-medium">
                {activeTraining.nbListeAttente || 0} en liste d'attente
              </span>
            </div>
          </div>
        )}

        {/* Social Sharing Quick Actions for the Selected Training */}
        {activeTraining && (
          <div className="bg-gradient-to-r from-[#0A2540] via-[#0E2E54] to-[#164273] text-white p-4 sm:p-5 rounded-2xl border border-amber-400/40 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold uppercase text-xs tracking-wider">
                <Share2 className="w-4 h-4" />
                <span>Diffusion & Inscription Publique aux Formations</span>
              </div>
              <div className="text-xs text-slate-200">
                Partagez l'invitation officielle sur les réseaux sociaux et groupes de soignants
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleShareWhatsApp(activeTraining)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                title="Partager l'invitation officielle sur WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>PARTAGER SUR WHATSAPP</span>
              </button>

              <button
                onClick={() => handleShareFacebook(activeTraining)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                title="Partager sur Facebook"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>PARTAGER SUR FACEBOOK</span>
              </button>

              <button
                onClick={() => handleCopyShareLink(activeTraining)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                title="Copier l'URL publique de la séance"
              >
                {copiedShareLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                    <span>LIEN COPIÉ !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-950" />
                    <span>COPIER LE LIEN D'INSCRIPTION</span>
                  </>
                )}
              </button>

              {onOpenPublicRegistration && (
                <button
                  onClick={() => onOpenPublicRegistration(activeTraining.id)}
                  className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/25 transition-all flex items-center gap-1.5"
                  title="Prévisualiser la page d'inscription telle que vue par les participants"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                  <span>VOIR LA PAGE PUBLIQUE</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sub-tab Switcher: Inscriptions vs Présences */}
        <div className="flex border-b border-slate-200 gap-6 pt-2">
          <button
            onClick={() => setActiveSubTab('inscriptions')}
            className={`pb-3 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'inscriptions'
                ? 'border-amber-500 text-[#0A2540]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-500" />
            <span>1. GESTION DES INSCRIPTIONS & PLACES</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black">
              {registrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('presences')}
            className={`pb-3 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'presences'
                ? 'border-blue-600 text-[#0A2540]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>2. ÉMARGEMENT & POINTAGE QR (SALLE)</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black">
              {stats.arrives} présents
            </span>
          </button>
        </div>

        {/* ===================== SUB-TAB 1: GESTION DES INSCRIPTIONS & PLACES ===================== */}
        {activeSubTab === 'inscriptions' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Intelligent Capacity Controls Card */}
            <div className="bg-[#FAF9F5] rounded-3xl p-5 border-2 border-amber-300/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Règles de Gestion Intelligente des Places</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Capacité normale : <strong>32 participants</strong> • Capacité maximale autorisée : <strong>35 participants</strong>
                  </div>
                </div>

                {/* Administrative Toggles */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Toggle 3 Extra Places */}
                  <button
                    onClick={handleToggleExtraSeats}
                    disabled={actionInProgress}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-xs border ${
                      inscriptionStats.autoriserPlacesSupp
                        ? 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title="Autorise 3 places supplémentaires (33 à 35) et promeut automatiquement les candidats en attente"
                  >
                    {inscriptionStats.autoriserPlacesSupp ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-300" />
                        <span>3 Places Suppl. : ACTIVÉES (Max: 35)</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                        <span>Autoriser les 3 places supp. (Max: 35)</span>
                      </>
                    )}
                  </button>

                  {/* Toggle Inscriptions Lock */}
                  <button
                    onClick={handleToggleInscriptionsLock}
                    disabled={actionInProgress}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs border ${
                      inscriptionStats.inscriptionsFermees
                        ? 'bg-rose-700 text-white border-rose-800 hover:bg-rose-800'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                    title="Ouvre ou ferme manuellement les inscriptions publiques"
                  >
                    {inscriptionStats.inscriptionsFermees ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-white" />
                        <span>Inscriptions : FERMÉES</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Inscriptions : OUVERTES</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 5 Real-time KPI Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* 1. Demandes Totales */}
                <div
                  onClick={() => setInscriptionsFilterStatus('ALL')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    inscriptionsFilterStatus === 'ALL'
                      ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-md ring-2 ring-amber-400'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                    Demandes Totales
                  </div>
                  <div className="text-2xl font-black mt-1">
                    {inscriptionStats.demandesTotales}
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5">Toutes requêtes</div>
                </div>

                {/* 2. Inscriptions Confirmées */}
                <div
                  onClick={() => setInscriptionsFilterStatus('CONFIRMEE')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    inscriptionsFilterStatus === 'CONFIRMEE'
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400'
                      : 'bg-white hover:bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    Places Occupées
                  </div>
                  <div className="text-2xl font-black mt-1 text-emerald-700">
                    {inscriptionStats.confirmes}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    sur {inscriptionStats.effectiveCap} max
                  </div>
                </div>

                {/* 3. Places Restantes */}
                <div className="p-3.5 rounded-2xl border bg-white border-slate-200 text-slate-800">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                    Places Restantes
                  </div>
                  <div
                    className={`text-2xl font-black mt-1 ${
                      inscriptionStats.placesRestantes > 0
                        ? 'text-blue-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {inscriptionStats.placesRestantes}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {inscriptionStats.placesRestantes > 0
                      ? 'Disponibles'
                      : 'Complet (liste attente)'}
                  </div>
                </div>

                {/* 4. En Liste d'Attente */}
                <div
                  onClick={() => setInscriptionsFilterStatus('LISTE_ATTENTE')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    inscriptionsFilterStatus === 'LISTE_ATTENTE'
                      ? 'bg-amber-800 text-white border-amber-900 shadow-md ring-2 ring-amber-400'
                      : 'bg-white hover:bg-amber-50/50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                    Liste d'Attente
                  </div>
                  <div className="text-2xl font-black mt-1 text-amber-700">
                    {inscriptionStats.attente}
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">
                    En attente de désistement
                  </div>
                </div>

                {/* 5. Annulées / Refusées */}
                <div
                  onClick={() => setInscriptionsFilterStatus('ANNULEE')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                    inscriptionsFilterStatus === 'ANNULEE' || inscriptionsFilterStatus === 'REFUSEE'
                      ? 'bg-slate-800 text-white border-slate-900 shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                    Annulées / Refusées
                  </div>
                  <div className="text-2xl font-black mt-1">
                    {inscriptionStats.annulees}
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5">Places réattribuées</div>
                </div>
              </div>
            </div>

            {/* Inscriptions Table Controls & Exports */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0A2540] flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Registre des Inscriptions ({filteredInscriptions.length})</span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportInscriptionsCSV}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  title="Exporter le registre au format Excel (CSV)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Exporter Excel (CSV)</span>
                </button>

                <button
                  onClick={handlePrintInscriptionsPDF}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  title="Imprimer ou enregistrer en PDF la liste nominative"
                >
                  <Printer className="w-3.5 h-3.5 text-[#0A2540]" />
                  <span>Imprimer / PDF</span>
                </button>

                <button
                  onClick={() => setShowAuditLogsModal(true)}
                  className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center gap-1.5 border border-amber-300"
                  title="Consulter le journal d'audit et la traçabilité des inscriptions"
                >
                  <History className="w-3.5 h-3.5 text-amber-700" />
                  <span>Journal d'Audit ({auditLogs.length})</span>
                </button>
              </div>
            </div>

            {/* Search and status filter bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, téléphone, établissement, référence..."
                  value={inscriptionsSearch}
                  onChange={(e) => setInscriptionsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div>
                <select
                  value={inscriptionsFilterStatus}
                  onChange={(e) => setInscriptionsFilterStatus(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] bg-white font-semibold"
                >
                  <option value="ALL">Tous les statuts d'inscription</option>
                  <option value="CONFIRMEE">Confirmées uniquement</option>
                  <option value="LISTE_ATTENTE">Liste d'attente uniquement</option>
                  <option value="ANNULEE">Annulées</option>
                  <option value="REFUSEE">Refusées</option>
                </select>
              </div>
            </div>

            {/* Comprehensive Inscriptions Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A2540] text-white text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Nom et Prénom</th>
                    <th className="py-3 px-3">Profession / Fonction</th>
                    <th className="py-3 px-3">Établissement</th>
                    <th className="py-3 px-3">Circonscription</th>
                    <th className="py-3 px-3">Téléphone</th>
                    <th className="py-3 px-3">Statut</th>
                    <th className="py-3 px-3">Date d'inscription</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Aucune inscription enregistrée pour cette session.
                      </td>
                    </tr>
                  ) : (
                    filteredInscriptions.map((r) => {
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Nom et Prénom */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900">
                              {r.prenom} {r.nom}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {r.numeroReservation}
                            </div>
                          </td>

                          {/* Profession */}
                          <td className="py-3 px-3 text-slate-800 font-medium">
                            {r.profession || r.fonction || 'Non renseigné'}
                          </td>

                          {/* Établissement */}
                          <td className="py-3 px-3 text-slate-700">
                            <div className="truncate max-w-[150px]" title={r.etablissement}>
                              {r.etablissement}
                            </div>
                          </td>

                          {/* Circonscription */}
                          <td className="py-3 px-3 text-slate-600 text-[11px]">
                            {r.circonscription || 'Sijoumi'}
                          </td>

                          {/* Téléphone */}
                          <td className="py-3 px-3 font-mono text-slate-800 font-bold">
                            {r.telephone ? (
                              <a
                                href={`tel:${r.telephone}`}
                                className="text-blue-700 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{r.telephone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="py-3 px-3">
                            {r.statut === 'CONFIRMEE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                <Check className="w-3 h-3" />
                                Confirmée
                              </span>
                            ) : r.statut === 'LISTE_ATTENTE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                                <AlertTriangle className="w-3 h-3" />
                                Attente #{r.positionAttente}
                              </span>
                            ) : r.statut === 'REFUSEE' ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                Refusée
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                                Annulée
                              </span>
                            )}
                          </td>

                          {/* Date Inscription */}
                          <td className="py-3 px-3 text-slate-500 text-[11px]">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Confirm button */}
                              {r.statut !== 'CONFIRMEE' && (
                                <button
                                  disabled={actionInProgress}
                                  onClick={() => handleAdminChangeStatus(r, 'CONFIRMEE')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                                  title="Confirmer manuellement cette inscription"
                                >
                                  Confirmer
                                </button>
                              )}

                              {/* Refuse button */}
                              {r.statut !== 'REFUSEE' && (
                                <button
                                  disabled={actionInProgress}
                                  onClick={() => handleAdminChangeStatus(r, 'REFUSEE')}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-bold transition-all"
                                  title="Refuser cette demande"
                                >
                                  Refuser
                                </button>
                              )}

                              {/* Cancel button */}
                              {r.statut !== 'ANNULEE' && (
                                <button
                                  disabled={actionInProgress}
                                  onClick={() => handleAdminChangeStatus(r, 'ANNULEE')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-medium transition-all"
                                  title="Annuler l'inscription (libère la place et promeut la liste d'attente)"
                                >
                                  Annuler
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
        )}

        {/* ===================== SUB-TAB 2: ÉMARGEMENT & POINTAGE QR (SALLE) ===================== */}
        {activeSubTab === 'presences' && (
          <div className="space-y-6 animate-in fade-in">
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
                  Inscriptions confirmées dans la base (Capacité: {activeTraining?.capaciteMax || 32})
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
                  Liste Nominative d'Émargement ({filteredRegistrations.length})
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exporter CSV Pointages
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
                                {r.email || r.telephone}
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
                                Mat : {r.matricule || 'N/A'}
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
        )}
      </div>

      {/* MODAL: Audit Trail Viewer */}
      {showAuditLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-base text-[#0A2540]">
                  Journal d'Audit & Traçabilité des Inscriptions
                </h4>
              </div>
              <button
                onClick={() => setShowAuditLogsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Traçabilité certifiée des inscriptions, des changements de capacité (32 à 35) et des promotions de listes d'attente.
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  Aucun événement d'audit enregistré pour le moment.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.horodatage).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-slate-800 font-medium">
                      {log.details}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Par : <strong>{log.adminEmail}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAuditLogsModal(false)}
                className="px-4 py-2 bg-[#0A2540] text-white font-bold text-xs rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Formateurs (un ou plusieurs) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Équipe de formation ({formData.formateurs.length} formateur{formData.formateurs.length > 1 ? 's' : ''})
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Ajoutez un ou plusieurs formateurs (co-animation) ou laissez vide pour désigner après.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        formateurs: [...formData.formateurs, { nom: '', qualite: '' }],
                      });
                    }}
                    className="px-3 py-1.5 bg-[#0A2540] hover:bg-[#0F2F57] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs self-start"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                    + Ajouter un formateur
                  </button>
                </div>

                {formData.formateurs.length === 0 ? (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 italic text-center">
                    Aucun formateur désigné pour le moment (laisser vide, à remplir une fois confirmé).
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {formData.formateurs.map((fItem, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-2xs"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#0A2540] text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {fIdx + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Nom et prénom du formateur (ex: Dr. Ben Salem)"
                            value={fItem.nom}
                            onChange={(e) => {
                              const updated = [...formData.formateurs];
                              updated[fIdx] = { ...updated[fIdx], nom: e.target.value };
                              setFormData({ ...formData, formateurs: updated });
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                          />
                          <input
                            type="text"
                            placeholder="Qualité / Spécialité (ex: Infirmier Major, SAMU)"
                            value={fItem.qualite || ''}
                            onChange={(e) => {
                              const updated = [...formData.formateurs];
                              updated[fIdx] = { ...updated[fIdx], qualite: e.target.value };
                              setFormData({ ...formData, formateurs: updated });
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.formateurs.filter((_, idx) => idx !== fIdx);
                            setFormData({ ...formData, formateurs: updated });
                          }}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Supprimer ce formateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    min={1}
                    max={100}
                    required
                    value={formData.capaciteMax}
                    onChange={(e) => setFormData({ ...formData, capaciteMax: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Fixé à 32 places max par défaut (selon la capacité de la salle).
                  </p>
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

      {/* Delete Training Confirmation Modal (in-app modal, replaces blocked window.confirm) */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Confirmer la suppression</h3>
            </div>
            <p className="text-xs text-slate-600">
              Voulez-vous vraiment supprimer la formation <strong className="text-slate-900">"{deleteConfirmTarget.theme}"</strong> prévue le {deleteConfirmTarget.date} ?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteTraining}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Multi-Trainer Manager Modal */}
      <ManageTrainersModal
        isOpen={isManageTrainersOpen}
        onClose={() => setIsManageTrainersOpen(false)}
        trainings={trainings}
        onSuccessNotification={(msg) =>
          setActionBanner({ type: 'success', message: msg })
        }
      />
    </div>
  );
};
