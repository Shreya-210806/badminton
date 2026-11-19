import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardCheck, Trophy, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import ScoreModal from '../../components/ScoreModal';

export default function RefereeConsolePage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoringMatch, setScoringMatch] = useState(null);

  const loadAssigned = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/matches/assigned');
      setMatches(res.matches || []);
    } catch (_err) {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-navy-950 text-white rounded-2xl p-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
            <ClipboardCheck className="w-4 h-4" />
            Assigned Match Officials Console
          </span>
          <h2 className="font-display text-2xl font-bold mt-1">Referee & Court Scorer Pad</h2>
          <p className="text-xs text-slate-300 mt-1">
            Signed in as <strong>{user?.name}</strong> ({user?.role}). Referees can score only
            matches explicitly assigned to their account.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAssigned}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" />
          Sync Assigned Courts
        </button>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          No matches are currently assigned to your referee account.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-navy-900 text-emerald-300">
                    {m.matchCode}
                  </span>
                  <span className="font-bold text-emerald-700">{m.court}</span>
                  <span>•</span>
                  <span className="text-slate-600">
                    {m.tournament?.name} — {m.categoryName} ({m.round})
                  </span>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {m.sideA?.label} vs {m.sideB?.label}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {(m.scores || []).map((g) => (
                  <span
                    key={g.gameNumber}
                    className="px-2.5 py-1 rounded bg-slate-100 font-mono text-xs font-bold"
                  >
                    {g.scoreA}–{g.scoreB}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setScoringMatch(m)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Trophy className="w-4 h-4" />
                  Record Score
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {scoringMatch && (
        <ScoreModal
          match={scoringMatch}
          onClose={() => setScoringMatch(null)}
          onSaved={() => {
            setScoringMatch(null);
            loadAssigned();
          }}
        />
      )}
    </div>
  );
}
