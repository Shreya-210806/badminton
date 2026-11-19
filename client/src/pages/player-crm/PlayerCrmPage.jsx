import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, MessageSquarePlus } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function PlayerCrmPage() {
  const { notify } = useAuth();
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'Male',
    ageGroup: 'Open',
    club: '',
    city: '',
    skillLevel: 'Intermediate',
    tags: '',
    crmStatus: 'active',
  });

  const loadPlayers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await apiRequest(`/crm/players?${params.toString()}`);
    setPlayers(res.players || []);
    if (selected) {
      const updated = (res.players || []).find((p) => p._id === selected._id);
      if (updated) setSelected(updated);
    }
  }, [search, statusFilter, selected?._id]);

  useEffect(() => {
    loadPlayers();
  }, [search, statusFilter]);

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/crm/players', { method: 'POST', body: newPlayer });
      notify('Player added to CRM!', 'success');
      setShowCreate(false);
      setNewPlayer({
        fullName: '',
        email: '',
        phone: '',
        gender: 'Male',
        ageGroup: 'Open',
        club: '',
        city: '',
        skillLevel: 'Intermediate',
        tags: '',
        crmStatus: 'active',
      });
      loadPlayers();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleUpdateSelected = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await apiRequest(`/crm/players/${selected._id}`, {
        method: 'PUT',
        body: {
          fullName: selected.fullName,
          phone: selected.phone,
          club: selected.club,
          city: selected.city,
          crmStatus: selected.crm?.status || 'active',
          tags: selected.crm?.tags || [],
          contactPreferences: selected.crm?.contactPreferences,
        },
      });
      notify('Player CRM profile saved.', 'success');
      loadPlayers();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selected || !noteText.trim()) return;
    try {
      const res = await apiRequest(`/crm/players/${selected._id}/notes`, {
        method: 'POST',
        body: { text: noteText },
      });
      setNoteText('');
      setSelected({ ...res.player, registrationHistory: selected.registrationHistory });
      notify('CRM note recorded.', 'success');
      loadPlayers();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, club, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">All CRM Statuses</option>
            <option value="active">Active</option>
            <option value="vip">VIP / Seeded</option>
            <option value="inactive">Inactive</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Add CRM Player
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreatePlayer}
          className="bg-white rounded-2xl border border-emerald-200 p-5 grid grid-cols-1 sm:grid-cols-4 gap-3"
        >
          <input
            type="text"
            required
            placeholder="Full Name *"
            value={newPlayer.fullName}
            onChange={(e) => setNewPlayer({ ...newPlayer, fullName: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            required
            placeholder="Email *"
            value={newPlayer.email}
            onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Club"
            value={newPlayer.club}
            onChange={(e) => setNewPlayer({ ...newPlayer, club: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={newPlayer.tags}
            onChange={(e) => setNewPlayer({ ...newPlayer, tags: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={newPlayer.gender}
            onChange={(e) => setNewPlayer({ ...newPlayer, gender: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            value={newPlayer.ageGroup}
            onChange={(e) => setNewPlayer({ ...newPlayer, ageGroup: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            {['U15', 'U19', 'Open', '35+', '45+'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={newPlayer.crmStatus}
            onChange={(e) => setNewPlayer({ ...newPlayer, crmStatus: e.target.value })}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="active">Active</option>
            <option value="vip">VIP</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-navy-900 text-white text-xs font-bold px-4 py-2"
          >
            Save Player Record
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3">Club / Div</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {players.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer hover:bg-emerald-50/40 transition ${
                      selected?._id === p._id ? 'bg-emerald-50/80' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{p.fullName}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.club} • {p.ageGroup}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.crm?.tags || []).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.crm?.status || 'active'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5">
          {!selected ? (
            <p className="text-sm text-slate-500 py-12 text-center">
              Select a player from the CRM table to manage tags, contact preferences, notes, and
              registration history.
            </p>
          ) : (
            <div className="space-y-5">
              <form onSubmit={handleUpdateSelected} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {selected.fullName}
                  </h3>
                  <span className="font-mono text-xs text-slate-500">{selected.playerCode}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">CRM Status</label>
                    <select
                      value={selected.crm?.status || 'active'}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          crm: { ...selected.crm, status: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="vip">VIP</option>
                      <option value="inactive">Inactive</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Club</label>
                    <input
                      type="text"
                      value={selected.club || ''}
                      onChange={(e) => setSelected({ ...selected, club: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="font-semibold text-slate-600 block mb-1">
                    CRM Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={(selected.crm?.tags || []).join(', ')}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        crm: {
                          ...selected.crm,
                          tags: e.target.value.split(',').map((t) => t.trim()),
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5"
                  />
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-slate-700 pt-1">
                  {['emailUpdates', 'smsUpdates', 'marketing'].map((pref) => (
                    <label key={pref} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(selected.crm?.contactPreferences?.[pref])}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            crm: {
                              ...selected.crm,
                              contactPreferences: {
                                ...selected.crm?.contactPreferences,
                                [pref]: e.target.checked,
                              },
                            },
                          })
                        }
                        className="rounded text-emerald-600"
                      />
                      <span className="capitalize">{pref.replace('Updates', '')} Opt-in</span>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Update CRM Record
                </button>
              </form>

              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Organizer Notes ({selected.crm?.notes?.length || 0})
                </h4>
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add internal player note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>
                <div className="max-h-36 overflow-y-auto space-y-2">
                  {(selected.crm?.notes || []).map((n, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                      <p className="text-slate-800">{n.text}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By {n.authorName}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registration History ({selected.registrationHistory?.length || 0})
                </h4>
                {(selected.registrationHistory || []).map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{r.tournament?.name}</p>
                      <p className="text-slate-500">
                        {r.categoryName} • {r.registrationNumber}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
