import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function PaymentTrackingPage() {
  const { notify } = useAuth();
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    const q = statusFilter ? `?status=${statusFilter}` : '';
    const res = await apiRequest(`/crm/payments${q}`);
    setPayments(res.payments || []);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const updatePayment = async (id, patch) => {
    try {
      await apiRequest(`/crm/payments/${id}`, { method: 'PATCH', body: patch });
      notify('Payment status synced with registration.', 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900">
        <span className="inline-flex items-center gap-2 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          PCI-Safe Ledger: Only payment amounts, methods, transfer references, and statuses are
          stored. Card details are blocked at the API layer.
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-emerald-300 px-3 py-1.5 bg-white text-slate-800 font-semibold"
        >
          <option value="">All Payments</option>
          <option value="pending">Pending Verification</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Receipt / Reg</th>
                <th className="px-4 py-3">Player & Event</th>
                <th className="px-4 py-3">Amount & Method</th>
                <th className="px-4 py-3">Reference Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3 font-mono text-xs">
                    <p className="font-bold text-slate-900">{p.receiptNumber}</p>
                    <p className="text-slate-500">{p.registration?.registrationNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{p.player?.fullName}</p>
                    <p className="text-xs text-slate-500">{p.tournament?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-extrabold text-slate-900 text-sm">₹{Number(p.amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-slate-500 capitalize">{p.method.replace('_', ' ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={p.referenceCode || ''}
                      placeholder="Add ref..."
                      onBlur={(e) => {
                        if (e.target.value !== (p.referenceCode || '')) {
                          updatePayment(p._id, { referenceCode: e.target.value });
                        }
                      }}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono w-36"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    {p.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => updatePayment(p._id, { status: 'paid' })}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                      >
                        Mark Paid
                      </button>
                    )}
                    {p.status === 'paid' && (
                      <button
                        type="button"
                        onClick={() => updatePayment(p._id, { status: 'refunded' })}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                      >
                        Refund
                      </button>
                    )}
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
