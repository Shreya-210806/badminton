import React from 'react';

const STYLES = {
  open: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-300',
  live: 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse',
  ongoing: 'bg-sky-100 text-sky-800 border-sky-200',
  scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
  closing_soon: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  pending_partner: 'bg-amber-100 text-amber-800 border-amber-200',
  waitlisted: 'bg-purple-100 text-purple-800 border-purple-200',
  waitlist_only: 'bg-purple-100 text-purple-800 border-purple-200',
  vip: 'bg-amber-100 text-amber-900 border-amber-300',
  unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  failed: 'bg-rose-100 text-rose-800 border-rose-200',
  suspended: 'bg-rose-100 text-rose-800 border-rose-200',
  flagged: 'bg-rose-100 text-rose-800 border-rose-200',
  closed: 'bg-slate-200 text-slate-700 border-slate-300',
  archived: 'bg-slate-200 text-slate-600 border-slate-300',
  draft: 'bg-slate-100 text-slate-600 border-slate-300',
};

export default function StatusBadge({ status = '' }) {
  const key = String(status).toLowerCase();
  const cls = STYLES[key] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = String(status).replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}
    >
      {key === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />}
      {label}
    </span>
  );
}
