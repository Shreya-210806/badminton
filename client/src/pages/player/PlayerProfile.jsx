import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Save,
  CheckCircle2,
  Calendar,
  Award,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function PlayerProfile() {
  const { user, notify, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [club, setClub] = useState('');
  const [city, setCity] = useState('');
  const [handedness, setHandedness] = useState('Right');
  const [bio, setBio] = useState('');

  const thaneClubs = [
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

  const fetchProfile = async () => {
    try {
      const res = await apiRequest('/player/profile');
      if (res.success && res.player) {
        const p = res.player;
        setPlayer(p);
        setFullName(p.fullName || user?.name || '');
        setPhone(p.phone || '');
        setGender(p.gender || '');
        setAge(p.age === undefined || p.age === null ? '' : String(p.age));
        setClub(p.club || '');
        setCity(p.city || '');
        setHandedness(p.handedness || 'Right');
        setBio(p.bio || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest('/player/profile', {
        method: 'PUT',
        body: {
          fullName,
          phone,
          gender,
          age: Number(age),
          club,
          city,
          handedness,
          bio,
        },
      });

      if (res.success) {
        notify('Profile updated successfully!', 'success');
        refreshSession();
        fetchProfile();
      }
    } catch (err) {
      notify(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-[#243044]/70">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#243044]">
          My Player Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
          Manage your personal details, Thane District club affiliation, contact information, and athlete records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Player Identity Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-[#E8DCC7] shadow-xs text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-[#5B806B]/15 text-[#5B806B] border-2 border-[#5B806B]/30 flex items-center justify-center font-display font-black text-3xl mx-auto shadow-xs">
              {fullName?.slice(0, 2).toUpperCase() || 'PL'}
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-[#243044]">{fullName}</h3>
              <p className="text-xs text-[#243044]/70 font-medium">{club}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B806B]/10 text-[#5B806B] text-[11px] font-bold">
                <Shield className="w-3 h-3" />
                <span>{player?.playerCode || 'PL-0000'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8DCC7] grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[#F5F4EF]">
                <div className="font-mono font-black text-sm text-[#5B806B]">
                  {player?.rankingPoints || 1000}
                </div>
                <div className="text-[10px] text-[#243044]/60 uppercase font-bold">Points</div>
              </div>
              <div className="p-2 rounded-xl bg-[#F5F4EF]">
                <div className="font-mono font-black text-sm text-[#243044]">
                  {player?.wins || 0}W
                </div>
                <div className="text-[10px] text-[#243044]/60 uppercase font-bold">Wins</div>
              </div>
              <div className="p-2 rounded-xl bg-[#F5F4EF]">
                <div className="font-mono font-black text-sm text-[#C5A98D]">
                  {player?.titles || 0}
                </div>
                <div className="text-[10px] text-[#243044]/60 uppercase font-bold">Titles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Information Form */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8DCC7] shadow-xs space-y-4 text-xs"
          >
            <h4 className="font-display font-bold text-base text-[#243044] pb-2 border-b border-[#E8DCC7]">
              Athlete Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#243044] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B] transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-[#243044] mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={player?.email || user?.email || ''}
                  className="w-full p-2.5 rounded-xl bg-[#E8DCC7]/30 border border-[#E8DCC7] text-xs text-[#243044]/70 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-[#243044] mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  minLength={6}
                  placeholder="e.g. 9820011223"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B] transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-[#243044] mb-1">Gender</label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] text-xs text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
                >
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#243044] mb-1">Age</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  step="1"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] text-xs text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block font-bold text-[#243044] mb-1">Playing Hand</label>
                <select
                  value={handedness}
                  onChange={(e) => setHandedness(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] text-xs text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
                >
                  <option value="Right">Right-Handed</option>
                  <option value="Left">Left-Handed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#243044] mb-1">
                Thane Club / Stadium / Academy Affiliation
              </label>
              <select
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] text-xs text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
              >
                <option value="">Select a club</option>
                {club && !thaneClubs.includes(club) && (
                  <option value={club}>{club}</option>
                )}
                {thaneClubs.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#243044] mb-1">City / Region</label>
              <input
                type="text"
                placeholder="e.g. Thane West, Kalwa, Kalyan"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B] transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-[#243044] mb-1">Athlete Bio / Highlights</label>
              <textarea
                rows={3}
                placeholder="Share your playing style, previous district titles, or badminton achievements..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B] transition-all"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white font-bold text-xs shadow-md shadow-[#5B806B]/20 transition-all border border-[#5B806B]"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
