import React, { useEffect, useState, useCallback } from 'react';
import { Shield, UserPlus } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function SettingsPage() {
  const { user, notify } = useAuth();
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'referee',
    staffTitle: '',
  });

  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    const res = await apiRequest('/crm/settings');
    setSettings(res.settings);
    setStaff(res.staff || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/crm/settings', { method: 'PUT', body: settings });
      notify('Organization profile & branding saved.', 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/crm/staff', { method: 'POST', body: newStaff });
      notify('Staff account provisioned!', 'success');
      setNewStaff({ name: '', email: '', password: '', role: 'referee', staffTitle: '' });
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const toggleStaffStatus = async (s) => {
    try {
      const nextStatus = s.status === 'active' ? 'suspended' : 'active';
      await apiRequest(`/crm/staff/${s._id}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      notify(`Account ${nextStatus}.`, 'info');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (!settings) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up">
      <form
        onSubmit={handleSaveOrg}
        className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">
            Organization Profile & Branding
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="font-semibold block mb-1">Organization Name</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.organizationName || ''}
              onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Support Email</label>
            <input
              type="email"
              disabled={!isAdmin}
              value={settings.supportEmail || ''}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Support Phone</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.supportPhone || ''}
              onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold block mb-1">Headquarters</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.headquarters || ''}
              onChange={(e) => setSettings({ ...settings, headquarters: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold block mb-1">Player Payment Instructions</label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={settings.paymentInstructions || ''}
              onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {isAdmin ? (
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            Save Organization Settings
          </button>
        ) : (
          <p className="text-xs text-amber-700">
            Only Admin accounts can modify organization-wide settings and staff roles.
          </p>
        )}
      </form>

      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">
            Admin, Organizer & Referee Accounts
          </h2>
        </div>

        {isAdmin && (
          <form onSubmit={handleCreateStaff} className="grid grid-cols-2 gap-2.5 text-xs">
            <input
              type="text"
              required
              placeholder="Staff Name *"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <input
              type="email"
              required
              placeholder="Staff Email *"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Temp Password *"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <select
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              <option value="referee">Referee / Scorer</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
            <input
              type="text"
              placeholder="Title (e.g., Court 3 Umpire)"
              value={newStaff.staffTitle}
              onChange={(e) => setNewStaff({ ...newStaff, staffTitle: e.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-xl bg-navy-900 text-white font-bold px-4 py-2"
            >
              Create Staff Account
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {staff.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">
                  {s.name}{' '}
                  <span className="uppercase text-[10px] font-extrabold text-emerald-700">
                    [{s.role}]
                  </span>
                </p>
                <p className="text-slate-500">
                  {s.email} {s.staffTitle ? `• ${s.staffTitle}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                {isAdmin && s._id !== user?.id && (
                  <button
                    type="button"
                    onClick={() => toggleStaffStatus(s)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold hover:bg-slate-100"
                  >
                    {s.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
