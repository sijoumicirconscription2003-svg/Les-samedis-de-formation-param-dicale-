import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  X,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  Users,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { TrainingSession, Registration } from '../types';
import { generateQRString } from '../services/attendanceService';
import { rotateSessionNonce, toggleCheckinStatus, listenTrainingRegistrations } from '../services/trainingService';

interface Props {
  training: TrainingSession;
  isOpen: boolean;
  onClose: () => void;
}

export const RoomProjectorModal: React.FC<Props> = ({
  training,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'arrivee' | 'sortie'>(
    training.pointageSortieOuvert && !training.pointageArriveeOuvert ? 'sortie' : 'arrivee'
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrRawPayload, setQrRawPayload] = useState<string>('');
  const [secondsToRotate, setSecondsToRotate] = useState<number>(30);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen to attendees for live room counter
  useEffect(() => {
    if (!isOpen || !training.id) return;
    const unsub = listenTrainingRegistrations(training.id, (regs) => {
      setRegistrations(regs);
    });
    return () => unsub();
  }, [isOpen, training.id]);

  // Generate QR Code on change of tab or sessionNonce
  useEffect(() => {
    if (!isOpen) return;

    const payload = generateQRString(training, activeTab);
    setQrRawPayload(payload);

    QRCode.toDataURL(payload, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0A2540',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR Code:', err));
  }, [isOpen, training, activeTab, training.sessionNonce]);

  // Anti-screenshot 30-second rotation interval
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsToRotate((prev) => {
        if (prev <= 1) {
          // Trigger rotation
          rotateSessionNonce(training.id).catch(console.error);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, training.id]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrRawPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleWindow = async (type: 'arrivee' | 'sortie') => {
    const isCurrentlyOpen = type === 'arrivee' ? training.pointageArriveeOuvert : training.pointageSortieOuvert;
    await toggleCheckinStatus(training.id, type, !isCurrentlyOpen);
  };

  const handleForceRotate = async () => {
    await rotateSessionNonce(training.id);
    setSecondsToRotate(30);
  };

  if (!isOpen) return null;

  const arrivedCount = registrations.filter((r) => r.pointageArriveeValide).length;
  const departedCount = registrations.filter((r) => r.pointageSortieValide).length;
  const confirmedCount = registrations.filter((r) => r.statut === 'CONFIRMEE').length;

  const isCurrentOpen = activeTab === 'arrivee' ? training.pointageArriveeOuvert : training.pointageSortieOuvert;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#07192C] text-white flex flex-col overflow-y-auto ${
        isFullscreen ? 'p-0' : 'p-4 sm:p-6'
      }`}
    >
      {/* Top Bar for Projector */}
      <div className="bg-[#0A2540] border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>RÉPUBLIQUE TUNISIENNE — MINISTÈRE DE LA SANTÉ</span>
            <span>•</span>
            <span>GSB TUNIS SUD</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Centre Intermédiaire Ali Trad</span>
            <span className="text-sm font-normal text-slate-300">| Écran Salle de Réunion</span>
          </h2>
        </div>

        {/* Tab switcher: Arrivée vs Sortie */}
        <div className="flex items-center gap-2 bg-[#07192C] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('arrivee')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'arrivee'
                ? 'bg-amber-400 text-slate-900 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            1. QR CODE ARRIVÉE
            {training.pointageArriveeOuvert && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('sortie')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sortie'
                ? 'bg-amber-400 text-slate-900 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            2. QR CODE FIN DE SÉANCE
            {training.pointageSortieOuvert && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Plein écran"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors"
            title="Quitter le projecteur"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Projector Screen */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Left: Huge QR Code Box */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-amber-400 relative">
            {/* Live QR Image */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code de Présence"
                className="w-72 h-72 sm:w-96 sm:h-96 object-contain rounded-xl"
              />
            ) : (
              <div className="w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
                <RefreshCw className="w-10 h-10 animate-spin text-slate-400" />
              </div>
            )}

            {/* Anti-screenshot Live Tag */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 px-2">
              <span className="flex items-center gap-1 font-semibold text-[#0A2540]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Anti-Capture Active
              </span>
              <span className="font-mono text-slate-500">
                Rotation dans {secondsToRotate}s
              </span>
            </div>
          </div>

          {/* Quick status bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 justify-center">
            <button
              onClick={() => handleToggleWindow(activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isCurrentOpen
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isCurrentOpen ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Pointage Ouvert (Cliquer pour fermer)
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Pointage Fermé (Cliquer pour ouvrir)
                </>
              )}
            </button>

            <button
              onClick={handleForceRotate}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              Régénérer jeton
            </button>

            <button
              onClick={handleCopyPayload}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors"
              title="Copier le payload pour tests"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-400" />
              )}
              {copied ? 'Copié !' : 'Copier code test'}
            </button>
          </div>
        </div>

        {/* Right: Session Info & Live Attendance Metrics */}
        <div className="w-full lg:w-1/2 space-y-6">
          {/* Card Info */}
          <div className="bg-[#0A2540] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span>Formation Continue Paramédicale</span>
              <span>•</span>
              <span>Ali Trad</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
              {training.theme}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Samedi {training.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{training.heureDebut} à {training.heureFin} ({training.dureeHeures})</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span>{training.lieu || 'Salle de réunion Centre Ali Trad'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Formateur : {training.formateur}</span>
              </div>
            </div>
          </div>

          {/* Live Checkin Progress Roster */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-[#0A2540] border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-xs text-slate-400 block mb-1">Inscrits confirmés</span>
              <span className="text-2xl font-bold text-white">{confirmedCount}</span>
              <span className="text-[11px] text-slate-400 block">/ {training.capaciteMax || 25} places</span>
            </div>

            <div className="bg-[#0A2540] border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-xs text-amber-300 block mb-1">Pointages Arrivée</span>
              <span className="text-2xl font-bold text-amber-400">{arrivedCount}</span>
              <span className="text-[11px] text-slate-400 block">participants</span>
            </div>

            <div className="bg-[#0A2540] border border-white/10 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
              <span className="text-xs text-purple-300 block mb-1">Pointages Sortie</span>
              <span className="text-2xl font-bold text-purple-400">{departedCount}</span>
              <span className="text-[11px] text-slate-400 block">participants</span>
            </div>
          </div>

          {/* Participant Instructions Box */}
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-5 text-amber-200 text-xs space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-2 text-sm">
              <span>Instructions pour les participants :</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed text-[11px] sm:text-xs">
              <li>Ouvrez l'application sur votre smartphone (Android, iPhone ou ordinateur).</li>
              <li>Connectez-vous à votre espace personnel et cliquez sur « <strong>Scanner Présence</strong> ».</li>
              <li>Visez ce QR Code à l'arrivée, puis à nouveau à la fin de la séance pour valider votre assiduité.</li>
              <li>Votre attestation officielle sera émise automatiquement dès validation du double scan.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
