import React, { useState, useEffect, useId } from 'react';
import QRCode from 'qrcode';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Share2,
  Printer,
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Info,
} from 'lucide-react';
import { TrainingSession, Registration } from '../types';
import {
  bookPublicTrainingAtomic,
  normalizePhoneNumber,
  PublicRegistrationResult,
} from '../services/trainingService';
import { InstitutionalBanner } from './InstitutionalBanner';
import { getCourseTheme } from '../data/courseThemes';
import { ThemeEmblem } from './ThemeEmblems';

interface Props {
  training: TrainingSession;
  allTrainings?: TrainingSession[];
  onSelectTraining?: (trainingId: string) => void;
  onNavigateHome?: () => void;
}

const COMMON_HEALTH_CENTERS = [
  'Centre Intermédiaire Ali Trad (Sijoumi)',
  'CSB Mellassine 1',
  'CSB Mellassine 2',
  'CSB Cité Ezzouhour',
  'CSB Birine',
  'CSB Sidi Hassine',
  'CSB Cité Ennour',
  'CSB Borj Chakir',
  'CSB Jayara',
  'Hôpital La Rabta',
  'Hôpital Charles Nicolle',
  'Hôpital Habib Thameur',
  'Hôpital d’Enfants Béchir Hamza',
  'Direction Régionale de la Santé de Tunis',
];

const COMMON_CIRCONSCRIPTIONS = [
  'Circonscription Sanitaire de Sijoumi',
  'Circonscription Sanitaire de Tunis Ouest',
  'Circonscription Sanitaire de Tunis Sud',
  'Circonscription Sanitaire de La Medina',
  'Circonscription Sanitaire du Bardo',
  'Circonscription Sanitaire d’El Omrane',
];

const COMMON_PROFESSIONS = [
  'Infirmier(e) Principal(e)',
  'Infirmier(e) Major',
  'Infirmier(e) de Santé Publique',
  'Sage-femme',
  'Technicien(ne) Supérieur(e) de Santé',
  'Technicien(ne) Supérieur(e) d’Anesthésie-Réanimation',
  'Aide-Soignant(e)',
  'Cadre de Santé / Surveillant(e)',
  'Médecin Généraliste',
];

export const PublicRegistrationPage: React.FC<Props> = ({
  training,
  allTrainings = [],
  onSelectTraining,
  onNavigateHome,
}) => {
  // Form fields
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [profession, setProfession] = useState('');
  const [etablissement, setEtablissement] = useState(COMMON_HEALTH_CENTERS[0]);
  const [customEtablissement, setCustomEtablissement] = useState('');
  const [circonscription, setCirconscription] = useState(COMMON_CIRCONSCRIPTIONS[0]);
  const [telephone, setTelephone] = useState('');

  // Submission & Confirmation state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<PublicRegistrationResult | null>(null);
  const [ticketQrUrl, setTicketQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const themeInfo = getCourseTheme(training.numeroSeance, training.theme);

  // Compute live capacity & status
  const capaciteNormale = Number(training.capaciteNormale) || 32;
  const capaciteMaxAutorisee = Number(training.capaciteMaxAutorisee) || 35;
  const autoriserPlacesSupp = Boolean(training.autoriserPlacesSupp);
  const effectiveCap = autoriserPlacesSupp ? capaciteMaxAutorisee : capaciteNormale;

  const placesReservees = Number(training.placesReservees) || 0;
  const placesRestantes = Math.max(0, effectiveCap - placesReservees);
  const isFull = placesRestantes <= 0;
  const isClosed = Boolean(training.inscriptionsFermees);

  // Generate QR code whenever registration succeeds
  useEffect(() => {
    if (successResult?.registration) {
      const reg = successResult.registration;
      const qrPayload = JSON.stringify({
        ref: reg.numeroReservation,
        tId: reg.trainingId,
        nom: `${reg.prenom} ${reg.nom}`,
        tel: reg.telephone,
        statut: reg.statut,
        lieu: 'Ali Trad - Sijoumi',
      });

      QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 1,
        color: {
          dark: '#0A2540',
          light: '#FFFFFF',
        },
      })
        .then((url) => setTicketQrUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [successResult]);

  // Clean phone handler
  const handlePhoneChange = (val: string) => {
    // Keep numbers and spacing
    const cleaned = val.replace(/[^\d+ ]/g, '');
    setTelephone(cleaned);
  };

  // Submit Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNom = nom.trim();
    const cleanPrenom = prenom.trim();
    const cleanProf = profession.trim();
    const finalEtab =
      etablissement === 'AUTRE' ? customEtablissement.trim() : etablissement.trim();
    const cleanCirco = circonscription.trim();
    const cleanPhone = normalizePhoneNumber(telephone);

    if (!cleanNom) {
      setErrorMessage('Veuillez saisir votre nom.');
      return;
    }
    if (!cleanPrenom) {
      setErrorMessage('Veuillez saisir votre prénom.');
      return;
    }
    if (!cleanProf) {
      setErrorMessage('Veuillez indiquer votre profession ou fonction.');
      return;
    }
    if (!finalEtab) {
      setErrorMessage('Veuillez sélectionner ou préciser votre établissement de santé.');
      return;
    }
    if (!cleanCirco) {
      setErrorMessage('Veuillez indiquer votre circonscription sanitaire.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage(
        'Le numéro de téléphone est incomplet. Veuillez saisir au moins 8 chiffres (ex: 98 123 456).'
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await bookPublicTrainingAtomic({
        trainingId: training.id,
        nom: cleanNom,
        prenom: cleanPrenom,
        profession: cleanProf,
        etablissement: finalEtab,
        circonscription: cleanCirco,
        telephone: telephone.trim(),
      });

      setSuccessResult(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Une erreur est survenue lors de l'enregistrement de votre inscription."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Social sharing helpers
  const shareUrl = `${window.location.origin}/?inscription=${training.id}`;

  const shareText = `Formation Continue Paramédicale – Centre Intermédiaire Ali Trad | GSB Tunis Sud
Date : ${training.date === '2026-11-07' ? 'Samedi 7 novembre 2026' : `Samedi ${training.date}`} de ${training.heureDebut} à ${training.heureFin}
Thème : ${training.theme}
Formatrice : ${training.formateur || 'Mme Hamdani Inès'}
Lieu : ${training.lieu || 'Salle de réunion du Centre Intermédiaire Ali Trad'}
Inscriptions ouvertes (places limitées à ${capaciteNormale} participants) :
👉 Lien d'inscription : ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Format date display
  const formattedDate =
    training.date === '2026-11-07'
      ? 'Samedi 7 novembre 2026'
      : `Samedi ${training.date}`;

  return (
    <div className="min-h-screen bg-[#08182B] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Health Authority Banner */}
      <InstitutionalBanner />

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Navigation Bar / Return to Portal */}
        <div className="flex items-center justify-between gap-3 text-xs">
          {onNavigateHome ? (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portail FMC Ali Trad</span>
            </button>
          ) : (
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accueil Formations</span>
            </a>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-all"
              title="Copier le lien public d'inscription"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Lien copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
              title="Partager sur WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* ===================== VIEW 1: SUCCESS CONFIRMATION ===================== */}
        {successResult ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Status Header Alert */}
            <div
              className={`p-5 sm:p-6 rounded-3xl border text-center space-y-2 shadow-xl ${
                successResult.status === 'CONFIRMEE'
                  ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#0A2540] border-emerald-500/60 text-white'
                  : 'bg-gradient-to-r from-amber-950 via-amber-900 to-[#0A2540] border-amber-500/60 text-white'
              }`}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md mx-auto mb-2 shadow-inner">
                {successResult.status === 'CONFIRMEE' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-amber-300" />
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
                {successResult.status === 'CONFIRMEE'
                  ? 'Inscription Confirmée avec Succès !'
                  : "Inscription Enregistrée sur Liste d'Attente"}
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
                {successResult.status === 'CONFIRMEE' ? (
                  <>
                    Félicitations <strong>{successResult.registration.prenom} {successResult.registration.nom}</strong> ! Votre place est réservée pour la séance du <strong>{formattedDate}</strong> au Centre Intermédiaire Ali Trad.
                  </>
                ) : (
                  <>
                    La capacité normale de {capaciteNormale} participants a été atteinte. Vous êtes en <strong>position #{successResult.waitlistPosition}</strong> sur la liste d'attente. En cas de désistement ou d'ouverture des 3 places complémentaires, vous serez automatiquement admis(e).
                  </>
                )}
              </p>
            </div>

            {/* Official Printable Ticket Pass */}
            <div
              id="printable-ticket"
              className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-6 relative overflow-hidden"
            >
              {/* Luxury Gold Accents */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-extrabold text-amber-700 tracking-wider uppercase">
                    RÉPUBLIQUE TUNISIENNE • MINISTÈRE DE LA SANTÉ
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    Groupement de Santé de Base (GSB) de Tunis Sud • Circonscription de Sijoumi
                  </div>
                  <div className="text-sm font-extrabold text-[#0A2540]">
                    Centre Intermédiaire Ali Trad — Formation Continue Paramédicale
                  </div>
                </div>

                <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Référence Réservation
                  </div>
                  <div className="font-mono text-base sm:text-lg font-black text-[#0A2540]">
                    {successResult.reservationNumber}
                  </div>
                  <div
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                      successResult.status === 'CONFIRMEE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {successResult.status === 'CONFIRMEE' ? 'Place Confirmée' : "Liste d'Attente"}
                  </div>
                </div>
              </div>

              {/* Main Ticket Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-4">
                  {/* Theme pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                    <ThemeEmblem
                      type={themeInfo.emblemType || 'ambulance_samu'}
                      size={16}
                      color="#B45309"
                    />
                    <span>Thème : {themeInfo.emblemLabel}</span>
                  </div>

                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-[#0A2540] leading-snug">
                      {training.theme}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {training.description}
                    </p>
                  </div>

                  {/* Logistics Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Date de session</div>
                        <div className="font-bold text-slate-900">{formattedDate}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Horaire précis</div>
                        <div className="font-bold text-slate-900">
                          {training.heureDebut} à {training.heureFin} ({training.dureeHeures})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <User className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Formatrice</div>
                        <div className="font-bold text-slate-900">
                          {training.formateur || 'Mme Hamdani Inès'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Lieu de formation</div>
                        <div className="font-bold text-slate-900">
                          {training.lieu || 'Salle de réunion du Centre Ali Trad'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Participant Identity */}
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <div className="font-bold text-amber-950 flex items-center justify-between">
                      <span>Titulaire de l'inscription :</span>
                      <span className="font-mono text-[11px] text-amber-800">
                        {successResult.registration.telephone}
                      </span>
                    </div>
                    <div className="text-slate-800 font-bold text-sm">
                      {successResult.registration.prenom} {successResult.registration.nom}
                    </div>
                    <div className="text-slate-600">
                      {successResult.registration.fonction} • {successResult.registration.etablissement}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {successResult.registration.circonscription}
                    </div>
                  </div>
                </div>

                {/* QR Code Pass Box */}
                <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-amber-300 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="text-xs font-black uppercase text-[#0A2540] tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>Pass QR Personnel</span>
                  </div>

                  {ticketQrUrl ? (
                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                      <img
                        src={ticketQrUrl}
                        alt="QR Code Inscription"
                        className="w-40 h-40 object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-slate-200 rounded-2xl flex items-center justify-center animate-pulse">
                      <QrCode className="w-10 h-10 text-slate-400" />
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 leading-tight">
                    Présentez ce QR Code à l'accueil du Centre Ali Trad pour le pointage d'arrivée.
                  </div>
                </div>
              </div>

              {/* Instructions footer */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Consignes importantes de présence et de pointage :</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                  <li>
                    <strong>Ponctualité :</strong> La séance débute à <strong>12h30 précises</strong>. Merci de vous présenter 10 minutes à l'avance.
                  </li>
                  <li>
                    <strong>Double Pointage :</strong> Le scan à l'arrivée (12h30) et le scan à la sortie (13h30) sont obligatoires pour la délivrance de l'attestation officielle.
                  </li>
                  <li>
                    <strong>Attestation A4 :</strong> L'attestation certifiée par la Circonscription de Sijoumi sera délivrée immédiatement après validation de l'assiduité.
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimer / Télécharger le Pass</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager ma confirmation sur WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  setSuccessResult(null);
                  setNom('');
                  setPrenom('');
                  setTelephone('');
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-2xl border border-white/20 transition-all"
              >
                Inscrire un autre collègue
              </button>
            </div>
          </div>
        ) : (
          /* ===================== VIEW 2: REGISTRATION FORM ===================== */
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0E2E54] to-[#164273] text-white p-6 sm:p-8 shadow-xl border-2 border-amber-400/40">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider border border-amber-400/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Inscription Publique Ouverte • Sans Compte
                  </span>

                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold border border-white/20">
                    Séance #{training.numeroSeance || 3}
                  </span>
                </div>

                {/* Subject Theme Emblem Banner */}
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: themeInfo.badgeBg,
                    color: themeInfo.primaryColor,
                    border: `1px solid ${themeInfo.borderColor}60`,
                  }}
                >
                  <ThemeEmblem
                    type={themeInfo.emblemType || 'ambulance_samu'}
                    size={18}
                    color={themeInfo.primaryColor}
                  />
                  <span>
                    Thème : {themeInfo.emblemLabel} • {themeInfo.themeTagline}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {training.theme}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {training.description || themeInfo.themePresentation}
                </p>

                {/* Key Training Facts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="bg-white/10 p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-300">Date officielle</div>
                      <div className="font-bold text-white">{formattedDate}</div>
                    </div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-300">Horaire</div>
                      <div className="font-bold text-white">
                        {training.heureDebut} à {training.heureFin} (60 min)
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-300">Formatrice</div>
                      <div className="font-bold text-white">
                        {training.formateur || 'Mme Hamdani Inès'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-300">Lieu</div>
                      <div className="font-bold text-white">Salle réunion Ali Trad</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Seat Status Indicator */}
            <div className="bg-[#0E2E54] rounded-2xl p-4 sm:p-5 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isClosed
                        ? 'bg-rose-500'
                        : isFull
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  <span>État des Places en Temps Réel</span>
                </div>

                <div className="text-sm font-extrabold text-white">
                  {isClosed ? (
                    <span className="text-rose-400">Inscriptions Clôturées par l'Administration</span>
                  ) : isFull ? (
                    <span className="text-amber-300">
                      Session Complète ({effectiveCap}/{effectiveCap} places) — Inscription ouverte sur Liste d'Attente
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      {placesRestantes} place{placesRestantes > 1 ? 's' : ''} disponible{placesRestantes > 1 ? 's' : ''} sur {effectiveCap}
                      {autoriserPlacesSupp ? ' (Option 3 places supp. active)' : ''}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-300">
                  {training.placesReservees || 0} confirmées • {training.nbListeAttente || 0} sur liste d'attente
                </div>
              </div>

              {/* Progress gauge */}
              <div className="w-full sm:w-48 space-y-1">
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isFull ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((placesReservees) / effectiveCap) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-right text-[10px] font-bold text-slate-300">
                  {Math.round(((placesReservees) / effectiveCap) * 100)}% de capacité
                </div>
              </div>
            </div>

            {/* The Registration Form Card */}
            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="text-xs font-black uppercase text-amber-700 tracking-wider">
                  Formulaire Officiel d'Inscription
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0A2540]">
                  Confirmez votre participation en 30 secondes
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Les champs ci-dessous sont obligatoires pour générer votre pass de présence et votre attestation nominative officielle.
                </p>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-semibold leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Nom et Prénom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Nom de famille <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Ben Salem"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Mohamed"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Profession / Fonction */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Profession / Fonction paramédicale <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      list="professions-list"
                      placeholder="Ex: Infirmier(e) Principal(e), Sage-femme..."
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] font-medium"
                    />
                    <datalist id="professions-list">
                      {COMMON_PROFESSIONS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                  {/* Quick pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_PROFESSIONS.slice(0, 4).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setProfession(p)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                          profession === p
                            ? 'bg-[#0A2540] text-amber-300 border-[#0A2540]'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Établissement de Santé */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Établissement de santé d'exercice <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={etablissement}
                      onChange={(e) => setEtablissement(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] font-medium bg-white"
                    >
                      {COMMON_HEALTH_CENTERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="AUTRE">Autre établissement (à préciser)...</option>
                    </select>
                  </div>

                  {etablissement === 'AUTRE' && (
                    <input
                      type="text"
                      required
                      placeholder="Précisez le nom de votre établissement de santé..."
                      value={customEtablissement}
                      onChange={(e) => setCustomEtablissement(e.target.value)}
                      className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
                    />
                  )}
                </div>

                {/* 4. Circonscription Sanitaire */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Circonscription sanitaire <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={circonscription}
                    onChange={(e) => setCirconscription(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] font-medium bg-white"
                  >
                    {COMMON_CIRCONSCRIPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Numéro de Téléphone */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Numéro de téléphone mobile <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Sert d'identifiant unique anti-doublon
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 98 123 456 ou 22 345 678"
                      value={telephone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] font-mono font-bold tracking-wide"
                    />
                  </div>
                </div>

                {/* Reassurance pill */}
                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Inscription officielle sécurisée :</strong> Aucun compte ni mot de passe exigé. Votre inscription est enregistrée directement dans le registre de présence de la formation.
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting || isClosed}
                  className={`w-full py-4 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                    isClosed
                      ? 'bg-slate-400 cursor-not-allowed'
                      : isFull
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'
                      : 'bg-gradient-to-r from-[#0A2540] to-[#164273] hover:from-[#0F2F57] hover:to-[#1C528D]'
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validation atomique en cours...</span>
                    </div>
                  ) : isClosed ? (
                    <span>Inscriptions Fermées</span>
                  ) : isFull ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-200" />
                      <span>S'INSCRIRE SUR LISTE D'ATTENTE</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>CONFIRMER MON INSCRIPTION</span>
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Social Share Bar */}
            <div className="bg-[#0E2E54] rounded-2xl p-5 border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-extrabold text-white">
                  Partager cette session avec vos collègues soignants
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5">
                  Diffusez le lien d'inscription sur vos groupes WhatsApp et réseaux sociaux
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleShareFacebook}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Copier le lien</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#05101E] text-slate-400 text-xs py-6 border-t border-amber-500/20 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-1">
          <div className="font-bold text-slate-200">
            Centre Intermédiaire Ali Trad — Circonscription Sanitaire de Sijoumi
          </div>
          <div className="text-[11px] text-slate-400">
            Groupement de Santé de Base (GSB) de Tunis Sud • Ministère de la Santé
          </div>
          <div className="text-[10px] text-amber-300/80 pt-1">
            Module officiel d'inscription publique sans authentification
          </div>
        </div>
      </footer>
    </div>
  );
};
