import React, { useEffect, useState, useCallback } from 'react';
import { Download, Check, X, Clock } from 'lucide-react';
import { apiRequest, downloadCsvReport } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function RegistrationManagementPage() {
  const { notify } = useAuth();
  const [regs, setRegs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res = await apiRequest(`/crm/registrations?${params.toString()}`);
    setRegs(res.registrations || []);
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const updateReg = async (id, patch) => {
    try {
      await apiRequest(`/crm/registrations/${id}`, { method: 'PATCH', body: patch });
      notify('Registration updated.', 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search Reg #, player, partner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadCsvReport('/crm/reports/registrations?format=csv', 'registrations-export.csv')
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Reg # / Tournament</th>
                <th className="px-4 py-3">Player / Partner</th>
                <th className="px-4 py-3">Seed</th>
                <th className="px-4 py-3">Status & Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regs.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-slate-900">
                      {r.registrationNumber}
                    </p>
                    <p className="text-xs text-slate-600">
                      {r.tournament?.name} • <strong>{r.categoryCode}</strong>
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{r.player?.fullName}</p>
                    {r.partnerDetails?.name && (
                      <p className="text-xs text-emerald-700">
                        Partner: {r.partnerDetails.name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="1"
                      max="16"
                      placeholder="-"
                      defaultValue={r.seedNumber || ''}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (String(r.seedNumber || '') !== val) {
                          updateReg(r._id, { seedNumber: val });
                        }
                      }}
                      className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-xs text-center"
                    />
                  </td>
                  <td className="px-4 py-3 space-x-1.5">
                    <StatusBadge status={r.status} />
                    <StatusBadge status={r.paymentStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        title="Approve"
                        onClick={() => updateReg(r._id, { status: 'approved' })}
                        className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Waitlist"
                        onClick={() => updateReg(r._id, { status: 'waitlisted' })}
                        className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Reject"
                        onClick={() => updateReg(r._id, { status: 'rejected' })}
                        className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
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
