import React, { useEffect, useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CommunicationsPage() {
  const { notify } = useAuth();
  const [history, setHistory] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [recipientPreview, setRecipientPreview] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    audience: 'all',
    tournamentId: '',
  });

  const load = useCallback(async () => {
    const [cRes, tRes] = await Promise.all([
      apiRequest('/crm/communications'),
      apiRequest('/crm/tournaments'),
    ]);
    setHistory(cRes.communications || []);
    setTournaments(tRes.tournaments || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams({ audience: form.audience });
    if (form.tournamentId) params.set('tournamentId', form.tournamentId);
    apiRequest(`/crm/communications/preview?${params.toString()}`)
      .then((res) => setRecipientPreview(res.recipientCount || 0))
      .catch(() => {});
  }, [form.audience, form.tournamentId]);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/crm/communications', {
        method: 'POST',
        body: form,
      });
      notify(res.message, 'success');
      setForm({ ...form, title: '', message: '' });
      setShowPreview(false);
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up">
      <form
        onSubmit={handleSend}
        className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
      >
        <h2 className="font-display text-lg font-bold text-slate-900">
          Compose Announcement & Broadcast
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Recipient Segment</label>
            <select
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white text-sm"
            >
              <option value="all">All Active Accounts</option>
              <option value="players">Opted-In Players</option>
              <option value="tournament">Specific Tournament Entrants</option>
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Notice Category</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white text-sm"
            >
              <option value="announcement">General Announcement</option>
              <option value="schedule">Schedule / Court Alert</option>
              <option value="result">Results Bulletin</option>
            </select>
          </div>
        </div>

        {form.audience === 'tournament' && (
          <div>
            <label className="text-xs font-semibold block mb-1">Target Tournament</label>
            <select
              required
              value={form.tournamentId}
              onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white text-sm"
            >
              <option value="">-- Choose Tournament --</option>
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold block mb-1">Headline *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Courts 1–4 Warmup Opens at 8:00 AM"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Message Body *</label>
          <textarea
            rows={4}
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Write clear instructions for players, coaches, and officials..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>

        {showPreview && (
          <div className="rounded-xl bg-navy-950 text-white p-4 text-xs space-y-1">
            <span className="text-emerald-400 uppercase font-bold">
              Live Preview ({recipientPreview} recipients)
            </span>
            <p className="font-bold text-sm">{form.title || 'Untitled Headline'}</p>
            <p className="text-slate-300">{form.message || 'No body text yet.'}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
          >
            {showPreview ? 'Hide Preview' : `Preview (${recipientPreview} Recipients)`}
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch Update
          </button>
        </div>
      </form>

      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Sent Announcements & Contact Inquiries
        </h2>
        <div className="space-y-3 max-h-[460px] overflow-y-auto">
          {history.map((c) => (
            <div key={c._id} className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase text-emerald-700">
                  {c.type} • {c.audience} ({c.recipientCount})
                </span>
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="font-bold text-sm text-slate-900 mt-1">{c.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{c.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
