import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Calendar,
  MapPin,
  Trophy,
  ArrowRight,
  Shield,
  Activity,
  Users,
} from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function PlayerMyTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiRequest('/player/dashboard');
        if (res.success && res.registrations) {
          // Group applications by tournament
          const map = new Map();
          res.registrations.forEach((r) => {
            if (r.tournament && !map.has(r.tournament._id)) {
              map.set(r.tournament._id, {
                tournament: r.tournament,
                entries: [],
              });
            }
            if (r.tournament) {
              map.get(r.tournament._id).entries.push(r);
            }
          });
          setTournaments(Array.from(map.values()));
        }
      } catch (err) {
        console.error('Failed to load player tournaments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#243044]">
          My Tournaments
        </h1>
        <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
          Tournaments in which you have submitted entries or hold confirmed qualification slots.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-[#243044]/70">Loading your tournaments...</p>
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map(({ tournament, entries }) => (
            <div
              key={tournament._id}
              className="p-6 rounded-3xl bg-white border border-[#E8DCC7] shadow-xs hover:border-[#5B806B] transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5B806B]/15 text-[#5B806B]">
                    {tournament.status || 'Active'}
                  </span>
                  <span className="text-xs font-bold text-[#243044]/60">
                    {entries.length} {entries.length === 1 ? 'Entry' : 'Entries'}
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-[#243044]">
                  {tournament.name}
                </h3>

                <div className="space-y-1.5 text-xs text-[#243044]/80 pt-2 border-t border-[#E8DCC7]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>
                      {tournament.startDate
                        ? `${new Date(tournament.startDate).toLocaleDateString()} – ${new Date(
                            tournament.endDate
                          ).toLocaleDateString()}`
                        : 'Dates announced soon'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>{tournament.venue}, {tournament.city}</span>
                  </div>
                </div>

                {/* Sub-entries list */}
                <div className="pt-3 border-t border-[#E8DCC7] space-y-2">
                  <div className="text-[11px] font-bold text-[#243044]/70 uppercase">
                    Your Applied Categories
                  </div>
                  {entries.map((entry) => (
                    <div
                      key={entry._id}
                      className="p-2.5 rounded-xl bg-[#F5F4EF] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#243044]">{entry.categoryName}</span>
                        <span className="text-[10px] text-[#243044]/60 ml-2">
                          ({entry.registrationNumber})
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          entry.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8DCC7] flex items-center justify-between">
                <Link
                  to="/player/updates"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B806B] hover:text-[#4a6b57]"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>View Fixtures & Updates</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/player/applications"
                  className="text-xs font-bold text-[#243044]/70 hover:text-[#243044]"
                >
                  Manage Application →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#E8DCC7]">
          <CalendarCheck className="w-12 h-12 text-[#C5A98D] mx-auto mb-3" />
          <h4 className="font-bold text-base text-[#243044]">No confirmed tournament entries</h4>
          <p className="text-xs text-[#243044]/60 mt-1">
            Apply for available Thane District championships to start building your competition history.
          </p>
          <div className="mt-4">
            <Link
              to="/player/tournaments"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B806B] text-white text-xs font-bold"
            >
              Browse Available Tournaments
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
