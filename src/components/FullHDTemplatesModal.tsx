import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Printer,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Download,
  Palette,
  HeartPulse,
  Activity,
  FileText,
  Radio,
  BookOpen,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { TrainingSession } from '../types';

// Full HD Assets generated
import emergencyKitImg from '../assets/images/medical_emergency_kit_1793631441496.jpg';
import cardiologyEcgImg from '../assets/images/medical_cardiology_ecg_1793631442961.jpg';
import woundCareImg from '../assets/images/medical_wound_care_sterile_1793631442525.jpg';

export type TemplateStyle = 'affiche_officielle' | 'slide_conference' | 'fiche_memo' | 'banniere_annonce';
export type ColorTheme = 'marine_or' | 'saphir_clinique' | 'emeraude_sante' | 'ardoise_sombre';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trainings: TrainingSession[];
  initialTrainingId?: string;
}

export const FullHDTemplatesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trainings,
  initialTrainingId,
}) => {
  // Filter and sort remaining trainings
  const sortedTrainings = [...trainings].sort((a, b) => {
    return (a.numeroSeance || 0) - (b.numeroSeance || 0) || a.date.localeCompare(b.date);
  });

  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(
    initialTrainingId || sortedTrainings[0]?.id || ''
  );
  const [activeTemplate, setActiveTemplate] = useState<TemplateStyle>('affiche_officielle');
  const [activeTheme, setActiveTheme] = useState<ColorTheme>('marine_or');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  const currentTraining =
    sortedTrainings.find((t) => t.id === selectedTrainingId) || sortedTrainings[0];

  const currentIndex = sortedTrainings.findIndex((t) => t.id === currentTraining?.id);

  // Sync initial training when prop changes
  useEffect(() => {
    if (initialTrainingId && trainings.some((t) => t.id === initialTrainingId)) {
      setSelectedTrainingId(initialTrainingId);
    }
  }, [initialTrainingId, trainings]);

  // Generate dynamic QR Code for the active training
  useEffect(() => {
    if (!currentTraining) return;
    const shareUrl = `${window.location.origin}/?session=${currentTraining.id}#training-${currentTraining.id}`;
    QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: activeTheme === 'ardoise_sombre' ? '#FAF9F5' : '#0A2540',
        light: activeTheme === 'ardoise_sombre' ? '#1E293B' : '#FFFFFF',
      },
    })
      .then(setQrCodeUrl)
      .catch(console.error);
  }, [currentTraining, activeTheme]);

  if (!isOpen || !currentTraining) return null;

  // Next / Previous training handlers
  const handlePrevTraining = () => {
    if (currentIndex > 0) {
      setSelectedTrainingId(sortedTrainings[currentIndex - 1].id);
    }
  };

  const handleNextTraining = () => {
    if (currentIndex < sortedTrainings.length - 1) {
      setSelectedTrainingId(sortedTrainings[currentIndex + 1].id);
    }
  };

  // Toggle native full screen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Print template in A4 Landscape / HD with iframe isolation and fallback
  const handlePrint = () => {
    const el = document.getElementById('hd-template-canvas');
    if (!el) {
      window.print();
      return;
    }

    try {
      const oldFrame = document.getElementById('template-print-frame');
      if (oldFrame) oldFrame.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'template-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.visibility = 'hidden';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((s) => s.outerHTML)
        .join('\n');

      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.maxWidth = 'none';
      clone.style.width = '297mm';
      clone.style.height = '210mm';
      clone.style.margin = '0 auto';

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <title>Affiche_${currentTraining.theme.slice(0, 30)}</title>
            ${styleTags}
            <style>
              @page { size: A4 landscape; margin: 0; }
              *, *:before, *:after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              html, body { width: 297mm !important; height: 210mm !important; margin: 0 !important; padding: 0 !important; }
              .wrap { width: 297mm !important; height: 210mm !important; display: flex; align-items: center; justify-content: center; }
            </style>
          </head>
          <body>
            <div class="wrap">${clone.outerHTML}</div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => printIframe.remove(), 3000);
        }
      }, 600);
    } catch {
      window.print();
    }
  };

  // Copy textual synopsis
  const handleCopyText = () => {
    const text = `RÉPUBLIQUE TUNISIENNE — MINISTÈRE DE LA SANTÉ
Direction Régionale de Tunis • Groupement de Santé de Base de Tunis Sud
Circonscription Sanitaire de Sijoumi — Centre Intermédiaire Ali Trad

FORMATION CONTINUE PARAMÉDICALE (FMC)
Séance #${currentTraining.numeroSeance || '1'} — ${currentTraining.domaine || 'PARAMÉDICAL'}
Thème : ${currentTraining.theme}
Date : ${currentTraining.date} (Samedi de ${currentTraining.heureDebut} à ${currentTraining.heureFin})
Lieu : ${currentTraining.lieu}
Formateur(s) : ${currentTraining.formateur || 'Équipe Pédagogique'}
Capacité : ${currentTraining.capaciteMax || 32} places
Objectifs :
${(currentTraining.objectifs || []).map((o) => `• ${o}`).join('\n')}

Lien d'inscription : ${window.location.origin}/?session=${currentTraining.id}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Select suitable background image according to domain
  const getDomainBgImage = () => {
    const domain = (currentTraining.domaine || '').toUpperCase();
    const theme = (currentTraining.theme || '').toLowerCase();

    if (domain.includes('URGENCE') || theme.includes('trousse') || theme.includes('choc')) {
      return emergencyKitImg;
    }
    if (domain.includes('PRATIQUE') || theme.includes('ecg') || theme.includes('arrêt') || theme.includes('dae')) {
      return cardiologyEcgImg;
    }
    if (domain.includes('SOIN') || theme.includes('pansement') || domain.includes('SÉCURITÉ') || theme.includes('aes')) {
      return woundCareImg;
    }
    // High-tech cardiology monitor by default for clinical excellence
    return cardiologyEcgImg;
  };

  const domainBg = getDomainBgImage();

  // Helper date formatter
  const formatDateFull = (dateStr: string) => {
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

  // Trainers formatted
  const trainersList =
    currentTraining.formateurs && currentTraining.formateurs.length > 0
      ? currentTraining.formateurs
      : currentTraining.formateur && currentTraining.formateur.trim()
      ? [{ nom: currentTraining.formateur, qualite: currentTraining.qualiteFormateur || '' }]
      : [];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md overflow-hidden text-slate-100 select-none print:p-0 print:bg-white print:static"
    >
      {/* Top Controls Toolbar (Hidden during print) */}
      <div className="bg-[#0A2540] border-b border-amber-500/30 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden shadow-lg z-20">
        {/* Left: Title & Session navigation */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Studio Modèles Full HD (1080p)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                16:9 Cinématographique
              </span>
            </div>
            <div className="text-xs text-slate-300 font-medium truncate max-w-md">
              Séance #{currentTraining.numeroSeance || '1'} : {currentTraining.theme}
            </div>
          </div>
        </div>

        {/* Center: Training Session Quick Picker */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={handlePrevTraining}
            disabled={currentIndex <= 0}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
            title="Formation précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedTrainingId}
            onChange={(e) => setSelectedTrainingId(e.target.value)}
            className="bg-transparent text-xs font-bold text-amber-300 focus:outline-hidden px-2 py-1 cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
          >
            {sortedTrainings.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                S#{t.numeroSeance || '?'} • {t.date} — {t.theme}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextTraining}
            disabled={currentIndex >= sortedTrainings.length - 1}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
            title="Formation suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Palette Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            <button
              onClick={() => setActiveTheme('marine_or')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                activeTheme === 'marine_or'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Marine & Or
            </button>
            <button
              onClick={() => setActiveTheme('saphir_clinique')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                activeTheme === 'saphir_clinique'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Saphir HD
            </button>
            <button
              onClick={() => setActiveTheme('emeraude_sante')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                activeTheme === 'emeraude_sante'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Émeraude
            </button>
            <button
              onClick={() => setActiveTheme('ardoise_sombre')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                activeTheme === 'ardoise_sombre'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Studio Dark
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-white/10"
            title="Copier le synopsis officiel"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copié !' : 'Copier'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
            title="Imprimer ou Exporter en PDF (A4 Paysage)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimer / PDF</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-white/10"
            title={isFullscreen ? 'Quitter plein écran' : 'Mode Plein Écran (1080p)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Model Choice Segmented Bar (Hidden during print) */}
      <div className="bg-slate-900/90 border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTemplate('affiche_officielle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTemplate === 'affiche_officielle'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Modèle 1 : Affiche Officielle HD</span>
          </button>

          <button
            onClick={() => setActiveTemplate('slide_conference')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTemplate === 'slide_conference'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Modèle 2 : Slide Conférence (16:9)</span>
          </button>

          <button
            onClick={() => setActiveTemplate('fiche_memo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTemplate === 'fiche_memo'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Modèle 3 : Fiche Protocole & Mémo</span>
          </button>

          <button
            onClick={() => setActiveTemplate('banniere_annonce')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTemplate === 'banniere_annonce'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Modèle 4 : Convocation & Accueil HD</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden lg:block">
          Résolution optimale : 1920 × 1080 Full HD (16:9)
        </div>
      </div>

      {/* Main Full HD Canvas Viewport */}
      <div className="flex-1 overflow-auto p-2 sm:p-6 flex items-center justify-center bg-slate-950 print:p-0 print:bg-white">
        {/* Aspect Ratio 16:9 Container (1920x1080 scaled) */}
        <div
          id="printable-hd-model"
          className="w-full max-w-[1240px] aspect-[16/9] relative rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between border-2 border-white/10 print:w-[297mm] print:h-[210mm] print:aspect-auto print:rounded-none print:border-none print:shadow-none"
          style={{
            backgroundColor: activeTheme === 'ardoise_sombre' ? '#0F172A' : '#0A2540',
          }}
        >
          {/* ========================================================================= */}
          {/* MODÈLE 1 : AFFICHE OFFICIELLE HAUTE DÉFINITION                           */}
          {/* ========================================================================= */}
          {activeTemplate === 'affiche_officielle' && (
            <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 text-white overflow-hidden">
              {/* Background Full HD Image with subtle gradient overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-20 filter saturate-150"
                style={{ backgroundImage: `url(${domainBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A2540] via-[#0A2540]/90 to-[#0A2540]/60 pointer-events-none" />

              {/* Decorative gold borders */}
              <div className="absolute inset-3 border border-amber-400/40 rounded-xl pointer-events-none" />

              {/* Institutional Header */}
              <div className="relative z-10 flex items-start justify-between gap-4 border-b border-amber-400/30 pb-4">
                <div className="space-y-1">
                  <div className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-amber-300">
                    RÉPUBLIQUE TUNISIENNE — MINISTÈRE DE LA SANTÉ
                  </div>
                  <div className="text-[10px] sm:text-xs tracking-wider text-slate-300 font-medium">
                    Direction Régionale de la Santé de Tunis • GSB Tunis Sud
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                    Circonscription Sanitaire de Sijoumi — Centre Intermédiaire Ali Trad
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md">
                    Séance #{currentTraining.numeroSeance || '1'}
                  </div>
                  <div className="text-[11px] text-amber-200/90 font-bold mt-1 uppercase tracking-wider">
                    {currentTraining.domaine || 'FORMATION MÉDICALE CONTINUE'}
                  </div>
                </div>
              </div>

              {/* Main Body Theme & Typography */}
              <div className="relative z-10 my-auto py-4 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-xs text-xs font-semibold text-amber-300 border border-white/10">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cycle Officiel de Développement Professionnel Continu Paramédical</span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight font-serif tracking-tight drop-shadow-md">
                  « {currentTraining.theme} »
                </h1>

                <p className="text-xs sm:text-base text-slate-200 leading-relaxed max-w-3xl line-clamp-3">
                  {currentTraining.description}
                </p>

                {/* Pedagogical Objectives Strip */}
                {currentTraining.objectifs && currentTraining.objectifs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {currentTraining.objectifs.slice(0, 3).map((obj, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs text-slate-200 flex items-start gap-2"
                      >
                        <span className="font-bold text-amber-400 text-sm">0{idx + 1}.</span>
                        <span className="line-clamp-2 leading-snug">{obj}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Metadata & QR Inscription Strip */}
              <div className="relative z-10 pt-4 border-t border-amber-400/30 flex items-end justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-[10px] text-amber-300 font-bold uppercase">Date de formation</div>
                    <div className="font-extrabold text-white capitalize">{formatDateFull(currentTraining.date)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-300 font-bold uppercase">Horaire & Durée</div>
                    <div className="font-extrabold text-white">
                      {currentTraining.heureDebut} à {currentTraining.heureFin} ({currentTraining.dureeHeures || '60 min'})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-300 font-bold uppercase">Formateur(s)</div>
                    <div className="font-extrabold text-white">
                      {trainersList.length > 0
                        ? trainersList.map((t) => t.nom).join(', ')
                        : 'À confirmer'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-300 font-bold uppercase">Places & Lieu</div>
                    <div className="font-extrabold text-white">
                      {currentTraining.capaciteMax || 32} Places max • Salle Ali Trad
                    </div>
                  </div>
                </div>

                {/* QR Code Block */}
                {qrCodeUrl && (
                  <div className="flex items-center gap-3 shrink-0 bg-white p-2 rounded-xl shadow-lg">
                    <img src={qrCodeUrl} alt="QR Inscription" className="w-14 h-14" />
                    <div className="text-slate-900 text-[10px] leading-tight font-bold hidden sm:block">
                      <div>Scannez pour</div>
                      <div className="text-blue-800">S'inscrire</div>
                      <div className="text-[9px] text-slate-500 font-mono">Ali Trad FMC</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODÈLE 2 : SLIDE CONFÉRENCE MASTERCLASS (16:9 WIDESCREEN)                */}
          {/* ========================================================================= */}
          {activeTemplate === 'slide_conference' && (
            <div className="relative w-full h-full flex flex-col justify-between p-8 sm:p-12 text-white bg-radial from-slate-900 to-[#0A2540]">
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-15 filter grayscale"
                style={{ backgroundImage: `url(${domainBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

              {/* Slide Top Banner */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-400/30">
                    S#{currentTraining.numeroSeance || '1'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                      Centre Intermédiaire Ali Trad • FMC 2026
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Circonscription Sanitaire de Sijoumi
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
                  {currentTraining.domaine || 'URGENCES & SOINS'}
                </div>
              </div>

              {/* Main Slide Title */}
              <div className="relative z-10 my-auto py-6 space-y-4">
                <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                  Présentation Pédagogique & Cas Pratiques
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight font-serif tracking-tight">
                  {currentTraining.theme}
                </h1>

                {/* Formateur Badge */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md">
                    F
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white">
                      {trainersList.length > 0
                        ? trainersList.map((t) => t.nom).join(' & ')
                        : 'Équipe Pédagogique Ali Trad'}
                    </div>
                    <div className="text-xs text-amber-300 font-medium">
                      {trainersList.length > 0 && trainersList[0].qualite
                        ? trainersList.map((t) => t.qualite).filter(Boolean).join(' • ')
                        : 'Formateur & Encadrement Médical'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide Footer */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    {formatDateFull(currentTraining.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {currentTraining.heureDebut} - {currentTraining.heureFin} (60 min)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    Salle de Réunion Ali Trad
                  </span>
                </div>

                <div className="text-right text-slate-400 text-[11px] font-mono">
                  Émargement Présences Obligatoire
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODÈLE 3 : FICHE PROTOCOLE & MÉMO CLINIQUE                               */}
          {/* ========================================================================= */}
          {activeTemplate === 'fiche_memo' && (
            <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-8 bg-[#FAF9F5] text-slate-800 font-sans border-4 border-amber-600/30">
              {/* Header */}
              <div className="border-b-2 border-slate-300 pb-3 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                    GSB Tunis Sud • Circonscription Sijoumi • Centre Ali Trad
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-[#0A2540] tracking-tight">
                    Fiche Réflexe Clinique #{currentTraining.numeroSeance || '1'} : {currentTraining.theme}
                  </h2>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-3 py-1 rounded-md bg-[#0A2540] text-amber-300 text-xs font-bold uppercase">
                    {currentTraining.domaine || 'PROTOCOLE'}
                  </span>
                </div>
              </div>

              {/* 3 Practical Columns */}
              <div className="my-auto py-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Col 1 : Contexte & Objectifs */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="font-extrabold text-[#0A2540] uppercase tracking-wide flex items-center gap-1.5 border-b pb-1">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    1. Objectifs de Prise en Charge
                  </div>
                  <ul className="space-y-1.5 text-slate-600 leading-snug">
                    {(currentTraining.objectifs || [
                      'Évaluation clinique immédiate des paramètres vitaux',
                      'Application rigoureuse des protocoles d’urgence et d’asepsie',
                      'Traçabilité dans le dossier de soins et alerte médicale',
                    ]).map((obj, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Col 2 : Conduite à tenir pratique */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="font-extrabold text-[#0A2540] uppercase tracking-wide flex items-center gap-1.5 border-b pb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    2. Points Clés & Sécurité
                  </div>
                  <div className="text-slate-600 space-y-1.5 leading-snug">
                    <p>• <strong>Vérification préalable :</strong> Matériels stériles et solutés prêts à l'emploi.</p>
                    <p>• <strong>Rôle propre infirmier :</strong> Constantes, surveillance continue, alerte précoce.</p>
                    <p>• <strong>Communication :</strong> Transmission claire et horodatée au médecin traitant.</p>
                  </div>
                </div>

                {/* Col 3 : Matériel & Déroulement */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="font-extrabold text-[#0A2540] uppercase tracking-wide flex items-center gap-1.5 border-b pb-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    3. Organisation de la Séance
                  </div>
                  <div className="text-slate-600 space-y-1.5 leading-snug">
                    <p>• <strong>Date :</strong> {formatDateFull(currentTraining.date)}</p>
                    <p>• <strong>Horaire :</strong> {currentTraining.heureDebut} à {currentTraining.heureFin} (60 min)</p>
                    <p>• <strong>Formateur :</strong> {currentTraining.formateur || 'Équipe Pédagogique'}</p>
                    <p>• <strong>Lieu :</strong> Salle de réunion Ali Trad</p>
                  </div>
                </div>
              </div>

              {/* Bottom Stamp & Signature */}
              <div className="border-t-2 border-slate-300 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <div>Fiche Pédagogique — Commission Formation Continue Circonscription de Sijoumi</div>
                <div className="font-bold text-[#0A2540]">Validation : Centre Intermédiaire Ali Trad</div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODÈLE 4 : BANNIÈRE CONVOCATION & ACCUEIL HD                             */}
          {/* ========================================================================= */}
          {activeTemplate === 'banniere_annonce' && (
            <div className="relative w-full h-full flex items-center justify-between p-8 sm:p-12 text-white bg-gradient-to-r from-[#0A2540] via-[#103860] to-[#0A2540]">
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-20 filter saturate-150"
                style={{ backgroundImage: `url(${domainBg})` }}
              />

              <div className="relative z-10 space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  Séance du Samedi • Centre Ali Trad
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white font-serif leading-tight">
                  {currentTraining.theme}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <span className="font-bold text-amber-400 capitalize">{formatDateFull(currentTraining.date)}</span>
                  <span>•</span>
                  <span>{currentTraining.heureDebut} - {currentTraining.heureFin}</span>
                  <span>•</span>
                  <span>32 places disponibles</span>
                </div>

                <div className="text-xs text-slate-300 italic">
                  Public cible : {currentTraining.publicCible || 'Personnel infirmier et techniciens supérieurs'}
                </div>
              </div>

              {/* QR Block */}
              {qrCodeUrl && (
                <div className="relative z-10 flex flex-col items-center bg-white p-4 rounded-2xl shadow-2xl text-slate-900 shrink-0">
                  <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28" />
                  <span className="text-xs font-black uppercase text-[#0A2540] mt-2">
                    Scannez pour rejoindre
                  </span>
                  <span className="text-[10px] text-slate-500">Attestation Délivrée</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
