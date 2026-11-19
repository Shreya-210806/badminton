import React, { useState } from 'react';
import { X, Trophy, Plus, Minus, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ScoreModal({ match, onClose, onSaved }) {
  const { notify } = useAuth();
  const initialGames = [1, 2, 3].map((num) => {
    const found = (match.scores || []).find((g) => g.gameNumber === num);
    return {
      gameNumber: num,
      scoreA: found ? found.scoreA : 0,
      scoreB: found ? found.scoreB : 0,
    };
  });

  const [games, setGames] = useState(initialGames);
  const [status, setStatus] = useState(match.status === 'scheduled' ? 'live' : match.status);
  const [servingSide, setServingSide] = useState(match.servingSide || 'A');
  const [winnerSide, setWinnerSide] = useState(match.winnerSide || 'A');
  const [published, setPublished] = useState(match.published !== false);
  const [durationMinutes, setDurationMinutes] = useState(match.durationMinutes || 45);
  const [notes, setNotes] = useState(match.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateGamePoint = (idx, side, val) => {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i !== idx) return g;
        const clamped = Math.max(0, Math.min(30, Number(val) || 0));
        return side === 'A' ? { ...g, scoreA: clamped } : { ...g, scoreB: clamped };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        scores: games.filter((g) => g.scoreA > 0 || g.scoreB > 0),
        status,
        servingSide,
        winnerSide: status === 'walkover' ? winnerSide : undefined,
        published,
        durationMinutes: Number(durationMinutes) || 0,
        notes,
      };
      const res = await apiRequest(`/matches/${match._id}/score`, {
        method: 'PUT',
        body: payload,
      });
      notify(res.message || 'Match score saved.', 'success');
      onSaved(res.match);
    } catch (err) {
      setError(err.message || 'Invalid badminton score.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/75 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-up my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {match.matchCode} • {match.categoryName} ({match.round}) • {match.court}
            </span>
            <h3 id="score-modal-title" className="text-xl font-bold text-slate-900 mt-0.5">
              Official BWF Match Scoring Console
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scoring console"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Competitor Banner */}
          <div className="grid grid-cols-2 gap-3 bg-navy-900 text-white rounded-xl p-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                Side A {match.sideA?.seed ? `(Seed #${match.sideA.seed})` : ''}
              </span>
              <p className="font-bold text-base mt-0.5 truncate">{match.sideA?.label}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                Side B {match.sideB?.seed ? `(Seed #${match.sideB.seed})` : ''}
              </span>
              <p className="font-bold text-base mt-0.5 truncate">{match.sideB?.label}</p>
            </div>
          </div>

          {/* BWF Rule Guide */}
          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-emerald-50/80 border border-emerald-200 rounded-xl px-3.5 py-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>BWF Validation Active:</strong> Best of 3 games to 21 points. Win by 2 from
              20–20 through 29–29 (30–29 sudden death max). Leave unplayed games at 0–0.
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </div>
          )}

          {/* Game-by-game controls */}
          <div className="space-y-3">
            {games.map((g, idx) => (
              <div
                key={g.gameNumber}
                className="grid grid-cols-1 sm:grid-cols-7 items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3"
              >
                <div className="sm:col-span-1 font-bold text-xs uppercase tracking-wider text-slate-500">
                  Game {g.gameNumber}
                </div>

                {/* Side A */}
                <div className="sm:col-span-3 flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
                  <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">
                    {match.sideA?.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateGamePoint(idx, 'A', g.scoreA - 1)}
                      aria-label={`Decrease Game ${g.gameNumber} score for Side A`}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      aria-label={`Game ${g.gameNumber} Side A score`}
                      value={g.scoreA}
                      onChange={(e) => updateGamePoint(idx, 'A', e.target.value)}
                      className="w-12 text-center font-bold text-slate-900 border border-slate-200 rounded py-0.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateGamePoint(idx, 'A', g.scoreA + 1)}
                      aria-label={`Increase Game ${g.gameNumber} score for Side A`}
                      className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Side B */}
                <div className="sm:col-span-3 flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
                  <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">
                    {match.sideB?.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateGamePoint(idx, 'B', g.scoreB - 1)}
                      aria-label={`Decrease Game ${g.gameNumber} score for Side B`}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      aria-label={`Game ${g.gameNumber} Side B score`}
                      value={g.scoreB}
                      onChange={(e) => updateGamePoint(idx, 'B', e.target.value)}
                      className="w-12 text-center font-bold text-slate-900 border border-slate-200 rounded py-0.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateGamePoint(idx, 'B', g.scoreB + 1)}
                      aria-label={`Increase Game ${g.gameNumber} score for Side B`}
                      className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Match Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live on Court</option>
                <option value="completed">Completed (Validate Winner)</option>
                <option value="walkover">Walkover</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>

            {status === 'live' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Server
                </label>
                <select
                  value={servingSide}
                  onChange={(e) => setServingSide(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="A">Side A Serving</option>
                  <option value="B">Side B Serving</option>
                </select>
              </div>
            )}

            {status === 'walkover' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Walkover Winner
                </label>
                <select
                  value={winnerSide}
                  onChange={(e) => setWinnerSide(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="A">Side A ({match.sideA?.label})</option>
                  <option value="B">Side B ({match.sideB?.label})</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Publish live score & result to public scoreboard
            </label>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
              >
                <Trophy className="w-4 h-4" />
                {saving ? 'Validating & Saving...' : 'Save Official Score'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
