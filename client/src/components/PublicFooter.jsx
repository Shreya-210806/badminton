import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="mt-auto bg-[#F5F4EF] border-t border-[#E8DCC7] py-12 text-[#243044]/80 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#5B806B] flex items-center justify-center text-white font-bold shadow-sm">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base text-[#243044]">
              Shuttle<span className="text-[#5B806B]">Pulse</span>
            </span>
            <span className="text-[#C5A98D]">|</span>
            <span className="text-[#243044]/70">Thane District Badminton Association</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#243044]/80 font-medium">
            <Link to="/" className="hover:text-[#5B806B] transition-colors">Home</Link>
            <Link to="/tournaments" className="hover:text-[#5B806B] transition-colors">Tournaments</Link>
            <Link to="/players" className="hover:text-[#5B806B] transition-colors">Players</Link>
            <Link to="/rankings" className="hover:text-[#5B806B] transition-colors">Rankings</Link>
            <Link to="/live-scores" className="hover:text-[#5B806B] transition-colors">Live Scores</Link>
            <Link to="/about" className="hover:text-[#5B806B] transition-colors">About Us</Link>
            <Link to="/login" className="hover:text-[#5B806B] font-bold text-[#5B806B] transition-colors">Player Login / Register</Link>
            <Link to="/admin/login" className="hover:text-[#5B806B] text-[#243044]/70 transition-colors">Admin Portal</Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E8DCC7] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#243044]/60">
          <p>© {new Date().getFullYear()} Thane District Badminton Association (TDBA). All rights reserved.</p>
          <p>Dadoji Konddev Stadium, Kharkar Alley, Thane (West), Maharashtra.</p>
        </div>
      </div>
    </footer>
  );
}
