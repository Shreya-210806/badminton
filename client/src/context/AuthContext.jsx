import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchSession = useCallback(async () => {
    const token = localStorage.getItem('sp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiRequest('/auth/me');
      setUser(res.user);
      setPlayer(res.player || null);
    } catch (_err) {
      localStorage.removeItem('sp_token');
      setUser(null);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('sp_token', res.token);
    setUser(res.user);
    setPlayer(res.player || null);
    notify('Welcome!', 'success');
    return res.user;
  };

  const signup = async (payload) => {
    const res = await apiRequest('/auth/signup', {
      method: 'POST',
      body: payload,
    });
    localStorage.setItem('sp_token', res.token);
    setUser(res.user);
    setPlayer(res.player || null);
    notify('Player account created! Ready to enter tournaments.', 'success');
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('sp_token');
    setUser(null);
    setPlayer(null);
    notify('Signed out safely.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        player,
        setPlayer,
        loading,
        login,
        signup,
        logout,
        refreshSession: fetchSession,
        notify,
      }}
    >
      {children}
      {/* Accessible Toast Region */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-xl border text-sm font-medium animate-fade-up ${
              t.type === 'error'
                ? 'bg-rose-950 text-rose-50 border-rose-700'
                : t.type === 'info'
                ? 'bg-navy-900 text-slate-100 border-slate-700'
                : 'bg-navy-900 text-white border-emerald-500/60'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : t.type === 'info' ? (
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
