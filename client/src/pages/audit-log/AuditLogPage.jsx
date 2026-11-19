import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (entityType) params.set('entityType', entityType);
    if (search) params.set('search', search);
    apiRequest(`/crm/audit-logs?${params.toString()}`)
      .then((res) => setLogs(res.logs || []))
      .catch(() => {});
  }, [entityType, search]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search actor, action, or record..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">All Record Types</option>
          {[
            'Tournament',
            'Player',
            'Registration',
            'Team',
            'Match',
            'Payment',
            'Notification',
            'Settings',
            'User',
          ].map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {l.actorName}{' '}
                    <span className="uppercase text-[10px] text-emerald-700">({l.actorRole})</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{l.action}</td>
                  <td className="px-4 py-3 text-slate-600">{l.entityType}</td>
                  <td className="px-4 py-3 text-slate-700">{l.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
