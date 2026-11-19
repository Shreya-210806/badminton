import React, { useState, useCallback } from 'react';
import {
  Radio,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Activity,
  AlertCircle,
  Pin,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import usePlayerDataRefresh from '../../hooks/usePlayerDataRefresh';

export default function PlayerTournamentUpdates() {
  const [updates, setUpdates] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await apiRequest('/player/updates');
      if (res.success) {
        setUpdates(res.updates || []);
        setFixtures(res.fixtures || []);
        setResults(res.results || []);
      }
      setLoadError('');
    } catch (err) {
      console.error('Failed to load updates:', err);
      setLoadError(err.message || 'Unable to load tournament updates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  usePlayerDataRefresh(loadData);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#243044]">
          Tournament Updates & Fixtures
        </h1>
        <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
          Official court schedules, match fixture announcements, venue updates, and live referee alerts for your registered tournaments.
        </p>
      </div>
      {loadError && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-[#243044]/70">Loading updates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Official Announcements and Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display font-bold text-lg text-[#243044] flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#5B806B]" />
              <span>Official Bulletins & Notices</span>
            </h3>

            {updates.length > 0 ? (
              <div className="space-y-4">
                {updates.map((up) => (
                  <div
                    key={up._id}
                    className="p-6 rounded-3xl bg-white border border-[#E8DCC7] shadow-xs hover:border-[#5B806B] transition-all space-y-3 relative overflow-hidden"
                  >
                    {up.isPinned && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#5B806B]">
                        <Pin className="w-3 h-3 rotate-45" />
                        <span>Pinned Bulletin</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="font-display font-extrabold text-base text-[#243044]">
                        {up.title}
                      </h4>
                      <span className="text-[11px] text-[#243044]/60">
                        {new Date(up.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-[#243044]/70 font-semibold flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-[#5B806B]" />
                      <span>{up.tournament?.name || 'Tournament Notice'}</span>
                    </div>

                    <p className="text-xs text-[#243044]/80 leading-relaxed whitespace-pre-line bg-[#F5F4EF] p-4 rounded-2xl border border-[#E8DCC7]">
                      {up.content}
                    </p>

                    <div className="text-[11px] text-[#243044]/50 flex items-center justify-between pt-1">
                      <span>Posted by: {up.authorName || 'Tournament Committee'}</span>
                      <span className="capitalize">{up.type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-[#E8DCC7] text-center space-y-2">
                <Radio className="w-8 h-8 text-[#C5A98D] mx-auto" />
                <h4 className="font-bold text-sm text-[#243044]">No bulletins published yet</h4>
                <p className="text-xs text-[#243044]/60">
                  When tournament organizers release court schedules, draw charts, or venue changes, they will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Scheduled Fixtures & Results for the Player */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h3 className="font-display font-bold text-lg text-[#243044] flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[#5B806B]" />
                <span>Your Scheduled Matches</span>
              </h3>

              {fixtures.length > 0 ? (
                <div className="space-y-3">
                  {fixtures.map((m) => (
                    <div
                      key={m._id}
                      className="p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#5B806B]">{m.court || 'Court Assigned'}</span>
                        <span className="text-[11px] font-semibold text-[#243044]/70 bg-[#F5F4EF] px-2 py-0.5 rounded">
                          {m.status} · {m.round || 'Round'}
                        </span>
                      </div>

                      <div className="space-y-1.5 font-display text-sm font-bold text-[#243044]">
                        <div className="text-[11px] text-[#243044]/60">
                          {m.categoryName || m.categoryCode}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{m.sideA?.label || 'Side A'}</span>
                          <span className="font-mono text-xs text-[#5B806B]">Seed {m.sideA?.seed || '-'}</span>
                        </div>
                        <div className="text-[11px] text-[#243044]/50 font-sans text-center">VS</div>
                        <div className="flex items-center justify-between">
                          <span>{m.sideB?.label || 'Side B'}</span>
                          <span className="font-mono text-xs text-[#5B806B]">Seed {m.sideB?.seed || '-'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E8DCC7] flex items-center justify-between text-[11px] text-[#243044]/60">
                        <span className="truncate">{m.tournament?.name || 'Tournament'}</span>
                        <span>
                          {new Date(m.scheduledAt).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-[#E8DCC7] text-center text-xs text-[#243044]/60">
                  No upcoming court matches scheduled yet. Fixtures stream live once tournament draw charts are generated.
                </div>
              )}
            </div>

            {/* Results Section */}
            <div>
              <h3 className="font-display font-bold text-lg text-[#243044] flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#5B806B]" />
                <span>Recent Match Results</span>
              </h3>

              {results.length > 0 ? (
                <div className="space-y-3">
                  {results.slice(0, 3).map((r) => (
                    <div
                      key={r._id}
                      className="p-4 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#243044]/60">
                        <span className="font-bold text-[#5B806B]">{r.categoryName || r.categoryCode}</span>
                        <span>{r.round}</span>
                      </div>
                      <div className="flex items-center justify-between font-display font-bold text-sm text-[#243044]">
                        <span>{r.sideA?.label}</span>
                        <span className="font-mono text-[#5B806B]">
                          {r.scores?.map((s) => `${s.scoreA}-${s.scoreB}`).join(', ') || 'Finished'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#243044]/70">
                        Winner: <span className="font-bold text-[#5B806B]">{r.winnerSide === 'A' ? r.sideA?.label : r.sideB?.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-[#E8DCC7] text-center text-xs text-[#243044]/60">
                  No completed matches recorded for this season yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
