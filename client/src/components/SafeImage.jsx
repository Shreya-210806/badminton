import React, { useState } from 'react';

/**
 * Renders responsive badminton photography with automatic graceful fallback
 * to an illustrated badminton court graphic if an external URL fails to load.
 */
export default function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel = 'Badminton Championship Court',
}) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel}
        className={`relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-emerald-900 flex items-center justify-center ${className}`}
      >
        <svg
          viewBox="0 0 400 220"
          className="w-full h-full opacity-30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="24" y="20" width="352" height="180" stroke="#34d399" strokeWidth="2.5" />
          <line x1="200" y1="20" x2="200" y2="200" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 5" />
          <line x1="130" y1="20" x2="130" y2="200" stroke="#34d399" strokeWidth="1.5" />
          <line x1="270" y1="20" x2="270" y2="200" stroke="#34d399" strokeWidth="1.5" />
          <line x1="24" y1="46" x2="376" y2="46" stroke="#34d399" strokeWidth="1.5" />
          <line x1="24" y1="174" x2="376" y2="174" stroke="#34d399" strokeWidth="1.5" />
          <line x1="24" y1="110" x2="130" y2="110" stroke="#34d399" strokeWidth="1.5" />
          <line x1="270" y1="110" x2="376" y2="110" stroke="#34d399" strokeWidth="1.5" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
            ShuttlePulse Arena
          </span>
          <p className="mt-2 text-xs text-slate-300 font-medium line-clamp-1">{fallbackLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
