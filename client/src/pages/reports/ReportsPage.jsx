import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { apiRequest, downloadCsvReport } from '../../api/client';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('registrations');
  const [reportData, setReportData] = useState({ headers: [], rows: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/crm/reports/${reportType}`)
      .then((res) => setReportData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reportType]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'registrations', label: 'Registrations Report' },
            { id: 'players', label: 'Players & Rankings' },
            { id: 'revenue', label: 'Revenue & Payments' },
            { id: 'matches', label: 'Matches & Umpires' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setReportType(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                reportType === t.id
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            downloadCsvReport(
              `/crm/reports/${reportType}?format=csv`,
              `shuttlepulse-${reportType}-report.csv`
            )
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
        >
          <Download className="w-4 h-4" />
          Download {reportType.toUpperCase()} CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(reportData.summary || {}).map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl border border-slate-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {k.replace(/([A-Z])/g, ' $1')}
            </span>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">
              {k.toLowerCase().includes('total') && reportType === 'revenue' ? `₹${Number(v || 0).toLocaleString('en-IN')}` : v}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Compiling report...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500">
                <tr>
                  {(reportData.headers || []).map((h) => (
                    <th key={h.key} className="px-4 py-3 whitespace-nowrap">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(reportData.rows || []).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    {reportData.headers.map((h) => (
                      <td key={h.key} className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                        {row[h.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
