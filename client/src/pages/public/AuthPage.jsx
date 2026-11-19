import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regClub, setRegClub] = useState('Dadoji Konddev Stadium, Thane');

  const thaneClubsList = [
    'Dadoji Konddev Stadium, Thane (West)',
    'Dombivli Gymkhana Badminton Wing',
    'Subhash Chandra Bose Stadium, Kalyan (West)',
    'Kalwa Smashers Sports Club',
    'Bhiwandi Racquet Club',
    'Thane Central Shuttlers Academy',
    'Mumbra Youth Sports Academy',
    'Ambernath Badminton Club',
    'Badlapur Sports Complex',
    'Independent / Other Club (Thane District)',
  ];

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(loginEmail, loginPassword);
      if (u.role === 'admin' || u.role === 'organizer') {
        navigate('/admin/overview', { replace: true });
      } else if (u.role === 'referee') {
        navigate('/referee', { replace: true });
      } else {
        navigate('/player/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        gender: regGender,
        club: regClub || 'Dadoji Konddev Stadium, Thane',
        skillLevel: 'Intermediate',
      });
      navigate('/player/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col font-sans selection:bg-[#5B806B] selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E8DCC7] shadow-xl shadow-[#C5A98D]/20">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#5B806B]/15 text-[#5B806B] flex items-center justify-center mx-auto mb-3 border border-[#5B806B]/30 shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#243044] tracking-tight">
              {isLogin ? 'Thane Player Sign In' : 'Register as Thane Player'}
            </h1>
            <p className="text-xs text-[#243044]/70 mt-1">
              {isLogin
                ? 'Enter your credentials to manage your Thane tournament entries'
                : 'Join the Thane District Badminton circuit & track your district ranking'}
            </p>
          </div>

          {/* Toggle Tabs (Login vs Register) */}
          <div className="flex p-1 bg-[#F5F4EF] rounded-2xl mb-6 border border-[#E8DCC7]">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isLogin
                  ? 'bg-white text-[#243044] shadow-sm'
                  : 'text-[#243044]/60 hover:text-[#243044]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isLogin
                  ? 'bg-white text-[#243044] shadow-sm'
                  : 'text-[#243044]/60 hover:text-[#243044]'
              }`}
            >
              New Registration
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#243044] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#C5A98D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="player@thanebadminton.org"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-sm text-[#243044] placeholder-[#243044]/40 focus:outline-none focus:border-[#5B806B] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#243044] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#C5A98D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-sm text-[#243044] placeholder-[#243044]/40 focus:outline-none focus:border-[#5B806B] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white font-bold text-sm shadow-md shadow-[#5B806B]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-[#5B806B]"
              >
                <span>{loading ? 'Signing in...' : 'Sign In as Player'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#243044] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditya Shinde"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-sm text-[#243044] placeholder-[#243044]/40 focus:outline-none focus:border-[#5B806B] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#243044] mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="aditya@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-sm text-[#243044] placeholder-[#243044]/40 focus:outline-none focus:border-[#5B806B] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#243044] mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-sm text-[#243044] placeholder-[#243044]/40 focus:outline-none focus:border-[#5B806B] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#243044] mb-1">Gender</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4EF] border border-[#E8DCC7] rounded-xl text-sm text-[#243044] focus:outline-none focus:border-[#5B806B] transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#243044] mb-1">
                  Thane Club / Academy / Stadium
                </label>
                <select
                  value={regClub}
                  onChange={(e) => setRegClub(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-sm text-[#243044] focus:outline-none focus:border-[#5B806B] transition-all"
                >
                  {thaneClubsList.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white font-bold text-sm shadow-md shadow-[#5B806B]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-[#5B806B]"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Player Registration'}</span>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </button>
            </form>
          )}

          {/* Staff Login Link */}
          <div className="mt-8 pt-6 border-t border-[#E8DCC7] flex items-center justify-between text-xs">
            <span className="text-[#243044]/70">Tournament Official or Referee?</span>
            <Link
              to="/admin/login"
              className="font-bold text-[#5B806B] hover:text-[#4a6b57] inline-flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin / Staff Portal →</span>
            </Link>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
