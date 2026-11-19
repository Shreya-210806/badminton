import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  LogIn,
  Menu,
  X,
  Shield,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tournaments', path: '/tournaments' },
    { name: 'Players', path: '/players' },
    { name: 'Rankings', path: '/rankings' },
    { name: 'Live Scores', path: '/live-scores' },
    { name: 'About Us', path: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F5F4EF]/95 backdrop-blur-md border-b border-[#E8DCC7] shadow-sm transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#5B806B] flex items-center justify-center text-white shadow-md shadow-[#5B806B]/25 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-[#F5F4EF]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl tracking-tight text-[#243044]">
                  Shuttle<span className="text-[#5B806B]">Pulse</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#5B806B]/15 text-[#5B806B] border border-[#5B806B]/30">
                  Thane District
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#243044]/70 tracking-wide">
                Thane Badminton Association
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#243044] bg-[#E8DCC7] border border-[#C5A98D] font-bold shadow-xs'
                      : 'text-[#243044]/80 hover:text-[#243044] hover:bg-[#E8DCC7]/50'
                  }`
                }
              >
                {link.name === 'Live Scores' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B806B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5B806B]"></span>
                  </span>
                )}
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Action: Player Account or Login & Admin Link */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' || user.role === 'organizer' ? (
                  <Link
                    to="/admin/overview"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#243044] hover:bg-[#1b2535] text-[#F5F4EF] text-xs font-bold shadow-sm transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#C5A98D]" />
                    <span>Admin Panel</span>
                  </Link>
                ) : user.role === 'referee' ? (
                  <Link
                    to="/referee"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#243044] hover:bg-[#1b2535] text-[#F5F4EF] text-xs font-bold shadow-sm transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#C5A98D]" />
                    <span>Referee Console</span>
                  </Link>
                ) : (
                  <Link
                    to="/player/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2 bg-[#5B806B] hover:bg-[#4a6b57] rounded-xl text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>Player Dashboard ({user.name})</span>
                  </Link>
                )}

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-[#243044]/60 hover:text-[#243044] hover:bg-[#E8DCC7]/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                {/* PROMINENT HIGH-CONTRAST LOGIN / REGISTER BUTTON */}
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white text-xs font-bold shadow-md shadow-[#5B806B]/30 hover:shadow-lg transition-all border border-[#5B806B]"
                >
                  <LogIn className="w-4 h-4 text-white" />
                  <span>Login / Register</span>
                </Link>

                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#C5A98D]/20 hover:bg-[#C5A98D]/40 border border-[#C5A98D] text-[#243044] text-xs font-bold transition-all shadow-2xs"
                  title="Staff & Referee Operations Portal"
                >
                  <Shield className="w-3.5 h-3.5 text-[#5B806B]" />
                  <span>Admin</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#5B806B] text-white text-xs font-bold shadow-sm"
              title="Player Login / Register"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#243044] hover:bg-[#E8DCC7]/50 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E8DCC7] bg-[#F5F4EF] px-4 pt-3 pb-6 space-y-2 animate-fade-up">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-[#E8DCC7] text-[#243044] font-bold border border-[#C5A98D]'
                    : 'text-[#243044]/80 hover:bg-[#E8DCC7]/40'
                }`
              }
            >
              <span className="flex items-center gap-2">
                {link.name}
                {link.name === 'Live Scores' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5B806B]/20 text-[#5B806B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B806B] animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </span>
              <ChevronRight className="w-4 h-4 text-[#C5A98D]" />
            </NavLink>
          ))}

          <div className="pt-3 border-t border-[#E8DCC7] space-y-2">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-[#E8DCC7]">
                <span className="text-xs font-bold text-[#243044]">{user.name} ({user.role})</span>
                <button onClick={logout} className="text-xs font-semibold text-rose-600">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white font-bold text-sm shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Player Login / Register
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-[#243044] font-bold text-xs border border-[#C5A98D]"
                >
                  <Shield className="w-3.5 h-3.5 text-[#5B806B]" />
                  Staff & Admin Panel
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
