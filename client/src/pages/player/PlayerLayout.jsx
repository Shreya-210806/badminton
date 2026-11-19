import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  FileText,
  CalendarCheck,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Radio,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

export default function PlayerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await apiRequest('/player/notifications');
      if (res.notifications) {
        const unread = res.notifications.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to refresh notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    window.addEventListener('focus', fetchUnread);
    window.addEventListener('player-data-updated', fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchUnread);
      window.removeEventListener('player-data-updated', fetchUnread);
    };
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/player/dashboard', icon: LayoutDashboard },
    { name: 'Available Tournaments', path: '/player/tournaments', icon: Trophy },
    { name: 'My Applications', path: '/player/applications', icon: FileText },
    { name: 'My Tournaments', path: '/player/my-tournaments', icon: CalendarCheck },
    { name: 'Tournament Updates', path: '/player/updates', icon: Radio },
    {
      name: 'Notifications',
      path: '/player/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { name: 'My Profile', path: '/player/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col md:flex-row font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#F5F4EF] border-b border-[#E8DCC7] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#5B806B] flex items-center justify-center text-white font-bold">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-base text-[#243044]">
            Shuttle<span className="text-[#5B806B]">Pulse</span>
          </span>
          <span className="text-[10px] bg-[#5B806B]/15 text-[#5B806B] font-bold px-1.5 py-0.5 rounded">
            Player
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/player/notifications"
            className="p-2 rounded-xl bg-white border border-[#E8DCC7] text-[#243044] relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5B806B] text-white text-[9px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-white border border-[#E8DCC7] text-[#243044]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#F5F4EF] border-r border-[#E8DCC7] flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand & Badge */}
          <div className="p-6 border-b border-[#E8DCC7]">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#5B806B] flex items-center justify-center text-white shadow-md shadow-[#5B806B]/25 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 text-[#F5F4EF]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-lg tracking-tight text-[#243044]">
                    Shuttle<span className="text-[#5B806B]">Pulse</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#5B806B]/15 text-[#5B806B]">
                    Player
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#243044]/70">
                  Thane District Badminton
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Items (Requirement 9: 1 to 8) */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#5B806B] text-white shadow-md shadow-[#5B806B]/25 font-extrabold'
                        : 'text-[#243044]/80 hover:text-[#243044] hover:bg-[#E8DCC7]/50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Player Info, Public Site link & Logout */}
        <div className="p-4 border-t border-[#E8DCC7] space-y-3">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#243044]/70 hover:text-[#243044] hover:bg-[#E8DCC7]/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#5B806B]" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px] font-bold text-[#5B806B]">Home →</span>
          </Link>

          <div className="p-3 bg-white rounded-2xl border border-[#E8DCC7] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#5B806B]/15 text-[#5B806B] flex items-center justify-center font-display font-black text-xs shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || 'PL'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-[#243044] truncate">{user?.name}</div>
                <div className="text-[10px] text-[#243044]/60 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#243044]/60 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane with Top Navigation Bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#F5F4EF]/80 backdrop-blur-md border-b border-[#E8DCC7] sticky top-0 z-30">
          <div>
            <h2 className="text-sm font-extrabold text-[#243044]">
              Thane District Player Hub
            </h2>
            <p className="text-[11px] text-[#243044]/60">
              Dadoji Konddev Stadium & TDBA Operations Console
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/player/notifications"
              className="relative p-2.5 rounded-xl bg-white border border-[#E8DCC7] hover:border-[#5B806B] text-[#243044] transition-all shadow-xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-[#243044]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5B806B] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/player/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E8DCC7] hover:border-[#5B806B] transition-all shadow-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-[#5B806B] text-white flex items-center justify-center text-[11px] font-bold">
                {user?.name?.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-[#243044]">{user?.name}</span>
            </Link>
          </div>
        </header>

        {/* Child Page Rendering Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet context={{ unreadCount, setUnreadCount }} />
        </main>
      </div>
    </div>
  );
}
