import React, { useState, useEffect } from 'react';
import {
  Shield,
  Trophy,
  Award,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { apiRequest } from '../../api/client';

export default function PublicAboutPage() {
  const [org, setOrg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAbout() {
      try {
        const res = await apiRequest('/public/home');
        if (isMounted && res.organization) {
          setOrg(res.organization);
        }
      } catch (err) {
        console.error('Failed to load about details:', err);
      }
    }
    loadAbout();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#243044] flex flex-col font-sans selection:bg-[#5B806B] selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Banner with Third Uploaded Image */}
        <div className="mb-14 rounded-3xl overflow-hidden bg-white border border-[#E8DCC7] shadow-md shadow-[#C5A98D]/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            
            {/* Left text */}
            <div className="p-8 sm:p-12 lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B806B]/15 text-[#243044] text-xs font-semibold border border-[#5B806B]/30">
                <Shield className="w-3.5 h-3.5 text-[#5B806B]" />
                Thane District Badminton Association (TDBA)
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#243044] tracking-tight">
                About Thane District Badminton
              </h1>
              <p className="text-sm sm:text-base text-[#243044]/80 leading-relaxed max-w-xl">
                The official tournament and player ranking platform for Thane District, Maharashtra. Serving local badminton players, grassroots clubs, coaches, and academies across Thane, Kalwa, Mumbra, Dombivli, Kalyan, and Bhiwandi.
              </p>
            </div>

            {/* Right: Third Image (Shuttlecocks and Racquets on Green Court Mat) */}
            <div className="lg:col-span-5 h-72 sm:h-80 lg:h-full min-h-[280px] relative overflow-hidden bg-[#243044]">
              <img
                src="/images/about-court.jpg"
                alt="Thane Badminton Shuttlecocks and Racquets on Court"
                className="w-full h-full object-cover object-center"
              />
            </div>

          </div>
        </div>

        {/* Pillars / Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-white border border-[#E8DCC7] shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5B806B]/15 text-[#5B806B] flex items-center justify-center font-bold">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-[#243044]">District Championships</h3>
            <p className="text-xs sm:text-sm text-[#243044]/70 leading-relaxed">
              Official annual and open tournaments for Under-15, Under-19, Men's, Women's, and Veteran categories across Thane district arenas.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-[#E8DCC7] shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A98D]/25 text-[#243044] flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-[#243044]">Local Court Telemetry</h3>
            <p className="text-xs sm:text-sm text-[#243044]/70 leading-relaxed">
              District referees and umpires update live points on mobile digital scoreboards at Dadoji Konddev Stadium, Dombivli Gymkhana, and Kalyan courts.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-[#E8DCC7] shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8DCC7] text-[#243044] flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-[#243044]">Talent & Rankings</h3>
            <p className="text-xs sm:text-sm text-[#243044]/70 leading-relaxed">
              District-wide player ranking points help nurture local athletes from Thane, Kalwa, Mumbra, and Kalyan for state-level selections.
            </p>
          </div>
        </div>

        {/* Contact and Headquarters Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E8DCC7] shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B806B]">Association Secretariat</span>
              <h2 className="font-display text-3xl font-extrabold text-[#243044] mt-1">
                {org?.organizationName || 'Thane District Badminton Association (TDBA)'}
              </h2>
              <p className="text-sm text-[#243044]/70 mt-2">
                {org?.tagline || 'Apex Governing Body for Badminton Across Thane District, Maharashtra'}
              </p>

              <div className="space-y-3 mt-6 text-sm text-[#243044]">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#5B806B] shrink-0" />
                  <span>{org?.headquarters || 'Dadoji Konddev Stadium, Kharkar Alley, Thane (West), Maharashtra 400601'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#5B806B] shrink-0" />
                  <span className="font-mono text-[#5B806B]">{org?.supportEmail || 'secretary@thanebadminton.org'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#5B806B] shrink-0" />
                  <span>{org?.supportPhone || '+91 22 2538 4120'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#5B806B] shrink-0" />
                  <span>{org?.website || 'https://thanebadminton.org'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F5F4EF] p-6 sm:p-8 rounded-2xl border border-[#E8DCC7] space-y-4">
              <h4 className="font-bold text-[#243044] text-base">Thane District Guidelines</h4>
              <ul className="space-y-2.5 text-xs text-[#243044]/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5B806B] shrink-0 mt-0.5" />
                  <span>Players must produce a valid Thane District residency certificate or club affiliation ID.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5B806B] shrink-0 mt-0.5" />
                  <span>Strict non-marking indoor court shoes are mandatory at all Thane municipal and private badminton arenas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5B806B] shrink-0 mt-0.5" />
                  <span>Official tournament shuttles: Yonex AS-2 / Li-Ning A+300 tournament-approved shuttlecocks.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
