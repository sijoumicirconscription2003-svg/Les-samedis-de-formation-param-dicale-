import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, X, Check } from 'lucide-react';
import { NotificationItem } from '../types';
import { markNotificationAsRead } from '../services/notificationService';

interface Props {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<Props> = ({
  notifications,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.lue).length;

  const handleMarkAllRead = async () => {
    for (const n of notifications) {
      if (!n.lue) {
        await markNotificationAsRead(n.id);
      }
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0A2540] text-white flex items-center justify-between border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-amber-500 text-slate-900 text-xs px-2 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1"
              title="Tout marquer comme lu"
            >
              <Check className="w-3.5 h-3.5" />
              Tout lire
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
            Aucune notification pour le moment.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.lue && markNotificationAsRead(n.id)}
              className={`p-3.5 transition-colors cursor-pointer text-left hover:bg-slate-50 ${
                !n.lue ? 'bg-amber-50/50' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {n.type === 'reservation_confirmee' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {n.type === 'pointage_arrivee' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                  {n.type === 'pointage_sortie' && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  )}
                  {n.type === 'promotion_attente' && (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  {n.type === 'attestation_disponible' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  )}
                  {n.type === 'annulation' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {n.titre}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimestamp(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed break-words">
                    {n.message}
                  </p>
                </div>

                {!n.lue && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
