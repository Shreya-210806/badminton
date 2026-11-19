import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
} from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { apiRequest } from '../../api/client';

export default function PublicPlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadPlayers() {
      try {
        const res = await apiRequest('/public/players');
        if (isMounted && res.players) {
          setPlayers(res.players);
        }
      } catch (err) {
        console.error('Failed to load players:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPlayers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = players.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.club?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (genderFilter === 'all') return true;
    return p.gender?.toLowerCase() === genderFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col font-sans selection:bg-[#5B806B] selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B806B]/15 text-[#243044] text-xs font-semibold border border-[#5B806B]/30 mb-3">
            <Users className="w-3.5 h-3.5 text-[#5B806B]" />
            Thane District Badminton Directory
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#243044] tracking-tight">
            Thane District Badminton Players
          </h1>
          <p className="text-sm sm:text-base text-[#243044]/80 mt-2 max-w-2xl">
            Meet competitive badminton athletes representing clubs, gyms, and academies across Thane, Kalwa, Mumbra, Dombivli, Kalyan, and Bhiwandi.
          </p>
        </div>

        {/* Search & Gender filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E8DCC7] shadow-sm mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#C5A98D] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search athlete, club or Thane region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F5F4EF] rounded-xl border border-[#E8DCC7] text-sm text-[#243044] placeholder-[#243044]/50 focus:border-[#5B806B] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['all', 'Male', 'Female'].map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  genderFilter === g
                    ? 'bg-[#5B806B] text-white font-bold shadow-sm'
                    : 'text-[#243044]/70 hover:text-[#243044] bg-[#F5F4EF]'
                }`}
              >
                {g === 'all' ? 'All Athletes' : `${g}s`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[#243044]/70 text-sm">Loading Thane athlete directory...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((player) => (
              <div
                key={player._id}
                className="p-6 rounded-3xl bg-white border border-[#E8DCC7] shadow-sm hover:shadow-md hover:border-[#5B806B] flex flex-col justify-between group transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#5B806B]/15 border border-[#5B806B]/30 flex items-center justify-center font-display font-black text-[#5B806B] text-lg">
                      {player.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-[#243044] group-hover:text-[#5B806B] transition-colors">
                        {player.fullName}
                      </h3>
                      <p className="text-xs text-[#243044]/70">{player.club || 'Thane'}</p>
                      <span className="text-[11px] font-semibold text-[#243044]/50 uppercase tracking-wider">
                        {player.gender} • {player.ageGroup || 'Open'} • {player.handedness || 'Right'}-Handed
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#E8DCC7]/40 text-[#243044] border border-[#E8DCC7]">
                    {player.skillLevel || 'District'}
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E8DCC7] grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7]">
                    <div className="font-mono font-bold text-[#5B806B] text-sm">{player.rankingPoints || 0}</div>
                    <div className="text-[10px] text-[#243044]/60 uppercase">Points</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7]">
                    <div className="font-mono font-bold text-[#243044] text-sm">
                      {player.wins || 0} - {player.losses || 0}
                    </div>
                    <div className="text-[10px] text-[#243044]/60 uppercase">W - L</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7]">
                    <div className="font-mono font-bold text-[#C5A98D] text-sm">{player.titles || 0}</div>
                    <div className="text-[10px] text-[#243044]/60 uppercase">Titles</div>
                  </div>
                </div>

                {player.bio && (
                  <p className="text-xs text-[#243044]/70 mt-4 line-clamp-2 italic">
                    "{player.bio}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#E8DCC7]">
            <Users className="w-12 h-12 text-[#C5A98D] mx-auto mb-3" />
            <h3 className="font-bold text-[#243044] text-lg">No players match the filter</h3>
            <p className="text-[#243044]/60 text-xs mt-1">Try clearing your search keyword.</p>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
