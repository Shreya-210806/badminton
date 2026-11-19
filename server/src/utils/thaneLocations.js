export const THANE_LOCATIONS = [
  'Thane',
  'Kalyan',
  'Dombivli',
  'Bhiwandi',
  'Ulhasnagar',
  'Ambernath',
  'Badlapur',
  'Kalwa',
  'Mumbra',
  'Shahapur',
  'Murbad',
  'Navi Mumbai (Airoli / Thane)',
  'Mira-Bhayandar (Thane)',
];

export const isThaneDistrictLocation = (location = '') => {
  if (!location || typeof location !== 'string') return false;
  const clean = location.toLowerCase();
  return (
    clean.includes('thane') ||
    clean.includes('kalyan') ||
    clean.includes('dombivli') ||
    clean.includes('dombivali') ||
    clean.includes('bhiwandi') ||
    clean.includes('ulhasnagar') ||
    clean.includes('ambernath') ||
    clean.includes('ambarnath') ||
    clean.includes('badlapur') ||
    clean.includes('kalwa') ||
    clean.includes('mumbra') ||
    clean.includes('shahapur') ||
    clean.includes('murbad') ||
    clean.includes('airoli') ||
    clean.includes('ghodbunder') ||
    clean.includes('majiwada') ||
    clean.includes('vartak') ||
    clean.includes('naupada') ||
    clean.includes('wagle') ||
    clean.includes('balkum') ||
    clean.includes('hiranandani')
  );
};
