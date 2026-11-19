import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying staff credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto my-20 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Insufficient Role Permissions</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your account role (<strong className="uppercase">{user.role}</strong>) does not have
          access to this CRM module. Required role: {allowedRoles.join(' or ')}.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          {user.role === 'referee' && (
            <Link
              to="/referee"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
            >
              Go to Referee Console
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  return children;
}
