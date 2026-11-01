import React, { useState } from 'react';
import {
  Calendar,
  BookmarkCheck,
  QrCode,
  Award,
  Shield,
  Bell,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
  Share2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationItem } from '../types';
import { NotificationsPopover } from './NotificationsPopover';

export type NavTab =
  | 'accueil'
  | 'programme'
  | 'reservations'
  | 'presences'
  | 'attestations'
  | 'admin';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenProfile: () => void;
  onOpenScanner: () => void;
  onOpenShare?: () => void;
  confirmedBookingsCount: number;
  notifications: NotificationItem[];
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenProfile,
  onOpenScanner,
  onOpenShare,
  confirmedBookingsCount,
  notifications,
}) => {
  const { currentUser, userProfile, isAdmin, isResponsable, signInWithGoogle, signOut } =
    useAuth();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.lue).length;

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNavClick('accueil')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0A2540] flex items-center justify-center text-amber-400 shadow-md border border-amber-400/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-tight text-[#0A2540] leading-none uppercase">
                Centre Ali Trad
              </div>
              <div className="text-[10px] text-amber-700 font-semibold tracking-wide mt-0.5">
                GSB Tunis Sud • Sijoumi
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => handleNavClick('accueil')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'accueil'
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0A2540] hover:bg-slate-100'
              }`}
            >
              Accueil
            </button>

            <button
              onClick={() => handleNavClick('programme')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'programme'
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0A2540] hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Programme du Samedi
            </button>

            <button
              onClick={() => handleNavClick('reservations')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
                activeTab === 'reservations'
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0A2540] hover:bg-slate-100'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Mes Réservations
              {confirmedBookingsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
                  {confirmedBookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('presences')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'presences'
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0A2540] hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              Mes Présences
            </button>

            <button
              onClick={() => handleNavClick('attestations')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'attestations'
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0A2540] hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Mes Attestations
            </button>

            {isResponsable && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-amber-800 hover:text-amber-900 hover:bg-amber-100/70'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Administration
              </button>
            )}
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Share app link button */}
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
                title="Partager le lien fonctionnel de l'application"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Partager l'App</span>
              </button>
            )}

            {/* Direct Quick Scan QR action button */}
            <button
              onClick={onOpenScanner}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              Scanner Présence
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-[#0A2540] hover:bg-slate-100 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              <NotificationsPopover
                notifications={notifications}
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
              />
            </div>

            {/* User Profile / Auth Area */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0A2540] text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-400/40">
                    {userProfile?.prenom ? userProfile.prenom.charAt(0) : 'U'}
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <div className="font-bold text-slate-800 truncate max-w-[120px]">
                      {userProfile ? `${userProfile.prenom} ${userProfile.nom}` : currentUser.displayName || 'Participant'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {userProfile?.matricule ? `Mat: ${userProfile.matricule}` : userProfile?.role || 'Paramédical'}
                    </div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-800">
                        {userProfile ? `${userProfile.prenom} ${userProfile.nom}` : currentUser.email}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {userProfile?.fonction || 'Personnel de Santé'}
                      </div>
                      <div className="text-[10px] text-amber-700 font-mono">
                        {userProfile?.matricule ? `Matricule: ${userProfile.matricule}` : ''}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Modifier mon profil
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-[#0A2540] hover:bg-[#0F2F57] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                Connexion
              </button>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 space-y-1">
            <button
              onClick={() => handleNavClick('accueil')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === 'accueil' ? 'bg-[#0A2540] text-white' : 'text-slate-700'
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => handleNavClick('programme')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === 'programme' ? 'bg-[#0A2540] text-white' : 'text-slate-700'
              }`}
            >
              Programme du Samedi
            </button>
            <button
              onClick={() => handleNavClick('reservations')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'reservations' ? 'bg-[#0A2540] text-white' : 'text-slate-700'
              }`}
            >
              <span>Mes Réservations</span>
              {confirmedBookingsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-900 text-xs font-bold flex items-center justify-center">
                  {confirmedBookingsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleNavClick('presences')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === 'presences' ? 'bg-[#0A2540] text-white' : 'text-slate-700'
              }`}
            >
              Mes Présences
            </button>
            <button
              onClick={() => handleNavClick('attestations')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === 'attestations' ? 'bg-[#0A2540] text-white' : 'text-slate-700'
              }`}
            >
              Mes Attestations
            </button>

            {isResponsable && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-amber-500 text-slate-950' : 'text-amber-900 bg-amber-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Administration
              </button>
            )}

            <div className="pt-2 space-y-2">
              {onOpenShare && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenShare();
                  }}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Share2 className="w-4 h-4 text-amber-700" />
                  Partager le Lien de l'Application
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenScanner();
                }}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <QrCode className="w-4 h-4" />
                Scanner Présence QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
