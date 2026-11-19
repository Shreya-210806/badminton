import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  MapPin,
  ArrowRight,
  Bell,
  Activity,
  Award,
  Sparkles,
  Shield,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import usePlayerDataRefresh from '../../hooks/usePlayerDataRefresh';

export default function PlayerDashboardHome() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    player: null,
    standingRank: null,
    registrations: [],
    notifications: [],
    fixtures: [],
    results: [],
    availableTournaments: [],
  });
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await apiRequest('/player/dashboard');
      if (res.success) {
        setData(res);
        setLoadError('');
      }
    } catch (err) {
      console.error('Failed to load player dashboard:', err);
      setLoadError(err.message || 'Unable to load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  usePlayerDataRefresh(loadData);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-[#243044]/70">Loading your player dashboard...</p>
      </div>
    );
  }

  const {
    player,
    selectedLocation,
    standingRank,
    registrations = [],
    notifications = [],
    fixtures = [],
    availableTournaments = [],
  } = data;

  // Stats calculation
  const totalApplied = registrations.length;
  const approvedCount = registrations.filter((r) => r.status === 'approved').length;
  const pendingCount = registrations.filter((r) => r.status === 'pending').length;
  const rejectedCount = registrations.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Header Banner */}
      {loadError && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {loadError}
        </div>
      )}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8DCC7] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B806B]/15 text-[#5B806B] text-xs font-bold border border-[#5B806B]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thane District Player Portal</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#243044]">
              Welcome, {player?.fullName || 'Player'}!
            </h1>
            <p className="text-xs sm:text-sm text-[#243044]/70 max-w-2xl leading-relaxed">
              Track applications, approved tournaments, match schedules, and updates for your selected stadium.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B806B]">
              <MapPin className="w-3.5 h-3.5" />
              Selected stadium: {selectedLocation || player?.club || 'Choose a stadium in My Profile'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/player/tournaments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white text-xs font-bold shadow-md shadow-[#5B806B]/20 transition-all border border-[#5B806B]"
            >
              <Trophy className="w-4 h-4" />
              <span>Browse & Apply Tournaments</span>
            </Link>
            <Link
              to="/player/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5F4EF] hover:bg-[#E8DCC7]/40 border border-[#E8DCC7] text-[#243044] text-xs font-bold transition-all"
            >
              <span>Player ID: {player?.playerCode || 'PL-0000'}</span>
            </Link>
          </div>
        </div>
      </div>

      <section className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[#243044]">Available at your stadium</h2>
            <p className="text-xs text-[#243044]/60">
              {selectedLocation ? `Eligible tournaments in ${selectedLocation}` : 'Select a supported stadium in My Profile to see local tournaments.'}
            </p>
          </div>
          <Link to="/player/tournaments" className="text-xs font-bold text-[#5B806B]">
            Browse all
          </Link>
        </div>
        {availableTournaments.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableTournaments.slice(0, 4).map((tournament) => (
              <div key={tournament._id} className="p-3 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7]">
                <div className="font-bold text-sm text-[#243044]">{tournament.name}</div>
                <div className="text-[11px] text-[#243044]/70 mt-1">
                  {[tournament.venue, tournament.city].filter(Boolean).join(', ') || 'Location not listed'} · {(tournament.categories || []).map((category) => category.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-[#243044]/60">
            {selectedLocation
              ? 'No eligible tournaments are currently published for this stadium.'
              : 'Choose a supported stadium in My Profile to see local tournaments.'}
          </p>
        )}
      </section>

      {/* 2. Key Metrics Cards (Requirement 1: Total Applied, Approved, Pending, Rejected) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#243044]/60 text-xs font-bold uppercase tracking-wider">
            <span>Total Applied</span>
            <Trophy className="w-4 h-4 text-[#C5A98D]" />
          </div>
          <div className="text-3xl font-display font-black text-[#243044]">{totalApplied}</div>
          <p className="text-[11px] text-[#243044]/60">Tournaments entered</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-display font-black text-emerald-700">{approvedCount}</div>
          <p className="text-[11px] text-[#243044]/60">Ready for court draw</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-display font-black text-amber-700">{pendingCount}</div>
          <p className="text-[11px] text-[#243044]/60">Awaiting admin review</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold uppercase tracking-wider">
            <span>Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-display font-black text-rose-700">{rejectedCount}</div>
          <p className="text-[11px] text-[#243044]/60">Disqualified or full</p>
        </div>
      </div>

      {/* 3. Main Split Section: Applications & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#243044] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#5B806B]" />
              <span>Recent Applications</span>
            </h3>
            <Link
              to="/player/applications"
              className="text-xs font-bold text-[#5B806B] hover:text-[#4a6b57] flex items-center gap-1"
            >
              <span>View all ({registrations.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {registrations.length > 0 ? (
            <div className="space-y-3">
              {registrations.slice(0, 4).map((reg) => (
                <div
                  key={reg._id}
                  className="p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs hover:border-[#5B806B] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#5B806B]">
                        {reg.registrationNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          reg.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : reg.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : reg.status === 'cancelled'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-[#243044]">
                      {reg.tournament?.name || 'Tournament'}
                    </h4>
                    <p className="text-xs text-[#243044]/70">
                      {reg.categoryName} • Format: <span className="capitalize">{reg.format}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#243044]/60 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#5B806B]" />
                        {reg.tournament?.venue || 'Venue not listed'}
                      </span>
                      <span>•</span>
                      <span>Applied: {new Date(reg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-xs font-extrabold text-[#243044]">
                      ₹{reg.feeAmount}
                    </div>
                    <div className="text-[10px] font-semibold text-[#243044]/60 capitalize">
                      Payment: {reg.paymentStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-[#E8DCC7] text-center space-y-3">
              <Trophy className="w-10 h-10 text-[#C5A98D] mx-auto" />
              <h4 className="font-bold text-sm text-[#243044]">No tournament applications yet</h4>
              <p className="text-xs text-[#243044]/60 max-w-sm mx-auto">
                Discover upcoming district championships and submit your player application.
              </p>
              <Link
                to="/player/tournaments"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B806B] text-white text-xs font-bold"
              >
                <span>Browse Tournaments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Recent Notifications (Requirement 1 & 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#243044] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#5B806B]" />
              <span>Recent Notifications</span>
            </h3>
            <Link
              to="/player/notifications"
              className="text-xs font-bold text-[#5B806B] hover:text-[#4a6b57]"
            >
              View all
            </Link>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs space-y-3">
            {notifications.length > 0 ? (
              notifications.slice(0, 4).map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    !n.isRead
                      ? 'bg-[#5B806B]/10 border-[#5B806B]/30'
                      : 'bg-[#F5F4EF] border-[#E8DCC7]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-[#243044] text-xs">{n.title}</h5>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#5B806B] shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#243044]/80 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-[#243044]/50 block mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#243044]/60">
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
