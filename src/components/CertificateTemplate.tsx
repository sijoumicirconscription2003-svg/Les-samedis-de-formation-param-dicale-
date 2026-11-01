import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, X, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Certificate } from '../types';

interface Props {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateTemplate: React.FC<Props> = ({
  certificate,
  isOpen,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !certificate) return;
    const verifyData = `VERIF_ATTESTATION_ALI_TRAD:${certificate.numeroReference}:${certificate.matricule}:${certificate.codeVerification}`;
    QRCode.toDataURL(verifyData, {
      width: 140,
      margin: 1,
      color: { dark: '#0A2540', light: '#FAF9F5' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch(console.error);
  }, [isOpen, certificate]);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatIssueDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Modal Toolbar (hidden during print) */}
        <div className="bg-[#0A2540] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Attestation Officielle de Formation Continue Paramédicale</span>
            <span className="text-white/40">•</span>
            <span className="font-mono text-white text-xs">{certificate.numeroReference}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimer / Exporter PDF (A4 Paysage)
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable A4 Landscape Certificate */}
        <div className="p-4 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-transparent">
          <div
            id="printable-certificate"
            className="w-full max-w-[1000px] aspect-[1.414/1] bg-[#FAF9F5] p-8 sm:p-12 relative flex flex-col justify-between border-8 border-double border-[#C59B27] shadow-xl text-slate-800 font-serif print:shadow-none print:border-8 print:w-[297mm] print:h-[210mm] print:aspect-auto select-none overflow-hidden"
            style={{
              backgroundImage:
                'radial-gradient(#C59B27 0.5px, transparent 0.5px), radial-gradient(#C59B27 0.5px, #FAF9F5 0.5px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          >
            {/* Inner decorative double gold frame */}
            <div className="absolute inset-3 sm:inset-4 border border-[#D4AF37]/60 pointer-events-none" />
            <div className="absolute inset-5 sm:inset-6 border-2 border-[#B8860B]/70 pointer-events-none" />

            {/* Corner flourishes */}
            <div className="absolute top-7 left-7 text-[#C59B27] text-lg font-bold select-none">
              ❖
            </div>
            <div className="absolute top-7 right-7 text-[#C59B27] text-lg font-bold select-none">
              ❖
            </div>
            <div className="absolute bottom-7 left-7 text-[#C59B27] text-lg font-bold select-none">
              ❖
            </div>
            <div className="absolute bottom-7 right-7 text-[#C59B27] text-lg font-bold select-none">
              ❖
            </div>

            {/* Institutional Header */}
            <div className="text-center relative z-10 space-y-1">
              <div className="text-[11px] sm:text-xs tracking-widest uppercase font-bold text-slate-700">
                RÉPUBLIQUE TUNISIENNE — MINISTÈRE DE LA SANTÉ
              </div>
              <div className="text-[10px] sm:text-[11px] tracking-wider uppercase text-slate-600 font-semibold">
                Direction Régionale de la Santé de Tunis • Groupement de Santé de Base de Tunis Sud
              </div>
              <div className="text-[11px] sm:text-xs tracking-wider uppercase text-[#0A2540] font-bold">
                Circonscription Sanitaire de Sijoumi — Centre Intermédiaire Ali Trad
              </div>

              {/* Gold dividing line */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="h-[1.5px] w-20 bg-gradient-to-r from-transparent to-[#C59B27]" />
                <span className="text-amber-600 text-xs font-bold tracking-widest">★ ❖ ★</span>
                <div className="h-[1.5px] w-20 bg-gradient-to-l from-transparent to-[#C59B27]" />
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-[#0A2540] pt-2 font-serif">
                Attestation de Formation Continue
              </h1>
              <div className="text-xs sm:text-sm italic text-amber-800 font-sans tracking-wide">
                Développement Professionnel Continu du Personnel Paramédical
              </div>
            </div>

            {/* Certificate Body Text */}
            <div className="my-auto py-3 text-center space-y-3 relative z-10 px-4 sm:px-10">
              <p className="text-xs sm:text-sm text-slate-600 italic font-serif">
                Le Responsable de la Formation Continue atteste que :
              </p>

              {/* Recipient Name & Details */}
              <div className="py-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0A2540] tracking-wide underline decoration-[#D4AF37] decoration-2 underline-offset-4">
                  {certificate.prenom} {certificate.nom}
                </h2>
                <div className="text-xs sm:text-sm text-slate-700 font-sans font-medium mt-1.5 flex flex-wrap items-center justify-center gap-2">
                  <span>{certificate.fonction}</span>
                  <span className="text-[#C59B27]">•</span>
                  <span>
                    Matricule N° : <strong className="font-mono text-[#0A2540]">{certificate.matricule}</strong>
                  </span>
                  <span className="text-[#C59B27]">•</span>
                  <span>Affectation : <strong>{certificate.etablissement}</strong></span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-serif leading-relaxed max-w-2xl mx-auto">
                a suivi avec assiduité et succès la session de formation continue paramédicale portant sur le thème :
              </p>

              {/* Training Theme Card */}
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl py-2.5 px-6 max-w-2xl mx-auto shadow-xs">
                <div className="text-sm sm:text-base font-bold text-[#0A2540] font-sans leading-snug">
                  « {certificate.themeFormation} »
                </div>
              </div>

              {/* Session Meta */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-sans text-slate-700 pt-1">
                <div>
                  Date : <strong>{formatDate(certificate.dateFormation)}</strong>
                </div>
                <div className="text-slate-300">•</div>
                <div>
                  Volume horaire : <strong>{certificate.dureeFormation}</strong>
                </div>
                <div className="text-slate-300">•</div>
                <div>
                  Formateur : <strong>{certificate.formateur}</strong>
                </div>
                <div className="text-slate-300">•</div>
                <div>
                  Lieu : <strong>{certificate.lieu}</strong>
                </div>
              </div>

              {certificate.estDerogation && (
                <div className="text-[10px] text-amber-800 bg-amber-100/70 rounded-md py-1 px-3 max-w-md mx-auto font-sans">
                  * Délivrée sous dérogation administrative : {certificate.motifDerogation}
                </div>
              )}
            </div>

            {/* Bottom Signatures, Stamp & QR Verification */}
            <div className="pt-3 border-t border-[#D4AF37]/50 flex items-end justify-between gap-4 relative z-10 px-2 font-sans text-xs">
              {/* QR Verification */}
              <div className="flex items-center gap-3">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="Authentification"
                    className="w-16 h-16 sm:w-20 sm:h-20 border border-[#C59B27]/40 rounded-lg bg-white p-1"
                  />
                )}
                <div className="text-[10px] sm:text-[11px] text-slate-600 space-y-0.5">
                  <div className="font-bold text-[#0A2540] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Authenticité Certifiée
                  </div>
                  <div>Réf : <strong className="font-mono text-[#0A2540]">{certificate.numeroReference}</strong></div>
                  <div>Délivrée le : {formatIssueDate(certificate.delivreeLe)}</div>
                  <div className="text-[9px] text-slate-400">GSB Tunis Sud - Sijoumi</div>
                </div>
              </div>

              {/* Official Stamp & Signature */}
              <div className="text-right space-y-1">
                <div className="text-[10px] sm:text-xs text-slate-600">
                  Pour la Circonscription Sanitaire de Sijoumi
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0A2540]">
                  Le Responsable de la Formation Continue
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  Centre Intermédiaire Ali Trad
                </div>

                {/* Simulated Institutional Seal */}
                <div className="inline-flex items-center justify-center border-2 border-red-700/80 rounded-full w-24 h-24 p-1 text-center text-red-800 font-sans text-[8px] font-bold leading-tight uppercase rotate-[-6deg] opacity-85 select-none bg-red-50/20">
                  <div className="border border-dashed border-red-600 rounded-full w-full h-full flex flex-col items-center justify-center p-1">
                    <span>RÉP. TUNISIENNE</span>
                    <span className="text-[7px] text-red-900 font-extrabold my-0.5">★ ALI TRAD ★</span>
                    <span className="text-[7px]">TUNIS SUD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
