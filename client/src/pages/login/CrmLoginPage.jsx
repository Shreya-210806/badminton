import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DEMO_STAFF = [
  { label: 'Admin (Director)', email: 'admin@shuttlepulse.org', pass: 'Admin@123' },
  { label: 'Organizer (CRM)', email: 'organizer@shuttlepulse.org', pass: 'Organizer@123' },
  { label: 'Referee (Court 1-2)', email: 'referee@shuttlepulse.org', pass: 'Referee@123' },
  { label: 'Referee (Court 3-4)', email: 'referee2@shuttlepulse.org', pass: 'Referee@123' },
];

export default function CrmLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@shuttlepulse.org');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === 'referee') {
        navigate('/referee', { replace: true });
      } else if (u.role === 'admin' || u.role === 'organizer') {
        navigate('/admin/overview', { replace: true });
      } else {
        setError('Access restricted to Admin, Organizer, and Referee staff accounts.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 court-pattern flex items-center justify-center p-4 relative">
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-slate-200 animate-fade-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-navy-900 text-emerald-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              ShuttlePulse CRM
            </h1>
            <p className="text-xs text-slate-500">Organizer, Admin & Referee Operations Console</p>
          </div>
        </div>

        <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            1-Click Demo Staff Roles
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_STAFF.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setEmail(s.email);
                  setPassword(s.pass);
                }}
                className="text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-xs font-semibold text-slate-700"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition"
          >
            {loading ? 'Authenticating...' : 'Sign In to CRM Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
