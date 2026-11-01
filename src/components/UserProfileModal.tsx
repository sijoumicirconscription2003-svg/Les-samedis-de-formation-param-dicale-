import React, { useState, useEffect } from 'react';
import { User, Building2, Briefcase, Hash, Phone, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean;
}

const FONCTIONS_PARAMEDICALES = [
  'Infirmier(ère)',
  'Infirmier(ère) Principal(e)',
  'Infirmier(ère) Major',
  'Surveillant(e) de Service',
  'Technicien(ne) Supérieur(e) de Santé - Anesthésie-Réanimation',
  'Technicien(ne) Supérieur(e) de Santé - Soins d’Urgence',
  'Technicien(ne) Supérieur(e) de Santé - Radiologie',
  'Technicien(ne) Supérieur(e) de Santé - Biologie Médicale',
  'Technicien(ne) Supérieur(e) de Santé - Nutrition',
  'Sage-femme',
  'Sage-femme Principale',
  'Aide-soignant(e)',
  'Assistant(e) de Santé',
  'Autre Personnel de Santé',
];

const ETABLISSEMENTS_SANTE = [
  'Centre Intermédiaire Ali Trad',
  'Centre de Santé de Base (CSB) Mellassine',
  'Centre de Santé de Base (CSB) Cité Ennour',
  'Centre de Santé de Base (CSB) Cité Ezzouhour',
  'Centre de Santé de Base (CSB) Birine',
  'Centre de Santé de Base (CSB) Sidi Hassine',
  'Direction du GSB Tunis Sud',
  'Direction Régionale de la Santé de Tunis',
  'Hôpital La Rabta - Tunis',
  'Hôpital Charles Nicolle - Tunis',
  'Hôpital Habib Thameur - Tunis',
  'Hôpital d’Enfants Béchir Hamza',
  'Autre Établissement Sanitaire Public',
  'Secteur Privé / Polyclinique',
];

export const UserProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isMandatory = false,
}) => {
  const { userProfile, saveProfile, currentUser } = useAuth();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [matricule, setMatricule] = useState('');
  const [fonction, setFonction] = useState(FONCTIONS_PARAMEDICALES[0]);
  const [autreFonction, setAutreFonction] = useState('');
  const [etablissement, setEtablissement] = useState(ETABLISSEMENTS_SANTE[0]);
  const [autreEtablissement, setAutreEtablissement] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setNom(userProfile.nom || '');
      setPrenom(userProfile.prenom || '');
      setMatricule(userProfile.matricule || '');
      if (FONCTIONS_PARAMEDICALES.includes(userProfile.fonction)) {
        setFonction(userProfile.fonction);
      } else if (userProfile.fonction) {
        setFonction('Autre Personnel de Santé');
        setAutreFonction(userProfile.fonction);
      }
      if (ETABLISSEMENTS_SANTE.includes(userProfile.etablissement)) {
        setEtablissement(userProfile.etablissement);
      } else if (userProfile.etablissement) {
        setEtablissement('Autre Établissement Sanitaire Public');
        setAutreEtablissement(userProfile.etablissement);
      }
      setTelephone(userProfile.telephone || '');
    } else if (currentUser?.displayName) {
      // Pre-fill from Google account name if available
      const parts = currentUser.displayName.split(' ');
      if (parts.length > 1) {
        setPrenom(parts[0]);
        setNom(parts.slice(1).join(' '));
      } else {
        setPrenom(currentUser.displayName);
      }
    }
  }, [userProfile, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalFonction = fonction === 'Autre Personnel de Santé' ? autreFonction.trim() : fonction;
    const finalEtablissement =
      etablissement === 'Autre Établissement Sanitaire Public' || etablissement === 'Secteur Privé / Polyclinique'
        ? (autreEtablissement.trim() || etablissement)
        : etablissement;

    if (!nom.trim() || !prenom.trim()) {
      setError('Veuillez renseigner votre nom et votre prénom.');
      return;
    }

    if (!matricule.trim()) {
      setError('Le matricule professionnel est obligatoire pour l’identification unique et les attestations.');
      return;
    }

    if (!finalFonction) {
      setError('Veuillez préciser votre fonction paramédicale.');
      return;
    }

    if (!finalEtablissement) {
      setError('Veuillez sélectionner votre établissement d’affectation.');
      return;
    }

    setLoading(true);
    try {
      await saveProfile({
        nom,
        prenom,
        matricule,
        fonction: finalFonction,
        etablissement: finalEtablissement,
        telephone,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde du profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2540] to-[#123966] text-white p-5 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {userProfile ? 'Modifier mon Profil Professionnel' : 'Identification du Personnel Paramédical'}
              </h2>
              <p className="text-xs text-slate-300">
                Centre Intermédiaire Ali Trad • GSB Tunis Sud
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mandatory notice */}
        {isMandatory && (
          <div className="bg-amber-50 border-b border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Complétion obligatoire :</strong> Pour vous inscrire aux formations et recevoir vos attestations officielles nominatives, veuillez renseigner votre matricule et établissement.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Ben Ali"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Yasmine"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-600" />
              Matricule Professionnel Unique <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Ex: 84920 / PM-104"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] focus:border-transparent"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Ce matricule sert d'identifiant unique officiel pour éviter les doublons et figurera sur l'attestation de présence.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              Fonction / Qualification <span className="text-red-500">*</span>
            </label>
            <select
              value={fonction}
              onChange={(e) => setFonction(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] focus:border-transparent bg-white"
            >
              {FONCTIONS_PARAMEDICALES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {fonction === 'Autre Personnel de Santé' && (
              <input
                type="text"
                required
                value={autreFonction}
                onChange={(e) => setAutreFonction(e.target.value)}
                placeholder="Précisez votre fonction..."
                className="w-full mt-2 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Établissement d'affectation <span className="text-red-500">*</span>
            </label>
            <select
              value={etablissement}
              onChange={(e) => setEtablissement(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] focus:border-transparent bg-white"
            >
              {ETABLISSEMENTS_SANTE.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {(etablissement === 'Autre Établissement Sanitaire Public' ||
              etablissement === 'Secteur Privé / Polyclinique') && (
              <input
                type="text"
                required
                value={autreEtablissement}
                onChange={(e) => setAutreEtablissement(e.target.value)}
                placeholder="Nom précis de votre centre / hôpital..."
                className="w-full mt-2 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540]"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              Numéro de Téléphone (Optionnel)
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: 98 123 456"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0A2540] focus:border-transparent"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0A2540] hover:bg-[#0F2F57] rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-400" />
              {loading ? 'Enregistrement...' : 'Enregistrer mon profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
