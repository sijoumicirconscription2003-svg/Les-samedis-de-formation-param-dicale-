import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  X,
  Smartphone,
  Globe,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// URL valide de l'application en cours d'exécution
export const DEV_APP_URL =
  'https://ais-dev-p2a73wfdqesuuivrgpbm3z-564908865060.europe-west1.run.app';

export const getActiveAppUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // Si nous sommes dans l'environnement Cloud Run ou domaine personnalisé
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return DEV_APP_URL;
};

export const OFFICIAL_APP_URL = DEV_APP_URL;

export const ShareAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [shareUrl, setShareUrl] = useState(DEV_APP_URL);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeUrl = getActiveAppUrl();
      setShareUrl(activeUrl);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shareUrl) return;
    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0A2540',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Error generating share QR code:', err));
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenTest = () => {
    window.open(shareUrl, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Plateforme Officielle des Formations Continues Paramédicales du Centre Intermédiaire Ali Trad (GSB Tunis Sud - Sijoumi).\nConsultez le programme du samedi et réservez votre place ici : ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#0F2F57] to-[#123966] text-white p-5 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Partager l'Application avec le Personnel
              </h3>
              <p className="text-xs text-slate-300">
                Lien fonctionnel accessible à tous (smartphones & ordinateurs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Share Link Input Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              Lien public direct pour tous les participants :
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#FAF9F5] p-2.5 rounded-2xl border border-slate-300">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-[#0A2540] font-semibold px-2 py-1 focus:outline-hidden select-all"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      Copier
                    </>
                  )}
                </button>
                <button
                  onClick={handleOpenTest}
                  title="Ouvrir le lien pour tester immédiatement"
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  Ouvrir
                </button>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              Lien direct opérationnel vérifié (Cloud Run direct).
            </p>
          </div>

          {/* Quick WhatsApp Share Button */}
          <div>
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Diffuser sur le groupe WhatsApp des Soignants
            </button>
          </div>

          {/* QR Code for Direct Phone Camera Scanning */}
          <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-amber-300/60 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0A2540] uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-amber-600" />
              Faire scanner aux soignants sur place
            </div>

            <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code d'accès à l'application"
                  className="w-48 h-48 mx-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Génération du QR Code...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
              Les participants peuvent simplement viser ce QR Code avec l'appareil photo de leur smartphone (Android ou iPhone) pour ouvrir immédiatement l'application.
            </p>
          </div>

          {/* Installation Tips */}
          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Application Installable (PWA) :</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Sur smartphone, les soignants peuvent cliquer sur le menu du navigateur puis sur « <strong>Ajouter à l'écran d'accueil</strong> » pour utiliser l'application comme une application native sans passer par les stores.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
