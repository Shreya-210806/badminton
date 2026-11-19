import React, { useEffect, useState, useCallback } from 'react';
import { Link2 } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function DoublesTeamsPage() {
  const { notify } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({
    tournamentId: '',
    categoryCode: '',
    player1Id: '',
    player2Id: '',
    seedNumber: '',
  });

  const load = useCallback(async () => {
    const [tmRes, trRes, plRes] = await Promise.all([
      apiRequest('/crm/teams'),
      apiRequest('/crm/tournaments'),
      apiRequest('/crm/players'),
    ]);
    setTeams(tmRes.teams || []);
    setTournaments(trRes.tournaments || []);
    setPlayers(plRes.players || []);
    if (!form.tournamentId && trRes.tournaments?.[0]) {
      const firstT = trRes.tournaments[0];
      const dblCat = (firstT.categories || []).find((c) => c.format === 'doubles');
      setForm((prev) => ({
        ...prev,
        tournamentId: firstT._id,
        categoryCode: dblCat?.code || '',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedT = tournaments.find((t) => t._id === form.tournamentId);
  const doublesCategories = (selectedT?.categories || []).filter((c) => c.format === 'doubles');

  const handleLinkTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/crm/teams', { method: 'POST', body: form });
      notify(res.message, 'success');
      setForm({ ...form, player1Id: '', player2Id: '', seedNumber: '' });
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <form
        onSubmit={handleLinkTeam}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">
            Doubles Team Partner Linker
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Validates category gender rules (Men’s, Women’s, Mixed Doubles) and blocks duplicate or
          self-paired entries.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <select
            value={form.tournamentId}
            onChange={(e) => {
              const t = tournaments.find((x) => x._id === e.target.value);
              const dc = (t?.categories || []).find((c) => c.format === 'doubles');
              setForm({ ...form, tournamentId: e.target.value, categoryCode: dc?.code || '' });
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            {tournaments.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={form.categoryCode}
            onChange={(e) => setForm({ ...form, categoryCode: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">-- Doubles Category --</option>
            {doublesCategories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.gender})
              </option>
            ))}
          </select>

          <select
            required
            value={form.player1Id}
            onChange={(e) => setForm({ ...form, player1Id: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">-- Partner 1 --</option>
            {players.map((p) => (
              <option key={p._id} value={p._id}>
                {p.fullName} ({p.gender})
              </option>
            ))}
          </select>

          <select
            required
            value={form.player2Id}
            onChange={(e) => setForm({ ...form, player2Id: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">-- Partner 2 --</option>
            {players.map((p) => (
              <option key={p._id} value={p._id}>
                {p.fullName} ({p.gender})
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2"
          >
            Link Doubles Pair
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((tm) => (
          <div
            key={tm._id}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-slate-600">{tm.teamCode}</span>
                <StatusBadge status={tm.status} />
                {tm.seedNumber && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    Seed #{tm.seedNumber}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 mt-1">{tm.name}</h3>
              <p className="text-xs text-slate-500">
                {tm.tournament?.name} • {tm.categoryName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
