import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Star,
  Activity,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { apiRequest } from '../../api/client';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      activeTournaments: 3,
      registeredPlayers: 10,
      matchesCompleted: 3,
      liveCourts: 2,
    },
    tournaments: [],
    liveMatches: [],
    completedMatches: [],
    topRankings: [],
    organization: null,
  });

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadHome() {
      try {
        const [homeRes, liveRes] = await Promise.allSettled([
          apiRequest('/public/home'),
          apiRequest('/public/live-results'),
        ]);

        const homeData = homeRes.status === 'fulfilled' ? homeRes.value : null;
        const liveData = liveRes.status === 'fulfilled' ? liveRes.value : null;

        if (isMounted) {
          setData({
            stats: homeData?.stats || {
              activeTournaments: 3,
              registeredPlayers: 10,
              matchesCompleted: 3,
              liveCourts: 2,
            },
            tournaments: homeData?.tournaments || [],
            liveMatches: liveData?.liveMatches || homeData?.liveMatches || [],
            completedMatches: liveData?.completedMatches || [],
            topRankings: liveData?.rankings || homeData?.topRankings || [],
            organization: homeData?.organization || null,
          });
        }
      } catch (err) {
        console.error('Error loading public homepage data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHome();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTournaments = data.tournaments.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') return t.status === 'ongoing';
    if (activeTab === 'upcoming') return t.status === 'published' || t.status === 'draft';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col font-sans selection:bg-[#5B806B] selection:text-white">
      {/* Top Navigation */}
      <PublicNavbar />

      {/* Hero Section with First Image */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-[#F5F4EF] border-b border-[#E8DCC7] court-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5B806B]/15 border border-[#5B806B]/30 text-[#243044] text-xs sm:text-sm font-semibold">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B806B] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5B806B]"></span>
                </span>
                <span>Thane District Badminton Association (TDBA) Portal</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#243044] tracking-tight leading-[1.15]">
                Your District. <span className="text-[#5B806B]">Your Game.</span> Your Championship.
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-[#243044]/80 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Discover local badminton tournaments, register as a player, follow live scores, and explore badminton talent across Thane District.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/tournaments"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#5B806B] hover:bg-[#4a6b57] text-white font-bold text-base shadow-lg shadow-[#5B806B]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-[#5B806B]"
                >
                  <Trophy className="w-5 h-5 text-white" />
                  <span>Explore Tournaments</span>
                </Link>

                <Link
                  to="/live-scores"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#F5F4EF] border border-[#C5A98D] text-[#243044] font-bold text-base shadow-sm hover:border-[#5B806B] transition-all"
                >
                  <Activity className="w-5 h-5 text-[#5B806B]" />
                  <span>View Live Scores</span>
                </Link>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#E8DCC7] text-left">
                <div className="bg-white p-4 rounded-2xl border border-[#E8DCC7] shadow-sm">
                  <div className="text-2xl font-bold font-display text-[#243044]">{data.stats.activeTournaments}</div>
                  <div className="text-xs font-semibold text-[#243044]/70">District Tourneys</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8DCC7] shadow-sm">
                  <div className="text-2xl font-bold font-display text-[#5B806B]">{data.stats.registeredPlayers}+</div>
                  <div className="text-xs font-semibold text-[#243044]/70">Thane Athletes</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8DCC7] shadow-sm">
                  <div className="text-2xl font-bold font-display text-[#243044]">{data.stats.liveCourts}</div>
                  <div className="text-xs font-semibold text-[#243044]/70">Live Courts</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8DCC7] shadow-sm">
                  <div className="text-2xl font-bold font-display text-[#5B806B]">6</div>
                  <div className="text-xs font-semibold text-[#243044]/70">Affiliated Zones</div>
                </div>
              </div>
            </div>

            {/* Right Column: First Image Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden bg-white border border-[#E8DCC7] shadow-xl shadow-[#C5A98D]/20">
                  {/* Hero Image (First Image: Love All, Play Shuttle & Racquet) */}
                  <div className="relative h-96 sm:h-[440px] overflow-hidden bg-[#F5F4EF]">
                    <img
                      src="/images/hero-shuttle.png"
                      alt="Love All, Play — Thane Badminton Championship Racquet & Shuttlecock"
                      className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#243044]/80 via-transparent to-transparent"></div>

                    {/* Floating Live Match Card inside hero */}
                    <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-[#E8DCC7] rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="flex items-center gap-1.5 text-[#5B806B] font-bold uppercase tracking-wider text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-[#5B806B] animate-pulse"></span>
                          Court 1 • Thane Semifinal Live
                        </span>
                        <span className="text-[#243044]/70 font-medium text-[11px]">Game 3</span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-sm text-[#243044]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#5B806B]"></span>
                          <span>Prathamesh Kadam (Dombivli)</span>
                        </div>
                        <div className="font-mono text-[#5B806B] bg-[#5B806B]/10 px-2 py-0.5 rounded border border-[#5B806B]/30 font-bold">
                          21-19, 18-21, 14-11
                        </div>
                      </div>
                      <div className="flex items-center justify-between font-medium text-xs text-[#243044]/80 mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C5A98D]"></span>
                          <span>Yashwardhan More (Bhiwandi)</span>
                        </div>
                        <span className="text-[#243044]/60 text-[11px]">Server: Prathamesh</span>
                      </div>
                    </div>

                    {/* Bottom Hero Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8DCC7] space-y-1 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#5B806B] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Thane District Championship 2026
                        </span>
                        <span className="text-xs font-bold text-[#243044]">₹1,25,000 Prize Pool</span>
                      </div>
                      <h4 className="font-display font-bold text-base text-[#243044]">
                        Dadoji Konddev Stadium, Kharkar Alley, Thane (W)
                      </h4>
                      <p className="text-xs text-[#243044]/70 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#5B806B] shrink-0" />
                        <span>6 Synthetic Wooden Courts • TDBA Sanctioned</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Live Match Center Section */}
      <section className="py-16 bg-white border-b border-[#E8DCC7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#5B806B] font-bold text-xs uppercase tracking-wider mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5B806B] animate-pulse"></span>
                Thane Court Telemetry
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#243044]">
                District Live Scores & Court Feeds
              </h2>
            </div>
            <Link
              to="/live-scores"
              className="text-xs font-bold text-[#5B806B] hover:text-[#4a6b57] flex items-center gap-1"
            >
              <span>View full scoreboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.liveMatches && data.liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.liveMatches.map((m) => (
                <div
                  key={m._id}
                  className="bg-[#F5F4EF] rounded-2xl border border-[#E8DCC7] p-6 shadow-sm relative overflow-hidden group hover:border-[#5B806B] transition-all"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#5B806B]"></div>

                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="font-bold text-[#5B806B] flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-[#5B806B] animate-pulse"></span>
                      {m.court || 'Court 1'} • {m.round}
                    </span>
                    <span className="text-[#243044] font-semibold bg-white px-2.5 py-1 rounded-lg border border-[#E8DCC7]">
                      {m.categoryName || m.categoryCode}
                    </span>
                  </div>

                  {/* Competitors & Scores */}
                  <div className="space-y-3 font-display">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E8DCC7]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5B806B]"></span>
                        <div>
                          <div className="font-bold text-[#243044] text-base">
                            {m.sideA?.label || 'Player A'}
                          </div>
                          {m.sideA?.club && (
                            <div className="text-xs text-[#243044]/70 font-sans">{m.sideA.club}</div>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-xl font-black text-[#5B806B]">
                        {m.scores?.length > 0 ? m.scores.map((s) => s.scoreA ?? s.sideA).join(' · ') : '0'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E8DCC7]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C5A98D]"></span>
                        <div>
                          <div className="font-bold text-[#243044] text-base">
                            {m.sideB?.label || 'Player B'}
                          </div>
                          {m.sideB?.club && (
                            <div className="text-xs text-[#243044]/70 font-sans">{m.sideB.club}</div>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-xl font-black text-[#243044]">
                        {m.scores?.length > 0 ? m.scores.map((s) => s.scoreB ?? s.sideB).join(' · ') : '0'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8DCC7] flex items-center justify-between text-xs text-[#243044]/70">
                    <span>Tournament: {m.tournament?.name || 'Thane District Championship'}</span>
                    <span className="text-[#5B806B] font-bold">Serving: Side {m.servingSide || 'A'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#F5F4EF] rounded-2xl border border-[#E8DCC7]">
              <Activity className="w-8 h-8 text-[#C5A98D] mx-auto mb-2" />
              <p className="text-[#243044] font-semibold text-sm">No live matches in session</p>
              <p className="text-xs text-[#243044]/60 mt-0.5">
                Court scores stream dynamically once Thane district fixtures begin.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="py-20 bg-[#F5F4EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#5B806B] font-bold text-xs uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4" />
                Thane District Calendar
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#243044]">
                Upcoming & Active District Championships
              </h2>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E8DCC7] self-start md:self-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'ongoing', label: 'Ongoing' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'completed', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#5B806B] text-white shadow-sm font-bold'
                      : 'text-[#243044]/80 hover:text-[#243044]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.slice(0, 3).map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-3xl border border-[#E8DCC7] hover:border-[#5B806B] overflow-hidden shadow-sm hover:shadow-md flex flex-col group transition-all"
              >
                <div className="relative h-48 overflow-hidden bg-[#E8DCC7]/30">
                  <img
                    src={
                      t.bannerImage ||
                      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                        t.status === 'ongoing'
                          ? 'bg-[#5B806B] text-white'
                          : t.status === 'completed'
                          ? 'bg-[#243044] text-white'
                          : 'bg-[#C5A98D] text-white'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  {t.prizePool > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold bg-white/95 border border-[#E8DCC7] text-[#243044] backdrop-blur-md">
                      ₹{t.prizePool.toLocaleString()} Purse
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-display text-xl font-bold text-[#243044] group-hover:text-[#5B806B] transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs text-[#243044]/70 line-clamp-2">{t.subtitle || t.description}</p>
                  </div>

                  <div className="space-y-2 text-xs text-[#243044]/80 pt-3 border-t border-[#E8DCC7]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5B806B] shrink-0" />
                      <span>
                        {new Date(t.startDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        –{' '}
                        {new Date(t.endDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#5B806B] shrink-0" />
                      <span className="truncate">{t.venue}, {t.city}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8DCC7] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-[#243044]/60">Registration</span>
                      <div className="text-xs font-bold text-[#5B806B] capitalize">
                        {t.registrationStatus?.replace('_', ' ') || 'Open'}
                      </div>
                    </div>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B806B] hover:bg-[#4a6b57] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Player Entry</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#E8DCC7] hover:border-[#5B806B] text-[#243044] text-xs font-bold shadow-sm transition-all"
            >
              <span>View All Thane Tournaments ({data.tournaments.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Rankings & Local Thane Clubs Section */}
      <section className="py-20 bg-white border-t border-[#E8DCC7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[#5B806B] font-bold text-xs uppercase tracking-wider mb-2">
                  <Award className="w-4 h-4" />
                  Official Thane Standings
                </div>
                <h2 className="font-display text-3xl font-extrabold text-[#243044]">
                  Thane District Player Rankings
                </h2>
                <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
                  Official district points calculated across Thane, Kalyan, Dombivli, and Kalwa tournaments.
                </p>
              </div>

              <div className="bg-[#F5F4EF] rounded-3xl border border-[#E8DCC7] overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#E8DCC7]/50 border-b border-[#E8DCC7] text-xs uppercase font-bold text-[#243044]">
                    <tr>
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Player</th>
                      <th className="py-3.5 px-4">Club / Region</th>
                      <th className="py-3.5 px-4 text-center">W / L</th>
                      <th className="py-3.5 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DCC7] text-[#243044]">
                    {data.topRankings && data.topRankings.slice(0, 5).map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-white transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#243044]">#{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-[#243044]">{p.fullName}</td>
                        <td className="py-3.5 px-4 text-xs text-[#243044]/70">{p.club || 'Thane'}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span className="text-[#5B806B] font-bold">{p.wins || 0}</span>
                          <span className="text-[#C5A98D]"> / </span>
                          <span>{p.losses || 0}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-[#5B806B]">
                          {p.rankingPoints?.toLocaleString() || 1200}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Link
                to="/rankings"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B806B] hover:text-[#4a6b57]"
              >
                <span>View Full District Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[#5B806B] font-bold text-xs uppercase tracking-wider mb-2">
                  <Star className="w-4 h-4" />
                  Thane District Talents
                </div>
                <h2 className="font-display text-3xl font-extrabold text-[#243044]">
                  Athletes to Watch
                </h2>
                <p className="text-xs sm:text-sm text-[#243044]/70 mt-1">
                  Top performing players competing across Thane District courts this month.
                </p>
              </div>

              <div className="space-y-3.5">
                {data.topRankings && data.topRankings.slice(0, 3).map((player, idx) => (
                  <div
                    key={player._id || idx}
                    className="p-4 rounded-2xl bg-[#F5F4EF] border border-[#E8DCC7] shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#5B806B]/15 text-[#5B806B] border border-[#5B806B]/30 flex items-center justify-center font-display font-black text-base">
                        {player.fullName?.slice(0, 2).toUpperCase() || 'TH'}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#243044] text-sm">{player.fullName}</h4>
                        <p className="text-xs text-[#243044]/70">{player.club} • {player.skillLevel || 'District Ranked'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-[#5B806B]">
                        {player.rankingPoints} pts
                      </div>
                      <div className="text-[11px] text-[#243044]/60">{player.wins}W - {player.losses}L</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Local Clubs & Academies in Thane */}
              <div className="p-5 rounded-2xl bg-[#E8DCC7]/30 border border-[#E8DCC7] space-y-3">
                <div className="flex items-center gap-2 text-[#243044] font-bold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4 text-[#5B806B]" />
                  <span>Affiliated Thane Clubs & Academies</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#243044]/80">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>Dadoji Konddev Stadium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>Dombivli Gymkhana</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>Kalyan Sports Complex</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>Kalwa Badminton Club</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>Bhiwandi Racquet Academy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5B806B]" />
                    <span>Mumbra Shuttlers Guild</span>
                  </div>
                </div>
              </div>

              <Link
                to="/players"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B806B] hover:text-[#4a6b57]"
              >
                <span>Browse Thane District Player Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
