import React, { useEffect, useState, useCallback } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function DrawsFixturesPage() {
  const { notify } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [drawForm, setDrawForm] = useState({
    tournamentId: '',
    categoryCode: '',
    refereeId: '',
    replaceExisting: false,
  });
  const [manualForm, setManualForm] = useState({
    tournamentId: '',
    categoryCode: '',
    round: 'Quarterfinal',
    court: 'Court 1',
    scheduledAt: '',
    sideALabel: '',
    sideBLabel: '',
  });

  const load = useCallback(async () => {
    const [trRes, mRes, stRes] = await Promise.all([
      apiRequest('/crm/tournaments'),
      apiRequest('/matches/assigned'),
      apiRequest('/crm/settings'),
    ]);
    const trs = trRes.tournaments || [];
    setTournaments(trs);
    setMatches(mRes.matches || []);
    setStaff((stRes.staff || []).filter((s) => s.role === 'referee' || s.role === 'admin'));

    if (!drawForm.tournamentId && trs[0]) {
      setDrawForm((prev) => ({
        ...prev,
        tournamentId: trs[0]._id,
        categoryCode: trs[0].categories?.[0]?.code || '',
      }));
      setManualForm((prev) => ({
        ...prev,
        tournamentId: trs[0]._id,
        categoryCode: trs[0].categories?.[0]?.code || '',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedDrawT = tournaments.find((t) => t._id === drawForm.tournamentId);

  const handleGenerateDraw = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/crm/draws/generate', {
        method: 'POST',
        body: drawForm,
      });
      notify(res.message, 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleCreateFixture = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/crm/matches', {
        method: 'POST',
        body: manualForm,
      });
      notify(res.message, 'success');
      setManualForm({ ...manualForm, sideALabel: '', sideBLabel: '' });
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleSchedulePatch = async (matchId, patch) => {
    try {
      await apiRequest(`/crm/matches/${matchId}/schedule`, {
        method: 'PATCH',
        body: patch,
      });
      notify('Match court & time updated.', 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleGenerateDraw}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Automated Knockout Draw Generator
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Seeds approved category entries into Quarterfinal/Semifinal/Final brackets.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <select
              value={drawForm.tournamentId}
              onChange={(e) => {
                const t = tournaments.find((x) => x._id === e.target.value);
                setDrawForm({
                  ...drawForm,
                  tournamentId: e.target.value,
                  categoryCode: t?.categories?.[0]?.code || '',
                });
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
              value={drawForm.categoryCode}
              onChange={(e) => setDrawForm({ ...drawForm, categoryCode: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              {(selectedDrawT?.categories || []).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={drawForm.refereeId}
              onChange={(e) => setDrawForm({ ...drawForm, refereeId: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              <option value="">Default Referee (Optional)</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 px-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={drawForm.replaceExisting}
                onChange={(e) =>
                  setDrawForm({ ...drawForm, replaceExisting: e.target.checked })
                }
                className="rounded text-emerald-600"
              />
              Replace existing draw
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            Generate Knockout Draw
          </button>
        </form>

        <form
          onSubmit={handleCreateFixture}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Schedule Manual Fixture
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <input
              type="text"
              required
              placeholder="Side A Player / Team *"
              value={manualForm.sideALabel}
              onChange={(e) => setManualForm({ ...manualForm, sideALabel: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <input
              type="text"
              required
              placeholder="Side B Player / Team *"
              value={manualForm.sideBLabel}
              onChange={(e) => setManualForm({ ...manualForm, sideBLabel: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <select
              value={manualForm.round}
              onChange={(e) => setManualForm({ ...manualForm, round: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              {['Round of 64', 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final', 'Group Stage'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Court (e.g., Court 2)"
              value={manualForm.court}
              onChange={(e) => setManualForm({ ...manualForm, court: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold"
          >
            Add Scheduled Fixture
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Match / Competitors</th>
                <th className="px-4 py-3">Court Assignment</th>
                <th className="px-4 py-3">Reschedule Date & Time</th>
                <th className="px-4 py-3">Assigned Referee</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matches.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-slate-700">
                      {m.matchCode} • {m.categoryName} ({m.round})
                    </p>
                    <p className="font-bold text-slate-900">
                      {m.sideA?.label} vs {m.sideB?.label}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <input
                      type="text"
                      defaultValue={m.court}
                      onBlur={(e) => {
                        if (e.target.value !== m.court) {
                          handleSchedulePatch(m._id, { court: e.target.value });
                        }
                      }}
                      className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <input
                      type="datetime-local"
                      defaultValue={
                        m.scheduledAt ? new Date(m.scheduledAt).toISOString().slice(0, 16) : ''
                      }
                      onBlur={(e) => {
                        if (e.target.value) {
                          handleSchedulePatch(m._id, { scheduledAt: e.target.value });
                        }
                      }}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <select
                      value={m.assignedReferee?._id || ''}
                      onChange={(e) =>
                        handleSchedulePatch(m._id, { assignedReferee: e.target.value || null })
                      }
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
