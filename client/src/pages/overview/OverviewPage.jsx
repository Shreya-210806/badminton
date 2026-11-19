import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Trophy,
  ClipboardList,
  CreditCard,
  Activity,
  DollarSign,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import AnimatedCounter from '../../components/AnimatedCounter';
import StatusBadge from '../../components/StatusBadge';

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/crm/overview')
      .then((res) => setData(res))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const m = data.metrics;
  const kpis = [
    {
      label: 'CRM Players',
      value: m.totalPlayers,
      icon: Users,
      accent: 'text-emerald-600 bg-emerald-50',
      to: '/player-crm',
    },
    {
      label: 'Active Tournaments',
      value: m.activeTournaments,
      icon: Trophy,
      accent: 'text-sky-600 bg-sky-50',
      to: '/tournaments',
    },
    {
      label: 'Registrations',
      value: m.totalRegistrations,
      icon: ClipboardList,
      accent: 'text-indigo-600 bg-indigo-50',
      to: '/registrations',
    },
    {
      label: 'Pending Payments',
      value: m.pendingPayments,
      icon: CreditCard,
      accent: 'text-amber-600 bg-amber-50',
      to: '/payments',
    },
    {
      label: 'Paid Revenue',
      value: m.totalRevenue,
      prefix: '₹',
      icon: DollarSign,
      accent: 'text-emerald-700 bg-emerald-100',
      to: '/reports',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="block bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-400 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {item.label}
                </span>
                <div className={`p-2 rounded-xl ${item.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-2">
                <AnimatedCounter value={item.value} prefix={item.prefix || ''} />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Upcoming & Live Court Schedule
            </h2>
            <Link to="/match-scoring" className="text-xs font-bold text-emerald-700 hover:underline">
              Open Match Scoring →
            </Link>
          </div>
          <div className="space-y-2.5">
            {(data.upcomingMatches || []).map((match) => (
              <div
                key={match._id}
                className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900">{match.matchCode}</span> •{' '}
                  <span className="font-semibold text-emerald-700">{match.court}</span> •{' '}
                  <span className="text-slate-600">{match.categoryName}</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {match.sideA?.label} vs {match.sideB?.label}
                  </p>
                </div>
                <StatusBadge status={match.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent Audit Activity</h2>
            <Link to="/audit-log" className="text-xs font-bold text-emerald-700 hover:underline">
              Full Audit Log →
            </Link>
          </div>
          <div className="space-y-3">
            {(data.recentAudit || []).slice(0, 6).map((log) => (
              <div key={log._id} className="border-b border-slate-100 pb-2.5 last:border-0 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-slate-700">
                    {log.actorName} ({log.actorRole})
                  </span>
                  <span>
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{log.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
