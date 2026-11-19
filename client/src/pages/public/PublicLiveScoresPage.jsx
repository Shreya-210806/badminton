import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { apiRequest } from '../../api/client';

export default function PublicLiveScoresPage() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchScores = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await apiRequest('/public/live-results');
      if (res.liveMatches) setLiveMatches(res.liveMatches);
      if (res.completedMatches) setCompletedMatches(res.completedMatches);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching live scores:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const timer = setInterval(() => {
      fetchScores();
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col font-sans selection:bg-[#5B806B] selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Banner with Second Uploaded Image */}
        <div className="mb-12 rounded-3xl overflow-hidden bg-white border border-[#E8DCC7] shadow-md shadow-[#C5A98D]/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            
            {/* Left text */}
            <div className="p-8 sm:p-10 lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B806B]/15 text-[#243044] text-xs font-semibold border border-[#5B806B]/30">
                <span className="w-2 h-2 rounded-full bg-[#5B806B] animate-pulse"></span>
                Thane District Court Scores
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#243044] tracking-tight">
                Thane Live Scores & Court Feeds
              </h1>
              <p className="text-sm sm:text-base text-[#243044]/80 max-w-xl leading-relaxed">
                Follow real-time point-by-point action straight from Dadoji Konddev Stadium and local Thane district court referees with instant service and round tracking.
              </p>
              
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => fetchScores(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white text-xs font-bold shadow-md shadow-[#5B806B]/20 transition-all border border-[#5B806B]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Syncing...' : 'Sync Scores'}</span>
                </button>
                <span className="text-xs text-[#243044]/60 font-medium">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Right illustration: Second Image (Outdoor badminton game) */}
            <div className="lg:col-span-5 h-64 sm:h-80 lg:h-full min-h-[260px] relative overflow-hidden bg-[#E8DCC7]/30">
              <img
                src="/images/live-scores.jpg"
                alt="Thane Badminton Match Illustration"
                className="w-full h-full object-cover object-center"
              />
            </div>

          </div>
        </div>

        {/* Live Courts Section */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5B806B] animate-ping"></span>
            <h2 className="font-display text-2xl font-bold text-[#243044]">Active District Court Matches</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5B806B]/15 text-[#5B806B] border border-[#5B806B]/30">
              {liveMatches.length} Live
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-[#243044]/70 text-sm">Loading active Thane matches...</p>
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveMatches.map((m) => (
                <div
                  key={m._id}
                  className="bg-white rounded-3xl border border-[#E8DCC7] p-6 shadow-sm relative overflow-hidden group hover:border-[#5B806B] transition-all"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#5B806B]"></div>

                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="font-bold text-[#5B806B] flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-[#5B806B] animate-pulse"></span>
                      {m.court || 'Court 1'} • {m.round}
                    </span>
                    <span className="text-[#243044] font-medium bg-[#F5F4EF] px-2.5 py-1 rounded-lg border border-[#E8DCC7]">
                      {m.categoryName || m.categoryCode}
                    </span>
                  </div>

                  {/* Competitors & Scores */}
                  <div className="space-y-3 font-display">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F4EF] border border-[#E8DCC7]">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-[#5B806B]"></span>
                        <div>
                          <div className="font-bold text-[#243044] text-base">
                            {m.sideA?.label || 'Player A'}
                          </div>
                          {m.sideA?.club && (
                            <div className="text-xs text-[#243044]/70 font-sans">{m.sideA.club}</div>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-2xl font-black text-[#5B806B]">
                        {m.scores?.length > 0 ? m.scores.map((s) => s.scoreA ?? s.sideA).join(' · ') : '0'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F4EF] border border-[#E8DCC7]">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-[#C5A98D]"></span>
                        <div>
                          <div className="font-bold text-[#243044] text-base">
                            {m.sideB?.label || 'Player B'}
                          </div>
                          {m.sideB?.club && (
                            <div className="text-xs text-[#243044]/70 font-sans">{m.sideB.club}</div>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-2xl font-black text-[#243044]">
                        {m.scores?.length > 0 ? m.scores.map((s) => s.scoreB ?? s.sideB).join(' · ') : '0'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E8DCC7] flex items-center justify-between text-xs text-[#243044]/70">
                    <span className="truncate">Event: {m.tournament?.name || 'Thane District Championship'}</span>
                    <span className="text-[#5B806B] font-bold bg-[#5B806B]/15 px-2 py-0.5 rounded border border-[#5B806B]/30">
                      Server: Side {m.servingSide || 'A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-white rounded-3xl border border-[#E8DCC7]">
              <Activity className="w-10 h-10 text-[#C5A98D] mx-auto mb-2" />
              <p className="text-[#243044] font-semibold text-sm">No matches currently on court</p>
              <p className="text-xs text-[#243044]/60 mt-1">
                Referees update scoring as games commence on scheduled courts.
              </p>
            </div>
          )}
        </section>

        {/* Completed Match Archive Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-[#5B806B]" />
            <h2 className="font-display text-2xl font-bold text-[#243044]">District Match Results</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {completedMatches.map((cm) => (
              <div
                key={cm._id}
                className="p-5 rounded-2xl bg-white border border-[#E8DCC7] hover:border-[#5B806B] transition-all text-xs space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between text-[#243044]/60 pb-2 border-b border-[#E8DCC7]">
                  <span className="font-bold text-[#5B806B]">{cm.matchCode} • {cm.round}</span>
                  <span>{cm.categoryName || cm.categoryCode}</span>
                </div>

                <div className="space-y-1.5 font-display">
                  <div className="flex items-center justify-between font-bold text-sm text-[#243044]">
                    <span className={cm.winnerSide === 'A' ? 'text-[#5B806B]' : 'text-[#243044]'}>
                      {cm.sideA?.label} {cm.winnerSide === 'A' && '✓'}
                    </span>
                    <span className="font-mono text-[#5B806B] text-base">
                      {cm.scores?.map((s) => s.scoreA ?? s.sideA).join(' · ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-medium text-xs text-[#243044]/70">
                    <span className={cm.winnerSide === 'B' ? 'text-[#5B806B] font-bold' : 'text-[#243044]/70'}>
                      {cm.sideB?.label} {cm.winnerSide === 'B' && '✓'}
                    </span>
                    <span className="font-mono text-[#243044] text-sm">
                      {cm.scores?.map((s) => s.scoreB ?? s.sideB).join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E8DCC7] text-[11px] text-[#243044]/60 flex justify-between">
                  <span>{cm.tournament?.name || 'Thane Tournament'}</span>
                  <span className="text-[#5B806B] font-semibold uppercase">Official Result</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
