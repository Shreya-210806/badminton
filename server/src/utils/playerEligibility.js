export const tournamentLocations = [
  'Dombivli',
  'Kalwa',
  'Mumbra',
  'Ambernath',
  'Thane',
  'Kalyan',
  'Bhiwandi',
  'Badlapur',
];

const normalize = (value) =>
  ` ${String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

export const ageGroupsForAge = (age) => {
  const years = Number(age);
  if (!Number.isInteger(years) || years < 1 || years > 120) return [];
  if (years < 15) return ['U15', 'U19', 'Open'];
  if (years < 19) return ['U19', 'Open'];
  if (years < 35) return ['Open'];
  if (years < 45) return ['35+', 'Open'];
  return ['35+', '45+', 'Open'];
};

export const ageGroupForAge = (age) => {
  const years = Number(age);
  if (!Number.isInteger(years) || years < 1 || years > 120) return undefined;
  if (years < 15) return 'U15';
  if (years < 19) return 'U19';
  if (years < 35) return 'Open';
  if (years < 45) return '35+';
  return '45+';
};

export const getTournamentLocation = (tournament) => {
  if (!tournament) return null;
  const tournamentText = normalize(
    [tournament.city, tournament.venue, tournament.address].filter(Boolean).join(' ')
  );
  return tournamentLocations.find((location) =>
    tournamentText.includes(normalize(location))
  ) || null;
};

export const getPlayerSelectedLocation = (player) => {
  for (const value of [player.club, player.city]) {
    const normalized = normalize(value);
    const location = tournamentLocations.find((item) =>
      normalized.includes(normalize(item))
    );
    if (location) return location;
  }
  return null;
};

export const isCategoryEligible = (category, player) => {
  const genderEligible =
    !category.gender ||
    category.gender === 'Any' ||
    category.gender === player.gender ||
    (category.gender === 'Mixed' && ['Male', 'Female'].includes(player.gender));
  const eligibleAgeGroups = ageGroupsForAge(player.age);
  const ageGroups = [...eligibleAgeGroups];
  if (
    ageGroups.length === 0 &&
    ['U15', 'U19', 'Open', '35+', '45+'].includes(player.ageGroup)
  ) {
    ageGroups.push(player.ageGroup);
  }
  const ageEligible =
    !category.ageGroup ||
    ageGroups.includes(category.ageGroup);

  return genderEligible && ageEligible;
};
