import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import usePlayerDataRefresh from '../../hooks/usePlayerDataRefresh';

export default function PlayerApplications() {
  const { notify } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [loadError, setLoadError] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      const res = await apiRequest('/player/applications');
      if (res.success && res.applications) {
        setApplications(res.applications);
      }
      setLoadError('');
    } catch (err) {
      console.error('Failed to load applications:', err);
      setLoadError(err.message || 'Unable to load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  usePlayerDataRefresh(fetchApplications);

  const handleCancelApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to cancel this tournament application?')) {
      return;
    }
    setCancellingId(appId);
    try {
      const res = await apiRequest(`/player/registrations/${appId}/cancel`, {
        method: 'PATCH',
      });
      if (res.success) {
        notify('Application cancelled successfully.', 'info');
        window.dispatchEvent(new Event('player-data-updated'));
        fetchApplications();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel application.');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      app.tournament?.name?.toLowerCase().includes(search.toLowerCase()) ||
      app.categoryName?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') {
      return ['pending', 'waitlisted'].includes(app.status);
    }
    return app.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#243044]">
          My Applications
        </h1>
        <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
          Review the status of your tournament entries, partner details, and approval stages.
        </p>
      </div>
      {loadError && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {loadError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#C5A98D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, tournament, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-xs text-[#243044] placeholder-[#243044]/50 focus:outline-none focus:border-[#5B806B] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-[#5B806B] text-white shadow-xs'
                  : 'bg-[#F5F4EF] text-[#243044]/70 hover:text-[#243044]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-[#243044]/70">Loading applications...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app._id}
              className="p-6 rounded-3xl bg-white border border-[#E8DCC7] shadow-xs hover:border-[#5B806B] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#5B806B]">
                    {app.registrationNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      app.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : app.status === 'cancelled'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {app.status === 'pending'
                        ? 'Pending'
                        : app.status === 'waitlisted'
                        ? 'Pending (Waitlisted)'
                        : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  <span className="text-[11px] text-[#243044]/60">
                    Applied on: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-base sm:text-lg text-[#243044]">
                  {app.tournament?.name || 'Thane Tournament'}
                </h3>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#243044]/80">
                  <span className="font-semibold">{app.categoryName} ({app.format})</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#5B806B]" />
                    {app.tournament?.venue || 'Thane Venue'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#5B806B]" />
                    {app.tournament?.startDate
                      ? new Date(app.tournament.startDate).toLocaleDateString()
                      : 'Upcoming'}
                  </span>
                </div>

                {/* Partner Details for Doubles */}
                {app.format === 'doubles' && (
                  <div className="p-2.5 rounded-xl bg-[#F5F4EF] text-xs text-[#243044]/80 max-w-md">
                    <span className="font-bold">Doubles Partner: </span>
                    {app.partner?.fullName || app.partnerDetails?.name || 'Partner specified'} (
                    {app.partnerDetails?.email || app.partner?.email})
                  </div>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E8DCC7]">
                <div className="text-left lg:text-right">
                  <div className="text-xs text-[#243044]/60 font-semibold uppercase">Fee Status</div>
                  <div className="font-mono text-sm font-extrabold text-[#243044]">
                    ₹{app.feeAmount} ({app.paymentStatus})
                  </div>
                </div>

                {['pending', 'waitlisted'].includes(app.status) && (
                  <button
                    onClick={() => handleCancelApplication(app._id)}
                    disabled={cancellingId === app._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{cancellingId === app._id ? 'Cancelling...' : 'Cancel Application'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#E8DCC7]">
          <FileText className="w-12 h-12 text-[#C5A98D] mx-auto mb-3" />
          <h4 className="font-bold text-base text-[#243044]">No applications found</h4>
          <p className="text-xs text-[#243044]/60 mt-1">
            Browse available tournaments and apply to get started.
          </p>
          <div className="mt-4">
            <Link
              to="/player/tournaments"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B806B] text-white text-xs font-bold"
            >
              Browse Tournaments
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
