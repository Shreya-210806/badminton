import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { apiRequest } from '../../api/client';

export default function PublicTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function fetchTournaments() {
      try {
        const res = await apiRequest('/public/tournaments');
        if (isMounted && res.tournaments) {
          setTournaments(res.tournaments);
        }
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTournaments();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.city?.toLowerCase().includes(search.toLowerCase()) ||
      t.venue?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col font-sans selection:bg-[#5B806B] selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B806B]/15 text-[#243044] text-xs font-semibold border border-[#5B806B]/30 mb-3">
            <Trophy className="w-3.5 h-3.5 text-[#5B806B]" />
            Thane District Tournaments & Calendar
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#243044] tracking-tight">
            Thane District Badminton Tournaments
          </h1>
          <p className="text-sm sm:text-base text-[#243044]/80 mt-2 max-w-2xl">
            Browse official Thane district tournaments, entry fees, prize pools, venues in Thane, Kalyan, Dombivli, and registration deadlines.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E8DCC7] shadow-sm mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#C5A98D] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Thane tournaments, venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F5F4EF] rounded-xl border border-[#E8DCC7] text-sm text-[#243044] placeholder-[#243044]/50 focus:border-[#5B806B] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'ongoing', label: 'Ongoing' },
              { id: 'published', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-[#5B806B] text-white font-bold shadow-sm'
                    : 'text-[#243044]/70 hover:text-[#243044] bg-[#F5F4EF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Cards */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[#243044]/70 text-sm">Loading Thane tournaments...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-3xl border border-[#E8DCC7] hover:border-[#5B806B] overflow-hidden shadow-sm hover:shadow-md flex flex-col group transition-all"
              >
                <div className="relative h-48 overflow-hidden bg-[#E8DCC7]/30">
                  <img
                    src={
                      t.bannerImage ||
                      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                        t.status === 'ongoing'
                          ? 'bg-[#5B806B] text-white'
                          : t.status === 'completed'
                          ? 'bg-[#243044] text-white'
                          : 'bg-[#C5A98D] text-white'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  {t.prizePool > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold bg-white/95 border border-[#E8DCC7] text-[#243044] backdrop-blur-md">
                      ₹{t.prizePool.toLocaleString()} Purse
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-display text-xl font-bold text-[#243044] group-hover:text-[#5B806B] transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs text-[#243044]/70 line-clamp-2">{t.subtitle || t.description}</p>
                  </div>

                  <div className="space-y-2 text-xs text-[#243044]/80 pt-3 border-t border-[#E8DCC7]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5B806B] shrink-0" />
                      <span>
                        {new Date(t.startDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        –{' '}
                        {new Date(t.endDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#5B806B] shrink-0" />
                      <span className="truncate">{t.venue}, {t.city}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8DCC7] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-[#243044]/60">Registration</span>
                      <div className="text-xs font-bold text-[#5B806B] capitalize">
                        {t.registrationStatus?.replace('_', ' ') || 'Open'}
                      </div>
                    </div>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Player Entry</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#E8DCC7]">
            <Trophy className="w-12 h-12 text-[#C5A98D] mx-auto mb-3" />
            <h3 className="font-bold text-[#243044] text-lg">No tournaments found</h3>
            <p className="text-[#243044]/60 text-xs mt-1">Try adjusting your search criteria or status filter.</p>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
