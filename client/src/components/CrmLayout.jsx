import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  ClipboardList,
  Users2,
  GitBranch,
  Activity,
  CreditCard,
  Megaphone,
  BarChart3,
  History,
  Settings,
  Gavel,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ADMIN_NAV_ITEMS = [
  { to: '/overview', label: 'Overview Metrics', icon: LayoutDashboard },
  { to: '/player-crm', label: 'Player CRM', icon: Users },
  { to: '/crm-tournaments', label: 'Tournament Management', icon: Trophy },
  { to: '/registrations', label: 'Registrations', icon: ClipboardList },
  { to: '/doubles-teams', label: 'Doubles Teams', icon: Users2 },
  { to: '/draws-fixtures', label: 'Draws & Fixtures', icon: GitBranch },
  { to: '/match-scoring', label: 'Match Scoring', icon: Activity },
  { to: '/payments', label: 'Payment Tracking', icon: CreditCard },
  { to: '/communications', label: 'Communications', icon: Megaphone },
  { to: '/reports', label: 'Reports & CSV', icon: BarChart3 },
  { to: '/audit-log', label: 'Audit Log', icon: History },
  { to: '/settings', label: 'Settings & Staff', icon: Settings },
];

export default function CrmLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminOrOrganizer = user?.role === 'admin' || user?.role === 'organizer';

  const navItems = isAdminOrOrganizer
    ? [...ADMIN_NAV_ITEMS, { to: '/referee', label: 'Referee Court Desk', icon: Gavel }]
    : [{ to: '/referee', label: 'Referee Court Desk', icon: Gavel }];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:shrink-0 lg:flex-col bg-navy-950 text-slate-200 border-r border-slate-800">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-navy-950 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display font-bold text-white leading-tight">ShuttlePulse CRM</p>
            <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
              {user?.role || 'Staff'} Console
            </p>
          </div>
        </div>

        <nav
          aria-label="CRM sections"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-500 text-navy-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-navy-900/50">
          <div className="mb-3 px-1">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar & Drawer */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-base sm:text-lg font-bold text-slate-900">
                Tournament & Club Operations CRM
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                BWF 3×21 Live Scoring • Player Directory • Registrations • PCI-Safe Payment Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              {user?.role}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-navy-950/70 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-navy-950 text-slate-200 flex flex-col h-full z-10 shadow-2xl">
              <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-navy-950 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-white text-sm">ShuttlePulse CRM</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-emerald-500 text-navy-950 font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
