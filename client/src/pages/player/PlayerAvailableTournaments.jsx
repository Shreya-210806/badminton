import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const isCategoryEligible = (category, player) => {
  const genderEligible =
    !category.gender ||
    category.gender === 'Any' ||
    category.gender === player?.gender ||
    (category.gender === 'Mixed' && ['Male', 'Female'].includes(player?.gender));
  const ageEligible =
    !category.ageGroup ||
    category.ageGroup === 'Open' ||
    category.ageGroup === player?.ageGroup;

  return genderEligible && ageEligible;
};

const isActiveApplication = (application) =>
  !['rejected', 'cancelled'].includes(application.status);

export default function PlayerAvailableTournaments() {
  const { notify } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [player, setPlayer] = useState(null);
  const [applications, setApplications] = useState([]);
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
  const [agreeRules, setAgreeRules] = useState(false);

  const fetchTournaments = async () => {
    try {
      const [tournamentRes, dashboardRes] = await Promise.all([
        apiRequest('/player/available-tournaments'),
        apiRequest('/player/dashboard'),
      ]);
      if (tournamentRes.success) {
        setTournaments(tournamentRes.tournaments);
      }
      if (dashboardRes.success) {
        setPlayer(dashboardRes.player);
        setApplications(dashboardRes.registrations || []);
      }
    } catch (err) {
      console.error('Failed to load tournaments and player profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const openApplyModal = (tournament) => {
    const categories = (tournament.categories || []).filter((category) =>
      isCategoryEligible(category, player)
    );
    setSelectedTournament({ ...tournament, categories });
    const initialCategory =
      categories.find(
        (category) =>
          !applications.some(
            (application) =>
              String(application.tournament?._id) === String(tournament._id) &&
              application.categoryCode === category.code &&
              isActiveApplication(application)
          )
      ) || null;
    setSelectedCategory(initialCategory);
    setFormError('');
    setFormSuccess(null);
    setAgreeRules(false);
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
      setFormError('Please confirm your eligibility and accept the tournament rules.');
      return;
    }

    if (!player?.fullName || !player?.email || !player?.phone || !selectedCategory) {
      setFormError('Complete your name, email, contact number, and age category in your profile before applying.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tournamentId: selectedTournament._id,
        categoryCode: selectedCategory.code,
        eligibilityConfirmed: true,
      };

      const res = await apiRequest('/player/registrations', {
        method: 'POST',
        body: payload,
      });

      if (res.success) {
        setFormSuccess(res.registration);
        setApplications((current) => [...current, res.registration]);
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
    const eligibleCategories = (t.categories || []).filter((category) =>
      isCategoryEligible(category, player)
    );
    if (!eligibleCategories.length) return false;

    const matchesSearch =
      String(t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(t.venue || '').toLowerCase().includes(search.toLowerCase()) ||
      String(t.city || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && t.registrationStatus === 'closed') return false;
      if (statusFilter === 'closed' && t.registrationStatus !== 'closed') return false;
    }

    if (formatFilter !== 'all') {
      const hasFormat = eligibleCategories.some((c) => {
        if (formatFilter === 'mixed') return c.gender === 'Mixed';
        return c.format === formatFilter;
      });
      if (!hasFormat) return false;
    }

    if (ageFilter !== 'all') {
      const hasAge = eligibleCategories.some((c) => c.ageGroup === ageFilter);
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
              <option value="45+">Veterans 45+</option>
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
            const eligibleCategories = (t.categories || []).filter((category) =>
              isCategoryEligible(category, player)
            );
            const hasUnappliedCategory = eligibleCategories.some(
              (category) =>
                !applications.some(
                  (application) =>
                    String(application.tournament?._id) === String(t._id) &&
                    application.categoryCode === category.code &&
                    isActiveApplication(application)
                )
            );
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
                        Eligible events: {eligibleCategories.map((c) => c.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8DCC7] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#243044]/60 uppercase font-bold">Entry Fee From</div>
                      <div className="text-sm font-black text-[#5B806B]">
                        ₹{eligibleCategories[0]?.fee ?? 0}
                      </div>
                    </div>

                    <button
                      onClick={() => openApplyModal(t)}
                      disabled={isClosed || !hasUnappliedCategory}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isClosed || !hasUnappliedCategory
                          ? 'bg-[#E8DCC7] text-[#243044]/40 cursor-not-allowed'
                          : 'bg-[#5B806B] hover:bg-[#4a6b57] text-white'
                      }`}
                    >
                      {isClosed ? 'Closed' : hasUnappliedCategory ? 'Apply Now' : 'Applied'}
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
                    <span className="font-bold text-amber-600 uppercase">{formSuccess.status}</span>
                  </div>
                </div>
                <p className="text-xs text-[#243044]/70">
                  {formSuccess.status === 'waitlisted'
                    ? 'Your entry is waitlisted. You will receive a notification if a place becomes available.'
                    : 'Your entry is queued for admin verification. You will receive a notification when its status changes.'}
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

                <div className="p-3.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7]">
                  <div className="font-bold text-[#243044] mb-2">Review your profile details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#243044]/70">
                    <div>Name: <span className="font-semibold text-[#243044]">{player?.fullName}</span></div>
                    <div>Email: <span className="font-semibold text-[#243044]">{player?.email}</span></div>
                    <div>Contact: <span className="font-semibold text-[#243044]">{player?.phone}</span></div>
                    <div>Gender: <span className="font-semibold text-[#243044]">{player?.gender}</span></div>
                    <div>Age category: <span className="font-semibold text-[#243044]">{player?.ageGroup}</span></div>
                    <div>Club: <span className="font-semibold text-[#243044]">{player?.club || 'Not provided'}</span></div>
                    <div>City: <span className="font-semibold text-[#243044]">{player?.city || 'Not provided'}</span></div>
                    <div>Playing hand: <span className="font-semibold text-[#243044]">{player?.handedness || 'Not provided'}</span></div>
                    <div>Skill level: <span className="font-semibold text-[#243044]">{player?.skillLevel || 'Not provided'}</span></div>
                    <div>Date of birth: <span className="font-semibold text-[#243044]">
                      {player?.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </span></div>
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
                      <option
                        key={cat.code}
                        value={cat.code}
                        disabled={applications.some(
                          (application) =>
                            String(application.tournament?._id) === String(selectedTournament._id) &&
                            application.categoryCode === cat.code &&
                            isActiveApplication(application)
                        )}
                      >
                        {cat.name} ({cat.gender} • {cat.ageGroup}) — Entry: ₹{cat.fee}
                        {applications.some(
                          (application) =>
                            String(application.tournament?._id) === String(selectedTournament._id) &&
                            application.categoryCode === cat.code &&
                            isActiveApplication(application)
                        )
                          ? ' — Already applied'
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategory?.format === 'doubles' && (
                  <div className="p-3.5 rounded-xl bg-[#E8DCC7]/25 border border-[#E8DCC7] text-[11px] text-[#243044]/80">
                    Doubles partner details can be coordinated with the tournament organizer after your application.
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-[#F5F4EF] border border-[#E8DCC7] space-y-1.5 max-h-28 overflow-y-auto">
                  <div className="font-bold text-[#243044] flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#5B806B]" />
                    <span>Event Rules & Eligibility</span>
                  </div>
                  {selectedTournament.rules?.length ? (
                    <ul className="list-disc pl-4 text-[10px] text-[#243044]/70 space-y-0.5">
                      {selectedTournament.rules.map((rule, index) => <li key={`${index}-${rule}`}>{rule}</li>)}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-[#243044]/70">
                      Eligible for {selectedCategory?.name} based on your saved gender and age category.
                    </p>
                  )}
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
                    I confirm I meet this event's eligibility requirements and agree to its rules.
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
