import React, { useState } from 'react';
import {
  Award,
  X,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Eye,
  FileCheck,
} from 'lucide-react';
import { TrainingSession, Certificate, UserProfile } from '../types';
import { COURSE_THEMES, CourseThemeConfig } from './CertificateTemplate';
import { createSpecimenCertificateForTraining } from '../services/certificateService';
import { ThemeEmblem } from './ThemeEmblems';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trainings: TrainingSession[];
  currentUserProfile?: UserProfile | null;
  onViewCertificate: (cert: Certificate) => void;
}

export const CourseCertificateStudioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trainings,
  currentUserProfile,
  onViewCertificate,
}) => {
  const sortedTrainings = [...trainings].sort((a, b) => {
    return (a.numeroSeance || 0) - (b.numeroSeance || 0) || a.date.localeCompare(b.date);
  });

  const [selectedSeance, setSelectedSeance] = useState<number>(1);
  const [participantNom, setParticipantNom] = useState(currentUserProfile?.nom || '');
  const [participantPrenom, setParticipantPrenom] = useState(currentUserProfile?.prenom || '');

  if (!isOpen) return null;

  const currentTraining =
    sortedTrainings.find((t) => t.numeroSeance === selectedSeance) || sortedTrainings[0];
  const activeTheme: CourseThemeConfig =
    COURSE_THEMES[selectedSeance] || COURSE_THEMES[1];

  const handleGenerateAndPreview = (seanceNum: number) => {
    const targetTraining =
      sortedTrainings.find((t) => t.numeroSeance === seanceNum) || sortedTrainings[0];

    const cert = createSpecimenCertificateForTraining(targetTraining, {
      nom: participantNom.trim(),
      prenom: participantPrenom.trim(),
      matricule: '',
      fonction: '',
      etablissement: 'Centre Intermédiaire Ali Trad',
    });

    onViewCertificate(cert);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#0A2540] text-white p-5 sm:p-6 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Générateur d'Attestations Officielles Full HD
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold">
                  10 Thèmes Uniques
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                1 Cours = 1 Thème d'Attestation Spécifique
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Identity Section (Personalized or Specimen) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-[#0A2540] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                Identité du Bénéficiaire (Pour l'impression officielle)
              </div>
              <span className="text-[11px] text-slate-500">
                Personnalisez les coordonnées inscrites sur le diplôme
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nom du participant (ou laisser vide pour ligne pointillée)</label>
                <input
                  type="text"
                  value={participantNom}
                  onChange={(e) => setParticipantNom(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-[#0A2540] focus:ring-2 focus:ring-[#0A2540] focus:outline-hidden"
                  placeholder="Laisser vide pour ligne vierge 'Mme /: _____'"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Prénom du participant</label>
                <input
                  type="text"
                  value={participantPrenom}
                  onChange={(e) => setParticipantPrenom(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-[#0A2540] focus:ring-2 focus:ring-[#0A2540] focus:outline-hidden"
                  placeholder="Prénom"
                />
              </div>
            </div>
          </div>

          {/* 10 Distinct Courses & Themes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0A2540] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Sélectionnez le cours pour générer son attestation Full HD (10 Thèmes Disponibles) :
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedTrainings.map((t) => {
                const sNum = t.numeroSeance || 1;
                const themeConf = COURSE_THEMES[sNum] || COURSE_THEMES[10];
                const isSelected = selectedSeance === sNum;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedSeance(sNum)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                      isSelected
                        ? 'border-amber-500 shadow-md bg-amber-50/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Header badge & title */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border flex items-center gap-1.5"
                          style={{
                            backgroundColor: themeConf.badgeBg,
                            color: themeConf.badgeText,
                            borderColor: `${themeConf.borderColor}40`,
                          }}
                        >
                          <ThemeEmblem
                            type={themeConf.emblemType || 'ambulance_samu'}
                            size={14}
                            color={themeConf.primaryColor}
                          />
                          <span>Séance #{sNum} • {themeConf.emblemLabel}</span>
                        </span>

                        <span className="text-[11px] text-slate-500 font-medium">
                          {t.date}
                        </span>
                      </div>

                      <div
                        className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                        style={{ color: themeConf.primaryColor }}
                      >
                        <span className="truncate">Thème : {themeConf.themeTagline}</span>
                      </div>

                      <h4
                        className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-slate-900"
                      >
                        {t.theme}
                      </h4>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {themeConf.themePresentation}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {themeConf.keyConcepts.slice(0, 2).map((kc, kIdx) => (
                          <span
                            key={kIdx}
                            className="text-[9.5px] px-1.5 py-0.5 rounded font-medium bg-white text-slate-600 border border-slate-200"
                          >
                            • {kc}
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1 italic">
                        Formateur : {t.formateur || 'Équipe Pédagogique'}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {themeConf.themeTitle.slice(0, 36)}...
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateAndPreview(sNum);
                        }}
                        className="px-3 py-1.5 rounded-xl font-extrabold text-xs text-white transition-all shadow-xs flex items-center gap-1.5"
                        style={{ backgroundColor: themeConf.primaryColor }}
                        title="Ouvrir et imprimer en Full HD"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Générer HD</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Attestations certifiées avec <strong>QR Code d'authenticité</strong>, double filet ornemental et sceau institutionnel.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl"
            >
              Fermer
            </button>
            <button
              onClick={() => handleGenerateAndPreview(selectedSeance)}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Générer le Thème Sélectionné (Séance #{selectedSeance})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
