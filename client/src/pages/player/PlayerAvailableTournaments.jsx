import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  Calendar,
  MapPin,
  Users,
  Filter,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function PlayerAvailableTournaments() {
  const { user, notify } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal application state
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(null);

  // Form inputs
  const [partnerDetails, setPartnerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    club: '',
    gender: 'Male',
  });
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relation: 'Family',
  });
  const [shirtSize, setShirtSize] = useState('M');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [agreeRules, setAgreeRules] = useState(false);

  const fetchTournaments = async () => {
    try {
      const res = await apiRequest('/player/available-tournaments');
      if (res.success) {
        setTournaments(res.tournaments);
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const openApplyModal = (tournament) => {
    setSelectedTournament(tournament);
    const initialCategory = tournament.categories?.[0] || null;
    setSelectedCategory(initialCategory);
    setFormError('');
    setFormSuccess(null);
    setAgreeRules(false);
    setEmergencyContact({
      name: user?.name ? `${user.name} Contact` : '',
      phone: '9820011223',
      relation: 'Family',
    });
  };

  const closeApplyModal = () => {
    setSelectedTournament(null);
    setSelectedCategory(null);
    setFormError('');
    setFormSuccess(null);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!agreeRules) {
      setFormError('Please review and accept the official Thane District tournament rules.');
      return;
    }

    if (!selectedCategory) {
      setFormError('Please select a tournament category.');
      return;
    }

    if (selectedCategory.format === 'doubles') {
      if (!partnerDetails.name.trim() || !partnerDetails.email.trim()) {
        setFormError('Doubles and Mixed Doubles require partner full name and partner email.');
        return;
      }
    }

    if (!emergencyContact.name.trim() || !emergencyContact.phone.trim()) {
      setFormError('Emergency contact name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tournamentId: selectedTournament._id,
        categoryCode: selectedCategory.code,
        partnerDetails: selectedCategory.format === 'doubles' ? partnerDetails : undefined,
        emergencyContact,
        shirtSize,
        paymentMethod,
        paymentReference,
      };

      const res = await apiRequest('/player/registrations', {
        method: 'POST',
        body: payload,
      });

      if (res.success) {
        setFormSuccess(res.registration);
        notify('Application submitted successfully! Application ID: ' + res.registration.registrationNumber, 'success');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tournaments
  const filtered = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.venue.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && t.registrationStatus === 'closed') return false;
      if (statusFilter === 'closed' && t.registrationStatus !== 'closed') return false;
    }

    if (formatFilter !== 'all') {
      const hasFormat = t.categories?.some((c) => {
        if (formatFilter === 'mixed') return c.gender === 'Mixed';
        return c.format === formatFilter;
      });
      if (!hasFormat) return false;
    }

    if (ageFilter !== 'all') {
      const hasAge = t.categories?.some((c) => c.ageGroup === ageFilter);
      if (!hasAge) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#243044]">
          Available Tournaments
        </h1>
        <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
          Explore and apply for sanctioned Thane District badminton championships and inter-club tournaments.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DCC7] shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#C5A98D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tournament name, stadium, or venue in Thane..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F4EF] hover:bg-white focus:bg-white border border-[#E8DCC7] rounded-xl text-sm text-[#243044] placeholder-[#243044]/50 focus:outline-none focus:border-[#5B806B] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Format filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#243044]/70">Format:</span>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F5F4EF] border border-[#E8DCC7] text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
            >
              <option value="all">All Formats</option>
              <option value="singles">Singles</option>
              <option value="doubles">Doubles</option>
              <option value="mixed">Mixed Doubles</option>
            </select>
          </div>

          {/* Age group filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#243044]/70">Age Category:</span>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F5F4EF] border border-[#E8DCC7] text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
            >
              <option value="all">All Age Groups</option>
              <option value="U15">Under-15</option>
              <option value="U19">Under-19</option>
              <option value="Open">Open</option>
              <option value="35+">Veterans 35+</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#243044]/70">Registration:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F5F4EF] border border-[#E8DCC7] text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
            >
              <option value="all">All</option>
              <option value="open">Registration Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#5B806B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-[#243044]/70">Loading available tournaments...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => {
            const isClosed = t.registrationStatus === 'closed' || new Date(t.registrationDeadline) < new Date();
            return (
              <div
                key={t._id}
                className="bg-white rounded-3xl border border-[#E8DCC7] shadow-xs hover:border-[#5B806B] transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="relative h-44 overflow-hidden bg-[#E8DCC7]/30">
                  <img
                    src={
                      t.bannerImage ||
                      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isClosed ? 'bg-[#243044] text-white' : 'bg-[#5B806B] text-white'
                      }`}
                    >
                      {isClosed ? 'Registration Closed' : 'Registration Open'}
                    </span>
                  </div>
                  {t.prizePool > 0 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/95 text-[#243044] border border-[#E8DCC7]">
                      ₹{t.prizePool.toLocaleString()} Purse
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-lg text-[#243044]">{t.name}</h3>
                    <p className="text-xs text-[#243044]/70 line-clamp-2">{t.description}</p>
                  </div>

                  <div className="space-y-2 text-xs text-[#243044]/80 pt-3 border-t border-[#E8DCC7]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#5B806B] shrink-0" />
                      <span>
                        {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#5B806B] shrink-0" />
                      <span className="truncate">{t.venue}, {t.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#243044]/60">
                      <Users className="w-3.5 h-3.5 text-[#C5A98D] shrink-0" />
                      <span>
                        Categories: {t.categories?.map((c) => c.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8DCC7] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#243044]/60 uppercase font-bold">Entry Fee From</div>
                      <div className="text-sm font-black text-[#5B806B]">
                        ₹{t.categories?.[0]?.fee || 500}
                      </div>
                    </div>

                    <button
                      onClick={() => openApplyModal(t)}
                      disabled={isClosed}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isClosed
                          ? 'bg-[#E8DCC7] text-[#243044]/40 cursor-not-allowed'
                          : 'bg-[#5B806B] hover:bg-[#4a6b57] text-white'
                      }`}
                    >
                      {isClosed ? 'Closed' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#E8DCC7]">
          <Trophy className="w-12 h-12 text-[#C5A98D] mx-auto mb-3" />
          <h4 className="font-bold text-base text-[#243044]">No tournaments match your search criteria</h4>
          <p className="text-xs text-[#243044]/60 mt-1">Try resetting the filters or keyword search.</p>
        </div>
      )}

      {/* Requirement 3: TOURNAMENT APPLICATION MODAL */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#243044]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8DCC7] max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-up">
            <button
              onClick={closeApplyModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-[#243044]/60 hover:text-[#243044] hover:bg-[#F5F4EF]"
            >
              <X className="w-5 h-5" />
            </button>

            {formSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display font-extrabold text-xl text-[#243044]">
                  Application Submitted Successfully!
                </h3>
                <div className="p-4 rounded-2xl bg-[#F5F4EF] border border-[#E8DCC7] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#243044]/60">Application ID:</span>
                    <span className="font-mono font-bold text-[#5B806B]">
                      {formSuccess.registrationNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#243044]/60">Tournament:</span>
                    <span className="font-bold text-[#243044]">{selectedTournament.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#243044]/60">Event Category:</span>
                    <span className="font-bold text-[#243044]">{formSuccess.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#243044]/60">Application Status:</span>
                    <span className="font-bold text-amber-600 uppercase">Pending Approval</span>
                  </div>
                </div>
                <p className="text-xs text-[#243044]/70">
                  Your entry is queued for admin verification. You will receive real-time notifications on approval.
                </p>
                <div className="pt-2">
                  <button
                    onClick={closeApplyModal}
                    className="w-full py-3 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white font-bold text-xs"
                  >
                    Done & Return to Tournaments
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5B806B] tracking-wider">
                    Official Tournament Entry
                  </span>
                  <h3 className="font-display font-black text-xl text-[#243044] mt-0.5">
                    {selectedTournament.name}
                  </h3>
                  <p className="text-[11px] text-[#243044]/70 mt-0.5">
                    {selectedTournament.venue}, {selectedTournament.city}
                  </p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Auto-fetched player details */}
                <div className="p-3.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] space-y-1">
                  <div className="font-bold text-[#243044]">Player Applicant: {user?.name}</div>
                  <div className="text-[11px] text-[#243044]/70">
                    Email: {user?.email} • Club: {user?.club || 'Thane District Registered'}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block font-bold text-[#243044] mb-1">
                    Select Event Category
                  </label>
                  <select
                    value={selectedCategory?.code || ''}
                    onChange={(e) => {
                      const found = selectedTournament.categories.find(
                        (c) => c.code === e.target.value
                      );
                      setSelectedCategory(found);
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] text-sm text-[#243044] font-semibold focus:outline-none focus:border-[#5B806B]"
                  >
                    {selectedTournament.categories?.map((cat) => (
                      <option key={cat.code} value={cat.code}>
                        {cat.name} ({cat.gender} • {cat.ageGroup}) — Entry: ₹{cat.fee}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doubles Partner Details (if doubles) */}
                {selectedCategory?.format === 'doubles' && (
                  <div className="p-3.5 rounded-xl bg-[#E8DCC7]/25 border border-[#E8DCC7] space-y-3">
                    <div className="font-bold text-[#243044] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#5B806B]" />
                      <span>Doubles Partner Information (Required)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#243044]/80 mb-0.5">
                          Partner Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tanvi Gokhale"
                          value={partnerDetails.name}
                          onChange={(e) =>
                            setPartnerDetails({ ...partnerDetails, name: e.target.value })
                          }
                          className="w-full p-2 rounded-lg bg-white border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#243044]/80 mb-0.5">
                          Partner Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="partner@example.com"
                          value={partnerDetails.email}
                          onChange={(e) =>
                            setPartnerDetails({ ...partnerDetails, email: e.target.value })
                          }
                          className="w-full p-2 rounded-lg bg-white border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-[#243044] mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contact Name"
                      value={emergencyContact.name}
                      onChange={(e) =>
                        setEmergencyContact({ ...emergencyContact, name: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#243044] mb-1">
                      Emergency Phone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={emergencyContact.phone}
                      onChange={(e) =>
                        setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] text-xs text-[#243044] focus:outline-none focus:border-[#5B806B]"
                    />
                  </div>
                </div>

                {/* Rules & Eligibility Display */}
                <div className="p-3.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] space-y-1.5 max-h-28 overflow-y-auto">
                  <div className="font-bold text-[#243044] flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#5B806B]" />
                    <span>Tournament Rules & Eligibility</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10px] text-[#243044]/70 space-y-0.5">
                    <li>Player must reside or train within Thane District, Maharashtra.</li>
                    <li>Non-marking badminton court shoes are mandatory.</li>
                    <li>Rally scoring 3x21 BWF rules apply across all match brackets.</li>
                    <li>Reporting time: 20 minutes prior to scheduled fixture time.</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rulesAgreement"
                    checked={agreeRules}
                    onChange={(e) => setAgreeRules(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5B806B] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="rulesAgreement" className="text-[11px] text-[#243044]/80 cursor-pointer">
                    I confirm my district eligibility and agree to abide by TDBA rules.
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white font-bold text-xs shadow-md shadow-[#5B806B]/25 active:scale-[0.99] transition-all"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
