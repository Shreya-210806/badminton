
import React, { useEffect, useState, useCallback } from 'react';
import { Plus, X, ImagePlus } from 'lucide-react';
import { apiRequest, uploadFile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';

const emptyTournament = {
  name: '',
  subtitle: '',
  bannerImage:
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=80',
  venue: '',
  city: '',
  startDate: '2026-12-10',
  endDate: '2026-12-12',
  registrationDeadline: '2026-12-05',
  status: 'published',
  registrationStatus: 'open',
  prizePool: 5000,
  courtsCount: 6,
  description: '',
  rules:
    'Official BWF 3x21 rally point scoring.\nReport to Court Marshal 20 minutes before match time.',
  categories: [
    {
      code: 'MS-OPEN',
      name: "Men's Singles Open",
      format: 'singles',
      gender: 'Male',
      ageGroup: 'Open',
      fee: 40,
      maxEntries: 16,
    },
    {
      code: 'XD-OPEN',
      name: 'Mixed Doubles Open',
      format: 'doubles',
      gender: 'Mixed',
      ageGroup: 'Open',
      fee: 65,
      maxEntries: 16,
    },
  ],
};

export default function TournamentManagementPage() {
  const { notify } = useAuth();

  const [tournaments, setTournaments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiRequest('/crm/tournaments');
      setTournaments(res.tournaments || []);
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(bannerFile);
    setBannerPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [bannerFile]);

  const startCreate = () => {
    setBannerFile(null);
    setEditing({ ...emptyTournament, isNew: true });
  };

  const startEdit = (t) => {
    setBannerFile(null);

    setEditing({
      ...t,
      startDate: t.startDate?.slice(0, 10) || '',
      endDate: t.endDate?.slice(0, 10) || '',
      registrationDeadline: t.registrationDeadline?.slice(0, 10) || '',
      rules: Array.isArray(t.rules) ? t.rules.join('\n') : t.rules || '',
      isNew: false,
    });
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      notify('Please select a JPG, PNG or WEBP image.', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify('Image size must be 5 MB or less.', 'error');
      e.target.value = '';
      return;
    }

    setBannerFile(file);
  };

  const addCategoryRow = () => {
    setEditing((prev) => ({
      ...prev,
      categories: [
        ...(prev.categories || []),
        {
          code: `CAT-${(prev.categories?.length || 0) + 1}`,
          name: 'New Division',
          format: 'singles',
          gender: 'Any',
          ageGroup: 'Open',
          fee: 35,
          maxEntries: 16,
        },
      ],
    }));
  };

  const updateCat = (idx, field, val) => {
    setEditing((prev) => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === idx ? { ...c, [field]: val } : c
      ),
    }));
  };

  const removeCat = (idx) => {
    if ((editing.categories || []).length <= 1) return;

    setEditing((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (uploading) return;

    setUploading(true);

    try {
      let bannerImage = editing.bannerImage;

      // Upload the selected banner to S3 before saving the tournament.
      if (bannerFile) {
        const uploadResult = await uploadFile(
          bannerFile,
          'tournament-images'
        );

        bannerImage = uploadResult.key;
      }

      const payload = {
        ...editing,
        bannerImage,
        categories: editing.categories.map((c) => ({
          ...c,
          fee: Number(c.fee) || 0,
          maxEntries: Number(c.maxEntries) || 16,
        })),
      };

      // Do not send UI-only state to the backend.
      delete payload.isNew;

      if (editing.isNew) {
        await apiRequest('/crm/tournaments', {
          method: 'POST',
          body: payload,
        });

        notify('Tournament created successfully!', 'success');
      } else {
        await apiRequest(`/crm/tournaments/${editing._id}`, {
          method: 'PUT',
          body: payload,
        });

        notify('Tournament updated successfully!', 'success');
      }

      setEditing(null);
      setBannerFile(null);
      await load();
    } catch (err) {
      notify(err.message || 'Unable to save tournament.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (t, newStatus) => {
    try {
      await apiRequest(`/crm/tournaments/${t._id}`, {
        method: 'PUT',
        body: { status: newStatus },
      });

      notify(`Tournament marked as ${newStatus}.`, 'info');
      setConfirmArchive(null);
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const cancelEditing = () => {
    setEditing(null);
    setBannerFile(null);
    setBannerPreview('');
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Tournament Management ({tournaments.length})
        </h2>

        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Create Tournament
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-md space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">
                Tournament Name *
              </label>

              <input
                type="text"
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Prize Pool (₹)
              </label>

              <input
                type="number"
                value={editing.prizePool}
                onChange={(e) =>
                  setEditing({ ...editing, prizePool: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Venue *</label>

              <input
                type="text"
                required
                value={editing.venue}
                onChange={(e) =>
                  setEditing({ ...editing, venue: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Thane District City / Zone *
              </label>

              <select
                required
                value={editing.city}
                onChange={(e) =>
                  setEditing({ ...editing, city: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Thane Zone / City</option>

                {[
                  'Thane',
                  'Kalyan',
                  'Dombivli',
                  'Kalwa',
                  'Mumbra',
                  'Bhiwandi',
                  'Ulhasnagar',
                  'Ambernath',
                  'Badlapur',
                  'Shahapur',
                  'Murbad',
                  'Navi Mumbai (Airoli / Thane)',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Courts Count</label>

              <input
                type="number"
                min="1"
                value={editing.courtsCount}
                onChange={(e) =>
                  setEditing({ ...editing, courtsCount: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Start Date *</label>

              <input
                type="date"
                required
                value={editing.startDate}
                onChange={(e) =>
                  setEditing({ ...editing, startDate: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">End Date *</label>

              <input
                type="date"
                required
                value={editing.endDate}
                onChange={(e) =>
                  setEditing({ ...editing, endDate: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Registration Deadline *
              </label>

              <input
                type="date"
                required
                value={editing.registrationDeadline}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    registrationDeadline: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Visibility Status
              </label>

              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {['draft', 'published', 'ongoing', 'completed', 'archived'].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Registration Gate
              </label>

              <select
                value={editing.registrationStatus}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    registrationStatus: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="open">Open</option>
                <option value="closing_soon">Closing Soon</option>
                <option value="waitlist_only">Waitlist Only</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Tournament banner image upload */}
          <div className="space-y-2 rounded-xl border border-slate-200 p-4">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />
              Tournament Banner Image
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerSelect}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-emerald-700 hover:file:bg-emerald-100"
            />

            <p className="text-xs text-slate-500">
              Select JPG, PNG or WEBP. Maximum file size: 5 MB.
              The image uploads to Amazon S3 when you save the tournament.
            </p>

            {(bannerPreview ||
              (editing.bannerImage &&
                editing.bannerImage.startsWith('http'))) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  Image Preview
                </p>

                <img
                  src={
                    bannerPreview ||
                    editing.bannerImage
                  }
                  alt="Tournament banner preview"
                  className="w-full max-h-64 object-cover rounded-xl border border-slate-200"
                />
              </div>
            )}

            {editing.bannerImage &&
              !editing.bannerImage.startsWith('http') &&
              !bannerPreview && (
                <p className="text-xs text-slate-500">
                  An S3 image is already saved for this tournament.
                  Select a new image to replace it.
                </p>
              )}
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Description *
            </label>

            <textarea
              rows={2}
              required
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">
              Rules (One per line)
            </label>

            <textarea
              rows={3}
              value={editing.rules}
              onChange={(e) =>
                setEditing({ ...editing, rules: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Categories, Fees & Capacity
              </span>

              <button
                type="button"
                onClick={addCategoryRow}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                + Add Category
              </button>
            </div>

            {editing.categories.map((cat, idx) => (
              <div
                key={idx}
                className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
              >
                <input
                  type="text"
                  placeholder="Code"
                  value={cat.code}
                  onChange={(e) => updateCat(idx, 'code', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 font-mono"
                />

                <input
                  type="text"
                  placeholder="Category Name"
                  value={cat.name}
                  onChange={(e) => updateCat(idx, 'name', e.target.value)}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-2 py-1.5"
                />

                <select
                  value={cat.format}
                  onChange={(e) => updateCat(idx, 'format', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 bg-white"
                >
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                </select>

                <select
                  value={cat.ageGroup}
                  onChange={(e) => updateCat(idx, 'ageGroup', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 bg-white"
                >
                  {['U15', 'U19', 'Open', '35+', '45+'].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Fee (₹)"
                  value={cat.fee}
                  onChange={(e) => updateCat(idx, 'fee', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5"
                />

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Cap"
                    value={cat.maxEntries}
                    onChange={(e) =>
                      updateCat(idx, 'maxEntries', e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                  />

                  <button
                    type="button"
                    onClick={() => removeCat(idx)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
            >
              {uploading
                ? bannerFile
                  ? 'Uploading image & saving...'
                  : 'Saving...'
                : 'Save Tournament'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tournaments.map((t) => (
          <div
            key={t._id}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={t.status} />
                <StatusBadge status={t.registrationStatus} />

                <span className="text-xs text-slate-500">
                  {t.city} • {new Date(t.startDate).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mt-1">
                {t.name}
              </h3>

              <p className="text-xs text-slate-500">
                {t.categories?.length || 0} categories •{' '}
                {t.activeRegistrations || 0} active entries • ₹
                {(t.prizePool || 0).toLocaleString('en-IN')} prize pool
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startEdit(t)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                Edit Config
              </button>

              {t.status !== 'published' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange(t, 'published')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Publish
                </button>
              )}

              {t.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => setConfirmArchive(t)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(confirmArchive)}
        title="Archive Tournament?"
        description={`Archiving "${confirmArchive?.name}" hides it from active registration while preserving historical CRM records.`}
        confirmLabel="Archive Tournament"
        onCancel={() => setConfirmArchive(null)}
        onConfirm={() => handleStatusChange(confirmArchive, 'archived')}
      />
    </div>
  );
}
