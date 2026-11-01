import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BookmarkCheck,
  QrCode,
  Award,
  Users,
  Shield,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  Check,
  ChevronRight,
  Building2,
  FileText,
  PhoneCall,
  UserCheck,
  Share2,
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { testFirestoreConnection } from './lib/firebase';
import {
  listenTrainings,
  listenUserRegistrations,
  bookTrainingAtomic,
  cancelRegistration,
} from './services/trainingService';
import {
  listenUserCertificates,
  listenAllCertificates,
} from './services/certificateService';
import { listenUserNotifications } from './services/notificationService';
import { bootstrapInitialDataIfEmpty, OFFICIAL_19_TRAININGS } from './services/seedData';
import {
  TrainingSession,
  Registration,
  Certificate,
  NotificationItem,
} from './types';

import { InstitutionalBanner } from './components/InstitutionalBanner';
import { Navbar, NavTab } from './components/Navbar';
import { TrainingCard } from './components/TrainingCard';
import { TrainingDetailModal } from './components/TrainingDetailModal';
import { ReservationSuccessModal } from './components/ReservationSuccessModal';
import { QRScannerModal } from './components/QRScannerModal';
import { RoomProjectorModal } from './components/RoomProjectorModal';
import { CertificateTemplate } from './components/CertificateTemplate';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfileModal } from './components/UserProfileModal';
import { ShareAppModal } from './components/ShareAppModal';
import { SessionAttendanceModal } from './components/SessionAttendanceModal';

function MainApp() {
  const {
    currentUser,
    userProfile,
    isAdmin,
    isResponsable,
    needsProfileCompletion,
    signInWithGoogle,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('accueil');
  const [trainings, setTrainings] = useState<TrainingSession[]>(() =>
    OFFICIAL_19_TRAININGS.map((t, idx) => ({
      ...t,
      id: `training-fmc-s${String(idx + 1).padStart(2, '0')}`,
    }))
  );
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [userCertificates, setUserCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals
  const [selectedTrainingForDetail, setSelectedTrainingForDetail] =
    useState<TrainingSession | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [confirmedReservationData, setConfirmedReservationData] = useState<{
    training: TrainingSession;
    reservationNumber: string;
  } | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [targetTrainingForScan, setTargetTrainingForScan] =
    useState<TrainingSession | undefined>(undefined);

  const [projectorTraining, setProjectorTraining] =
    useState<TrainingSession | null>(null);

  const [activeCertificate, setActiveCertificate] =
    useState<Certificate | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [attendanceTargetTraining, setAttendanceTargetTraining] =
    useState<TrainingSession | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Filters for Programme view
  const [programmeSearch, setProgrammeSearch] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState<'ALL' | 'DISPO' | 'COMPLET'>('ALL');
  const [programmeDomaine, setProgrammeDomaine] = useState<string>('ALL');

  // Register service worker if available
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Startup test connection
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync to Firestore once authenticated
  useEffect(() => {
    if (currentUser) {
      bootstrapInitialDataIfEmpty().catch(() => {});
    }
  }, [currentUser]);

  // Listen to Trainings in real time
  useEffect(() => {
    const unsub = listenTrainings((list) => {
      if (list && list.length > 0) {
        setTrainings(list);
      }
    });
    return () => unsub();
  }, []);

  // Listen to user registrations
  useEffect(() => {
    if (!currentUser) {
      setUserRegistrations([]);
      return;
    }
    const unsub = listenUserRegistrations(currentUser.uid, (regs) => {
      setUserRegistrations(regs);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to user certificates
  useEffect(() => {
    if (!currentUser) {
      setUserCertificates([]);
      return;
    }
    const unsub = listenUserCertificates(currentUser.uid, (certs) => {
      setUserCertificates(certs);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const unsub = listenUserNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsub();
  }, [currentUser]);

  // Handle Booking
  const handleConfirmBooking = async (training: TrainingSession) => {
    if (!currentUser) {
      try {
        await signInWithGoogle();
      } catch {
        return;
      }
      return;
    }

    if (needsProfileCompletion || !userProfile) {
      setIsProfileModalOpen(true);
      return;
    }

    setBookingLoading(true);
    try {
      const result = await bookTrainingAtomic(training.id, userProfile);

      if (result.status === 'CONFIRMEE') {
        setConfirmedReservationData({
          training,
          reservationNumber: result.reservationNumber,
        });
      } else {
        alert(
          `La formation est complète. Vous avez été placé(e) sur LISTE D'ATTENTE (Position #${result.waitlistPosition}). Vous serez prévenu(e) en cas de libération d'une place !`
        );
      }
      setIsDetailOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la réservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Cancellation
  const handleCancelBooking = async (trainingId: string) => {
    if (!currentUser) return;
    if (
      window.confirm(
        'Êtes-vous certain(e) de vouloir annuler votre inscription ? Votre place sera immédiatement proposée au premier participant de la liste d’attente.'
      )
    ) {
      setBookingLoading(true);
      try {
        await cancelRegistration(trainingId, currentUser.uid);
        setIsDetailOpen(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur lors de l’annulation.');
      } finally {
        setBookingLoading(false);
      }
    }
  };

  const confirmedBookingsCount = userRegistrations.filter(
    (r) => r.statut === 'CONFIRMEE'
  ).length;

  const getRegistrationForTraining = (trainingId: string) => {
    return userRegistrations.find((r) => r.trainingId === trainingId);
  };

  const nextUpcomingTraining = trainings.find(
    (t) => t.estPublie && t.statut === 'a_venir'
  );

  const filteredProgrammeTrainings = trainings.filter((t) => {
    if (!t.estPublie && !isResponsable) return false;
    const matchSearch =
      !programmeSearch ||
      t.theme.toLowerCase().includes(programmeSearch.toLowerCase()) ||
      t.formateur.toLowerCase().includes(programmeSearch.toLowerCase());

    const isFull = (t.placesRestantes || 0) <= 0;
    let matchFilter = true;
    if (programmeFilter === 'DISPO') matchFilter = !isFull;
    if (programmeFilter === 'COMPLET') matchFilter = isFull;

    const matchDomaine =
      programmeDomaine === 'ALL' ||
      (t.domaine && t.domaine.toUpperCase().includes(programmeDomaine.toUpperCase()));

    return matchSearch && matchFilter && matchDomaine;
  }).sort((a, b) => {
    if (a.numeroSeance && b.numeroSeance) {
      return a.numeroSeance - b.numeroSeance;
    }
    return a.date.localeCompare(b.date);
  });

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 flex flex-col font-sans">
      {/* Top Tunisian Health Authority Banner */}
      <InstitutionalBanner />

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenScanner={() => {
          setTargetTrainingForScan(undefined);
          setIsScannerOpen(true);
        }}
        onOpenShare={() => setIsShareModalOpen(true)}
        confirmedBookingsCount={confirmedBookingsCount}
        notifications={notifications}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* TAB 1: ACCUEIL */}
        {activeTab === 'accueil' && (
          <div className="space-y-10 animate-in fade-in">
            {/* Hero Presentation */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0F2F57] to-[#164273] text-white p-6 sm:p-10 shadow-xl border border-amber-400/30">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Formation Continue Paramédicale • Tous les Samedis
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Perfectionnez vos compétences au Centre Intermédiaire Ali Trad
                </h1>

                <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
                  Plateforme officielle de gestion des inscriptions, réservations en temps réel avec attribution garantie des places et contrôle des présences par double pointage QR Code.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('programme')}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Consulter le Programme du Samedi
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/30 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Share2 className="w-4 h-4 text-amber-300" />
                    Partager le Lien de l'App
                  </button>

                  <button
                    onClick={() => {
                      setTargetTrainingForScan(undefined);
                      setIsScannerOpen(true);
                    }}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4 text-amber-300" />
                    Scanner ma Présence
                  </button>
                </div>
              </div>
            </div>

            {/* Spotlight on Next Upcoming Training Session */}
            {nextUpcomingTraining && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400/50 shadow-md">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600 uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    Prochaine Session du Samedi
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Salle de réunion • Ali Trad
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540] leading-snug">
                      {nextUpcomingTraining.theme}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {nextUpcomingTraining.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1">
                      <span className="flex items-center gap-1.5 font-bold text-[#0A2540]">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        Samedi {nextUpcomingTraining.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        {nextUpcomingTraining.heureDebut} - {nextUpcomingTraining.heureFin} ({nextUpcomingTraining.dureeHeures})
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        Formateur : {nextUpcomingTraining.formateur}
                      </span>
                    </div>
                  </div>

                  {/* Seat counter & direct CTA */}
                  <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-amber-200/80 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Disponibilité :</span>
                      <span
                        className={`font-bold ${
                          (nextUpcomingTraining.placesRestantes || 0) > 0
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {nextUpcomingTraining.placesRestantes || 0} places restantes sur {nextUpcomingTraining.capaciteMax || 25}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0A2540]"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((nextUpcomingTraining.placesReservees || 0) /
                                (nextUpcomingTraining.capaciteMax || 25)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleConfirmBooking(nextUpcomingTraining)}
                      disabled={bookingLoading}
                      className="w-full py-3 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      {(nextUpcomingTraining.placesRestantes || 0) <= 0
                        ? "S'inscrire sur liste d'attente"
                        : 'CONFIRMER MA PARTICIPATION'}
                    </button>

                    <button
                      onClick={() => setAttendanceTargetTraining(nextUpcomingTraining)}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/90 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                      title="Consulter les personnes enregistrées, le nombre de participants ayant rejoint et ceux qui n'ont pas encore rejoint"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      👥 Suivi Présences & Participants
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Pillars of the Ali Trad FMC Platform */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-[#0A2540] flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                Organisation des Formations du Centre Intermédiaire Ali Trad
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0A2540] flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Sessions Chaque Samedi
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Programme actualisé des formations paramédicales en salle de réunion avec formateurs hospitaliers et cadres de santé.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Réservation Prioritaire
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Attribution atomique instantanée de la place avec numéro de réservation et gestion automatisée des listes d'attente.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Double Pointage QR Code
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Scan d'arrivée à l'accueil et scan de sortie à la fin avec protection anti-capture d'écran et synchronisation Firestore.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Attestations Officielles A4
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Délivrance de l'attestation nominative de formation continue certifiée avec numéro unique de référence et code de vérification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRAMME DES FORMATIONS */}
        {activeTab === 'programme' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Calendrier Officiel des Sessions
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]">
                  Programme des Formations du Samedi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centre Intermédiaire Ali Trad • Circonscription de Sijoumi
                </p>
              </div>

              {/* Search & Filter pills */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher par thème, formateur..."
                    value={programmeSearch}
                    onChange={(e) => setProgrammeSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setProgrammeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      programmeFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setProgrammeFilter('DISPO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      programmeFilter === 'DISPO'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Places Libres
                  </button>
                  <button
                    onClick={() => setProgrammeFilter('COMPLET')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      programmeFilter === 'COMPLET'
                        ? 'bg-white text-rose-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Complètes
                  </button>
                </div>
              </div>
            </div>

            {/* Consignes & Framework Official Banner */}
            <div className="bg-gradient-to-r from-blue-900/90 via-[#0A2540] to-blue-950 text-white p-4 sm:p-5 rounded-2xl border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                  <span>FMC Personnel — Direction des Soins</span>
                  <span>•</span>
                  <span>Référentiel des Six Circonscriptions Sanitaires</span>
                </div>
                <div className="text-slate-200">
                  <strong>Ponctualité :</strong> Les séances débutent à <strong>12h30 précises</strong> (60 minutes d'échanges).
                  <span className="hidden sm:inline mx-1.5 text-slate-400">|</span>
                  <strong>Émargement :</strong> Double pointage obligatoire (début et fin de séance par QR Code).
                </div>
              </div>

              <div className="shrink-0 font-mono text-[11px] bg-amber-400/20 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-400/30 font-semibold">
                19 Séances au Programme
              </div>
            </div>

            {/* Domaine Filter Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-xs font-semibold mr-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Domaine :
              </span>
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'URGENCE', label: 'Urgences' },
                { id: 'PRATIQUE', label: 'Pratique & ECG' },
                { id: 'SOIN', label: 'Soins & Pansements' },
                { id: 'PRÉVENTION', label: 'Prévention' },
                { id: 'SÉCURITÉ', label: 'Sécurité & AES' },
                { id: 'RELATION', label: 'Relationnel' },
                { id: 'DROIT', label: 'Droit & Éthique' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setProgrammeDomaine(d.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                    programmeDomaine === d.id
                      ? 'bg-[#0A2540] text-amber-300 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Trainings Grid */}
            {filteredProgrammeTrainings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">
                  Aucune formation ne correspond aux critères
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Modifiez votre recherche ou réinitialisez les filtres.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredProgrammeTrainings.map((t) => (
                  <TrainingCard
                    key={t.id}
                    training={t}
                    registration={getRegistrationForTraining(t.id)}
                    onOpenDetails={(tr) => {
                      setSelectedTrainingForDetail(tr);
                      setIsDetailOpen(true);
                    }}
                    onConfirmBooking={handleConfirmBooking}
                    onOpenScan={(tr) => {
                      setTargetTrainingForScan(tr);
                      setIsScannerOpen(true);
                    }}
                    onOpenAttendance={(tr) => {
                      setAttendanceTargetTraining(tr);
                    }}
                    bookingLoading={bookingLoading}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MES RÉSERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Espace Personnel Paramédical
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]">
                Mes Réservations & Inscriptions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi de vos participations confirmées et positions sur les listes d'attente
              </p>
            </div>

            {!currentUser ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
                <UserCheck className="w-12 h-12 text-amber-600 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">
                  Connectez-vous pour consulter vos réservations
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Votre espace personnel vous permet de suivre vos inscriptions, vos numéros de réservation et de scanner vos présences.
                </p>
                <button
                  onClick={signInWithGoogle}
                  className="px-6 py-2.5 bg-[#0A2540] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Se connecter avec Google
                </button>
              </div>
            ) : userRegistrations.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">
                  Vous n'avez aucune réservation enregistrée
                </h3>
                <p className="text-xs text-slate-500">
                  Consultez le programme des samedis et réservez votre place dès maintenant.
                </p>
                <button
                  onClick={() => setActiveTab('programme')}
                  className="px-5 py-2.5 bg-[#0A2540] text-white font-bold text-xs rounded-xl shadow-md mt-2"
                >
                  Voir les formations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userRegistrations.map((reg) => {
                  const training = trainings.find((t) => t.id === reg.trainingId);
                  const isConfirmed = reg.statut === 'CONFIRMEE';
                  const isWaitlist = reg.statut === 'LISTE_ATTENTE';

                  return (
                    <div
                      key={reg.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            Réf: {reg.numeroReservation}
                          </span>
                          {isConfirmed ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              CONFIRMÉE
                            </span>
                          ) : isWaitlist ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Liste d'attente #{reg.positionAttente}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                              Annulée
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {training?.theme || 'Formation du Samedi'}
                        </h3>

                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>Samedi {training?.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              {training?.heureDebut} - {training?.heureFin}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>Centre Intermédiaire Ali Trad</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {isConfirmed && (
                          <button
                            onClick={() => {
                              setTargetTrainingForScan(training);
                              setIsScannerOpen(true);
                            }}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Scanner Présence
                          </button>
                        )}

                        {reg.statut !== 'ANNULEE' && (
                          <button
                            onClick={() => handleCancelBooking(reg.trainingId)}
                            disabled={bookingLoading}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 ml-auto"
                          >
                            Annuler ma réservation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MES PRÉSENCES */}
        {activeTab === 'presences' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Contrôle d'Assiduité par QR Code
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]">
                  Mes Présences & Pointages
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historique de vos scans d'arrivée et de fin de séance au Centre Ali Trad
                </p>
              </div>

              <button
                onClick={() => {
                  setTargetTrainingForScan(undefined);
                  setIsScannerOpen(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Ouvrir le Scanner QR
              </button>
            </div>

            {/* Attendance Cards */}
            {!currentUser ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <p className="text-xs text-slate-500">
                  Connectez-vous pour voir l'historique de vos pointages.
                </p>
              </div>
            ) : userRegistrations.filter((r) => r.statut === 'CONFIRMEE').length ===
              0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                Aucune formation confirmée pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {userRegistrations
                  .filter((r) => r.statut === 'CONFIRMEE')
                  .map((reg) => {
                    const training = trainings.find((t) => t.id === reg.trainingId);
                    const isFullyAttended =
                      reg.pointageArriveeValide && reg.pointageSortieValide;

                    return (
                      <div
                        key={reg.id}
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-amber-600">
                              Samedi {training?.date}
                            </span>
                            <h3 className="font-bold text-base text-slate-900">
                              {training?.theme}
                            </h3>
                          </div>

                          <div>
                            {isFullyAttended ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                ASSIDUITÉ COMPLÈTE
                              </span>
                            ) : reg.pointageArriveeValide ? (
                              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                                Arrivée Seule (Sortie en attente)
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                                En attente de pointage d'arrivée
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Scans timeline grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Arrivée */}
                          <div
                            className={`p-4 rounded-2xl border text-xs space-y-1 ${
                              reg.pointageArriveeValide
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>1. Scan d'Arrivée</span>
                              {reg.pointageArriveeValide ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="text-[11px]">
                              {reg.pointageArriveeValide
                                ? `Enregistré à ${reg.heureArrivee}`
                                : 'Non scanné'}
                            </div>
                          </div>

                          {/* Sortie */}
                          <div
                            className={`p-4 rounded-2xl border text-xs space-y-1 ${
                              reg.pointageSortieValide
                                ? 'bg-purple-50 border-purple-200 text-purple-950'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>2. Scan Fin de Séance</span>
                              {reg.pointageSortieValide ? (
                                <Check className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="text-[11px]">
                              {reg.pointageSortieValide
                                ? `Enregistré à ${reg.heureSortie}`
                                : 'Non scanné'}
                            </div>
                          </div>
                        </div>

                        {/* Action if fully attended */}
                        {isFullyAttended && reg.attestationId && (
                          <div className="flex items-center justify-between pt-2 text-xs">
                            <span className="text-emerald-700 font-semibold">
                              ✓ Votre attestation officielle est prête
                            </span>
                            <button
                              onClick={() => setActiveTab('attestations')}
                              className="px-3.5 py-1.5 bg-[#0A2540] text-white font-bold rounded-xl flex items-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              Voir l'attestation
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MES ATTESTATIONS */}
        {activeTab === 'attestations' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Développement Professionnel Continu
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]">
                Mes Attestations Officielles de Formation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Certificats délivrés après double scan d'assiduité au Centre Intermédiaire Ali Trad
              </p>
            </div>

            {!currentUser ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200">
                <p className="text-xs text-slate-500">
                  Connectez-vous pour consulter et imprimer vos attestations.
                </p>
              </div>
            ) : userCertificates.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <Award className="w-12 h-12 text-amber-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">
                  Aucune attestation délivrée pour le moment
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Pour obtenir votre attestation officielle, inscrivez-vous à une formation du samedi et validez vos deux scans (arrivée et fin de séance).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-[#FAF9F5] rounded-3xl border-2 border-amber-300/80 p-6 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#0A2540] bg-white px-2 py-0.5 rounded-md border border-amber-200">
                          {cert.numeroReference}
                        </span>
                        <span className="text-slate-500">
                          Délivrée le {new Date(cert.delivreeLe).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#0A2540] leading-snug">
                        {cert.themeFormation}
                      </h3>

                      <div className="text-xs text-slate-600 space-y-1 pt-1">
                        <div>Participant : <strong>{cert.prenom} {cert.nom}</strong> ({cert.matricule})</div>
                        <div>Date : <strong>{cert.dateFormation}</strong> • Volume horaire : <strong>{cert.dureeFormation}</strong></div>
                        <div>Formateur : <strong>{cert.formateur}</strong></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-amber-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Authentifiée GSB Tunis Sud
                      </span>

                      <button
                        onClick={() => setActiveCertificate(cert)}
                        className="px-4 py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Afficher / Imprimer A4
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ADMINISTRATION */}
        {activeTab === 'admin' && isResponsable && (
          <AdminDashboard
            trainings={trainings}
            onOpenProjector={(t) => setProjectorTraining(t)}
            onViewCertificate={(c) => setActiveCertificate(c)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0A2540] text-slate-400 text-xs py-6 border-t border-amber-500/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-slate-200">
              Centre Intermédiaire Ali Trad — Circonscription Sanitaire de Sijoumi
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Groupement de Santé de Base (GSB) de Tunis Sud • Ministère de la Santé
            </div>
          </div>
          <div className="text-[11px] text-amber-300/80">
            Plateforme Officielle de Formation Continue Paramédicale • Sessions du Samedi
          </div>
        </div>
      </footer>

      {/* ALL MODALS */}
      {/* 1. Training Details Modal */}
      <TrainingDetailModal
        training={selectedTrainingForDetail}
        registration={
          selectedTrainingForDetail
            ? getRegistrationForTraining(selectedTrainingForDetail.id)
            : undefined
        }
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onConfirmBooking={handleConfirmBooking}
        onCancelBooking={handleCancelBooking}
        bookingLoading={bookingLoading}
      />

      {/* 2. Congratulatory Confirmation Modal */}
      {confirmedReservationData && (
        <ReservationSuccessModal
          isOpen={!!confirmedReservationData}
          onClose={() => {
            setConfirmedReservationData(null);
            setActiveTab('reservations');
          }}
          training={confirmedReservationData.training}
          user={userProfile!}
          reservationNumber={confirmedReservationData.reservationNumber}
        />
      )}

      {/* 3. QR Camera Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        targetTraining={targetTrainingForScan}
        onSuccess={() => {
          // Handled inside
        }}
      />

      {/* 4. Fullscreen Meeting Room Projector View */}
      {projectorTraining && (
        <RoomProjectorModal
          training={projectorTraining}
          isOpen={!!projectorTraining}
          onClose={() => setProjectorTraining(null)}
        />
      )}

      {/* 5. Luxury A4 Landscape Certificate Template */}
      {activeCertificate && (
        <CertificateTemplate
          certificate={activeCertificate}
          isOpen={!!activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}

      {/* 6. Profile Completion Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen || (!!currentUser && needsProfileCompletion)}
        onClose={() => setIsProfileModalOpen(false)}
        isMandatory={!!currentUser && needsProfileCompletion}
      />

      {/* 7. Public Sharing Modal (Direct Link, QR Code, WhatsApp) */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* 8. Detailed Session Attendance Modal (Enrolled, Joined, Not Joined) */}
      <SessionAttendanceModal
        training={attendanceTargetTraining}
        isOpen={!!attendanceTargetTraining}
        onClose={() => setAttendanceTargetTraining(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
