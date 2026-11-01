import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  QrCode,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { processQRCheckin, CheckinResult } from '../services/attendanceService';
import { TrainingSession } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetTraining?: TrainingSession;
  onSuccess?: (result: CheckinResult) => void;
}

export const QRScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetTraining,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'ali-trad-qr-reader';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setResult(null);
      setErrorMsg('');
      setProcessing(false);
      return;
    }

    // Auto start scanner after modal renders
    const timer = setTimeout(() => {
      startScanner();
    }, 350);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setErrorMsg('');
      const element = document.getElementById(scannerContainerId);
      if (!element) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          handleScannedData(decodedText);
        },
        () => {
          // scanning frame, ignore silent errors
        }
      );
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Unable to access camera:', err);
      setCameraActive(false);
      setErrorMsg(
        'Accès caméra non disponible ou refusé dans le navigateur. Vous pouvez saisir le code de secours affiché en salle.'
      );
      setShowManualInput(true);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setCameraActive(false);
  };

  const handleScannedData = async (rawCode: string) => {
    if (processing || result) return;
    setProcessing(true);
    setErrorMsg('');

    // Pause scanner during server check
    await stopScanner();

    try {
      if (!userProfile) {
        throw new Error('Veuillez compléter votre profil pour enregistrer votre présence.');
      }

      // Mandatory server Firebase validation
      const checkinRes = await processQRCheckin(rawCode, userProfile);
      setResult(checkinRes);
      if (onSuccess) onSuccess(checkinRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la validation du pointage.';
      setErrorMsg(msg);
      // Restart scanner after a brief pause so user can scan again
      setTimeout(() => {
        startScanner();
      }, 2500);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleScannedData(manualCodeInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2540] to-[#123966] text-white p-5 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Pointage de Présence</h2>
              <p className="text-xs text-slate-300">Centre Intermédiaire Ali Trad</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Server Confirmed Success State */}
          {result ? (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Vérifié par le serveur Firebase
              </div>

              <h3 className="text-lg font-extrabold text-[#0A2540] leading-snug uppercase">
                {result.type === 'arrivee'
                  ? '« PRÉSENCE D’ARRIVÉE ENREGISTRÉE AVEC SUCCÈS »'
                  : '« PRÉSENCE DE FIN DE SÉANCE ENREGISTRÉE AVEC SUCCÈS »'}
              </h3>

              <div className="bg-[#FAF9F5] border border-amber-300/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700 shadow-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Participant :</span>
                  <span className="font-bold text-sm text-slate-900">{result.participantNom}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Formation :</span>
                  <span className="font-semibold text-slate-900">{result.themeFormation}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Heure exacte d'enregistrement :</span>
                  <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-700" />
                    {result.heureExacte}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  stopScanner();
                  onClose();
                }}
                className="w-full py-3 bg-[#0A2540] hover:bg-[#0F2F57] text-white font-bold text-sm rounded-xl shadow-md transition-all mt-4"
              >
                Fermer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Target info reminder */}
              {targetTraining && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <div className="font-bold truncate">{targetTraining.theme}</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    Samedi {targetTraining.date} • {targetTraining.heureDebut} - {targetTraining.heureFin}
                  </div>
                </div>
              )}

              {/* Error Box */}
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Processing Loader */}
              {processing && (
                <div className="p-6 text-center space-y-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                  <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
                  <div className="text-xs font-bold text-amber-900">
                    Validation serveur Firebase en cours...
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Vérification de l'inscription et anti-doublon...
                  </div>
                </div>
              )}

              {/* Camera Scanner Viewport */}
              <div
                className={`relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#0A2540] shadow-inner ${
                  processing ? 'hidden' : 'block'
                }`}
              >
                <div id={scannerContainerId} className="w-full min-h-[260px]" />

                {/* Overlay viewfinder frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-amber-400 rounded-2xl relative">
                    <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-amber-400" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-amber-400" />
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-amber-400" />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-amber-400" />
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-slate-500">
                Pointez la caméra vers le <strong>QR Code d'Arrivée</strong> ou de <strong>Fin de Séance</strong> projeté en salle.
              </p>

              {/* Toggle manual code entry for edge situations */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-xs text-slate-600 hover:text-[#0A2540] font-semibold underline flex items-center gap-1.5 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {showManualInput ? 'Masquer la saisie manuelle' : 'Problème de caméra ? Saisir le code'}
                </button>
              </div>

              {showManualInput && (
                <form
                  onSubmit={handleManualSubmit}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in"
                >
                  <label className="block text-xs font-bold text-slate-700">
                    Coller ou saisir le payload QR :
                  </label>
                  <textarea
                    rows={2}
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder='{"source":"ALI_TRAD_SANTE", ...}'
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
                  />
                  <button
                    type="submit"
                    disabled={processing || !manualCodeInput.trim()}
                    className="w-full py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    Valider le code de présence
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
