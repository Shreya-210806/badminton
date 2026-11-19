import React, { useState, useEffect } from 'react';
import {
  Award,
} from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { apiRequest } from '../../api/client';

export default function PublicRankingsPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadRankings() {
      try {
        const res = await apiRequest('/public/live-results');
        if (isMounted && res.rankings) {
          setRankings(res.rankings);
        }
      } catch (err) {
        console.error('Failed to load rankings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRankings();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = rankings.filter((p) => {
    if (category === 'all') return true;
    if (category === 'male') return p.gender === 'Male';
    if (category === 'female') return p.gender === 'Female';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col font-sans selection:bg-[#5B806B] selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B806B]/15 text-[#243044] text-xs font-semibold border border-[#5B806B]/30 mb-3">
            <Award className="w-3.5 h-3.5 text-[#5B806B]" />
            Thane District Official Standings
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#243044] tracking-tight">
            Thane District Badminton Rankings
          </h1>
          <p className="text-sm sm:text-base text-[#243044]/80 mt-2 max-w-2xl">
            Official district tournament leaderboard points computed across sanctioned singles and doubles matches across Thane, Kalyan, Dombivli, and Kalwa.
          </p>
        </div>

        {/* Filter Tab bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E8DCC7] shadow-sm mb-8">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Divisions' },
              { id: 'male', label: "Men's District" },
              { id: 'female', label: "Women's District" },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  category === c.id
                    ? 'bg-[#5B806B] text-white font-bold shadow-sm'
                    : 'text-[#243044]/70 hover:text-[#243044] bg-[#F5F4EF]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex text-xs text-[#243044]/60 font-medium">
            Updated from Thane District scorecards
          </div>
        </div>

        {/* Podium for Top 3 */}
        {!loading && filtered.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* 2nd place */}
            <div className="order-2 md:order-1 p-6 rounded-3xl bg-white border border-[#E8DCC7] text-center relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#C5A98D]"></div>
              <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] border border-[#E8DCC7] flex items-center justify-center font-bold text-[#243044] mx-auto mb-3 text-lg">
                #2
              </div>
              <h3 className="font-display font-bold text-lg text-[#243044]">{filtered[1].fullName}</h3>
              <p className="text-xs text-[#243044]/70 mt-0.5">{filtered[1].club}</p>
              <div className="mt-4 pt-3 border-t border-[#E8DCC7] font-mono font-extrabold text-[#243044] text-xl">
                {filtered[1].rankingPoints?.toLocaleString()} pts
              </div>
            </div>

            {/* 1st place */}
            <div className="order-1 md:order-2 p-8 rounded-3xl bg-white border-2 border-[#5B806B] text-center relative overflow-hidden flex flex-col justify-between shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#5B806B]"></div>
              <div className="w-16 h-16 rounded-2xl bg-[#E8DCC7]/50 border border-[#C5A98D] flex items-center justify-center font-extrabold text-[#243044] mx-auto mb-3 text-2xl">
                👑 #1
              </div>
              <h3 className="font-display font-black text-2xl text-[#243044]">{filtered[0].fullName}</h3>
              <p className="text-xs text-[#5B806B] font-bold mt-0.5">{filtered[0].club}</p>
              <div className="mt-4 pt-4 border-t border-[#E8DCC7] font-mono font-black text-[#5B806B] text-2xl">
                {filtered[0].rankingPoints?.toLocaleString()} pts
              </div>
            </div>

            {/* 3rd place */}
            <div className="order-3 p-6 rounded-3xl bg-white border border-[#E8DCC7] text-center relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#C5A98D]"></div>
              <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] border border-[#E8DCC7] flex items-center justify-center font-bold text-[#243044] mx-auto mb-3 text-lg">
                #3
              </div>
              <h3 className="font-display font-bold text-lg text-[#243044]">{filtered[2].fullName}</h3>
              <p className="text-xs text-[#243044]/70 mt-0.5">{filtered[2].club}</p>
              <div className="mt-4 pt-3 border-t border-[#E8DCC7] font-mono font-extrabold text-[#243044] text-xl">
                {filtered[2].rankingPoints?.toLocaleString()} pts
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-3xl border border-[#E8DCC7] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#E8DCC7]/40 border-b border-[#E8DCC7] text-xs uppercase font-bold text-[#243044]">
                <tr>
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Athlete</th>
                  <th className="py-4 px-6">Club / Region</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-center">W - L</th>
                  <th className="py-4 px-6 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC7] text-[#243044]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#243044]/50">
                      Loading rankings table...
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-[#F5F4EF] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#243044]">
                        #{idx + 1}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#243044] flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#5B806B]/15 text-[#5B806B] flex items-center justify-center text-xs font-bold border border-[#5B806B]/30">
                          {p.fullName?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{p.fullName}</div>
                          {p.titles > 0 && (
                            <span className="text-[10px] text-[#5B806B] font-semibold">
                              ★ {p.titles}x Thane Champion
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#243044]/70 text-xs">{p.club || 'Thane'}</td>
                      <td className="py-4 px-6 text-xs text-[#243044]/70">{p.gender} • {p.ageGroup || 'Open'}</td>
                      <td className="py-4 px-6 text-center font-mono text-xs">
                        <span className="text-[#5B806B] font-bold">{p.wins || 0}</span>
                        <span className="text-[#C5A98D]"> / </span>
                        <span>{p.losses || 0}</span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-black text-[#5B806B] text-base">
                        {p.rankingPoints?.toLocaleString() || 1200}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
