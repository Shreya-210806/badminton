import React, { useState, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Trophy,
  Activity,
  AlertCircle,
  Check,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import usePlayerDataRefresh, { notifyPlayerDataChanged } from '../../hooks/usePlayerDataRefresh';

export default function PlayerNotifications() {
  const { notify } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [loadError, setLoadError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiRequest('/player/notifications');
      if (!res.success) throw new Error(res.message || 'Unable to load notifications.');
      setNotifications(res.notifications || []);
      setLoadError('');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setLoadError(err.message || 'Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  usePlayerDataRefresh(fetchNotifications);

  const handleMarkAsRead = async (id) => {
    setMarkingId(id);
    try {
      await apiRequest(`/player/notifications/${id}/read`, {
        method: 'PUT',
      });
      notifyPlayerDataChanged();
      if (id === 'all') {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        notify('All notifications marked as read.', 'success');
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
      notify(err.message || 'Unable to update notification status.', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#243044]">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
            Real-time updates regarding your applications, tournament schedule changes, court assignments, and match fixtures.
          </p>
        </div>
        {loadError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        {unreadCount > 0 && (
          <button
            onClick={() => handleMarkAsRead('all')}
            disabled={markingId === 'all'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E8DCC7] hover:border-[#5B806B] text-xs font-bold text-[#5B806B] shadow-xs transition-all self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{markingId === 'all' ? 'Marking...' : 'Mark All as Read'}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-[#243044]/70">Loading notifications...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !n.isRead
                  ? 'bg-white border-[#5B806B] shadow-sm'
                  : 'bg-[#F5F4EF] border-[#E8DCC7]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.isRead
                      ? 'bg-[#5B806B] text-white shadow-xs'
                      : 'bg-[#E8DCC7]/50 text-[#243044]/70'
                  }`}
                >
                  {n.type === 'registration' ? (
                    <Trophy className="w-4 h-4" />
                  ) : n.type === 'result' ? (
                    <Activity className="w-4 h-4" />
                  ) : loadError ? null : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-[#243044]">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#5B806B]/15 text-[#5B806B]">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#243044]/80 leading-relaxed max-w-2xl">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-[#243044]/50 block pt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  disabled={markingId === n._id}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#5B806B] hover:bg-[#5B806B]/10 shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-[#E8DCC7]">
          <Bell className="w-12 h-12 text-[#C5A98D] mx-auto mb-3" />
          <h4 className="font-bold text-base text-[#243044]">No notifications</h4>
          <p className="text-xs text-[#243044]/60 mt-1">
            You will receive instant alerts here when applications or schedules are updated.
          </p>
        </div>
      )}
    </div>
  );
}
