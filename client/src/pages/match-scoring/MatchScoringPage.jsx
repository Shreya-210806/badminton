import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import ScoreModal from '../../components/ScoreModal';

export default function MatchScoringPage() {
  const [matches, setMatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [scoringMatch, setScoringMatch] = useState(null);

  const load = useCallback(async () => {
    const q = statusFilter ? `?status=${statusFilter}` : '';
    const res = await apiRequest(`/matches/assigned${q}`);
    setMatches(res.matches || []);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Official BWF 3×21 Match Scoring & Results Publication
          </h2>
          <p className="text-xs text-slate-500">
            Validates win-by-2 deuce rules (20–20 through 29–29, 30–29 sudden death) and advances
            bracket winners automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white font-semibold"
          >
            <option value="">All Match Statuses</option>
            <option value="live">Live on Court</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            aria-label="Refresh matches"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((m) => (
          <div
            key={m._id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono font-bold text-slate-700">
                  {m.matchCode} • {m.court} • {m.round}
                </span>
                <StatusBadge status={m.status} />
              </div>
              <p className="text-xs text-slate-500">
                {m.tournament?.name} — {m.categoryName}
              </p>
              <div className="mt-2.5 space-y-1 text-sm">
                <p className={m.winnerSide === 'A' ? 'font-extrabold text-emerald-800' : 'font-semibold text-slate-900'}>
                  {m.winnerSide === 'A' ? '🏆 ' : ''}
                  {m.sideA?.label}
                </p>
                <p className={m.winnerSide === 'B' ? 'font-extrabold text-emerald-800' : 'font-semibold text-slate-900'}>
                  {m.winnerSide === 'B' ? '🏆 ' : ''}
                  {m.sideB?.label}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-1.5">
                {(m.scores || []).length === 0 ? (
                  <span className="text-xs text-slate-400">No games recorded</span>
                ) : (
                  m.scores.map((g) => (
                    <span
                      key={g.gameNumber}
                      className="px-2.5 py-1 rounded bg-slate-100 font-mono text-xs font-bold"
                    >
                      {g.scoreA}–{g.scoreB}
                    </span>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setScoringMatch(m)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Trophy className="w-3.5 h-3.5" />
                Record Score
              </button>
            </div>
          </div>
        ))}
      </div>

      {scoringMatch && (
        <ScoreModal
          match={scoringMatch}
          onClose={() => setScoringMatch(null)}
          onSaved={() => {
            setScoringMatch(null);
            load();
          }}
        />
      )}
    </div>
  );
}
