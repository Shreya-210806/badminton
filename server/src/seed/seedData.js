import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User,
  Player,
  Tournament,
  Team,
  Registration,
  Match,
  Payment,
  Notification,
  AuditLog,
  OrganizationSetting,
} from '../models/index.js';

dotenv.config();

export async function seedDatabase({ force = false } = {}) {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !force) {
    console.log('[Seed] Database already populated with', existingUsers, 'users. Skipping destructive seed.');
    return;
  }

  console.log('[Seed] Seeding Thane District Badminton Association & Tournament Management database...');

  await Promise.all([
    User.deleteMany({}),
    Player.deleteMany({}),
    Tournament.deleteMany({}),
    Team.deleteMany({}),
    Registration.deleteMany({}),
    Match.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    OrganizationSetting.deleteMany({}),
  ]);

  // 1. Organization Settings - Thane District Badminton Association
  await OrganizationSetting.create({
    singletonKey: 'default',
    organizationName: 'Thane District Badminton Association (TDBA)',
    shortName: 'Thane Badminton Circuit',
    tagline: 'Official Badminton Tournament Management & Player Circuit for Thane District, Maharashtra',
    supportEmail: 'contact@thanebadminton.org',
    supportPhone: '+91 98205 12345',
    headquarters: 'Dadoji Konddev Stadium, Kharkar Alley, Thane West, Maharashtra 400601',
    website: 'https://thanebadminton.org',
    accentColor: '#5B806B',
    primaryColor: '#243044',
    currency: 'INR',
    defaultCourtsCount: 6,
    paymentInstructions:
      'Pay via UPI (GPay/PhonePe/Paytm to tdba-tournaments@upi) or at the Venue Marshal Desk. Enter your 12-digit UPI UTR transaction reference number when confirming registration.',
  });

  // 2. Staff & Demo Users
  const [adminHash, orgHash, refHash, playerHash] = await Promise.all([
    User.hashPassword('Admin@123'),
    User.hashPassword('Organizer@123'),
    User.hashPassword('Referee@123'),
    User.hashPassword('Player@123'),
  ]);

  const adminUser = await User.create({
    name: 'Suhas Patil',
    email: 'admin@shuttlepulse.org',
    passwordHash: adminHash,
    role: 'admin',
    staffTitle: 'Thane District Tournament Director',
  });

  const organizerUser = await User.create({
    name: 'Pooja Kulkarni',
    email: 'organizer@shuttlepulse.org',
    passwordHash: orgHash,
    role: 'organizer',
    staffTitle: 'Head of District Fixtures & Desk',
  });

  const referee1 = await User.create({
    name: 'Mahesh Sawant',
    email: 'referee@shuttlepulse.org',
    passwordHash: refHash,
    role: 'referee',
    staffTitle: 'Chief District Umpire (Courts 1-2)',
  });

  const referee2 = await User.create({
    name: 'Anjali Deshmukh',
    email: 'referee2@shuttlepulse.org',
    passwordHash: refHash,
    role: 'referee',
    staffTitle: 'Senior Match Referee (Courts 3-4)',
  });

  // 3. Realistic Thane District Badminton Players
  const rawPlayers = [
    {
      name: 'Aditya Shinde',
      email: 'aditya.shinde@example.com',
      phone: '+91 98201 11223',
      gender: 'Male',
      ageGroup: 'Open',
      club: 'Dadoji Konddev Badminton Academy',
      city: 'Thane West',
      handedness: 'Right',
      skillLevel: 'Pro',
      rankingPoints: 1880,
      wins: 29,
      losses: 3,
      titles: 5,
      tags: ['Seeded #1', 'Thane District Champion', 'Singles Specialist'],
      crmStatus: 'vip',
      showEmail: true,
      bio: 'Reigning Thane District Open Men\'s Singles champion training out of Dadoji Konddev Stadium.',
    },
    {
      name: 'Tanvi Gokhale',
      email: 'tanvi.gokhale@example.com',
      phone: '+91 98334 44556',
      gender: 'Female',
      ageGroup: 'Open',
      club: 'Kalwa Smashers Sports Club',
      city: 'Kalwa',
      handedness: 'Right',
      skillLevel: 'Pro',
      rankingPoints: 1820,
      wins: 26,
      losses: 4,
      titles: 4,
      tags: ['Seeded #1', 'District Women Champion'],
      crmStatus: 'vip',
      showEmail: false,
      bio: 'Leading women\'s circuit contender representing Kalwa Smashers Sports Club.',
    },
    {
      name: 'Prathamesh Kadam',
      email: 'prathamesh.kadam@example.com',
      phone: '+91 98192 33445',
      gender: 'Male',
      ageGroup: 'Open',
      club: 'Dombivli Gymkhana Badminton Wing',
      city: 'Dombivli East',
      handedness: 'Left',
      skillLevel: 'Pro',
      rankingPoints: 1740,
      wins: 24,
      losses: 6,
      titles: 3,
      tags: ['Top 3', 'Left Hand Attack'],
      crmStatus: 'active',
      showEmail: false,
      bio: 'Aggressive southpaw attacker representing Dombivli Gymkhana.',
    },
    {
      name: 'Sayali Mhatre',
      email: 'sayali.mhatre@example.com',
      phone: '+91 98205 77889',
      gender: 'Female',
      ageGroup: 'Open',
      club: 'Subhash Chandra Bose Academy',
      city: 'Kalyan West',
      handedness: 'Right',
      skillLevel: 'Advanced',
      rankingPoints: 1680,
      wins: 21,
      losses: 5,
      titles: 2,
      tags: ['Doubles Specialist', 'Kalyan Lead'],
      crmStatus: 'active',
      showEmail: true,
      bio: 'Mixed doubles and women singles finalist across Kalyan & Thane circuits.',
    },
    {
      name: 'Rohan Salvi',
      email: 'rohan.salvi@example.com',
      phone: '+91 98210 99887',
      gender: 'Male',
      ageGroup: 'Open',
      club: 'Thane Central Shuttlers',
      city: 'Thane',
      handedness: 'Right',
      skillLevel: 'Advanced',
      rankingPoints: 1610,
      wins: 19,
      losses: 7,
      titles: 2,
      tags: ['Men Doubles', 'Team Captain'],
      crmStatus: 'active',
      showEmail: false,
      bio: 'Consistent rally player representing Thane Central Shuttlers.',
    },
    {
      name: 'Sneha Jadhav',
      email: 'sneha.jadhav@example.com',
      phone: '+91 97690 12345',
      gender: 'Female',
      ageGroup: 'U19',
      club: 'Mumbra Youth Sports Academy',
      city: 'Mumbra',
      handedness: 'Right',
      skillLevel: 'Advanced',
      rankingPoints: 1530,
      wins: 17,
      losses: 5,
      titles: 2,
      tags: ['Junior Prospect', 'U19 Finalist'],
      crmStatus: 'active',
      showEmail: false,
      bio: 'Junior district standout from Mumbra with exceptional net control.',
    },
    {
      name: 'Yashwardhan More',
      email: 'yash.more@example.com',
      phone: '+91 98691 67890',
      gender: 'Male',
      ageGroup: 'U19',
      club: 'Bhiwandi Racquet Club',
      city: 'Bhiwandi',
      handedness: 'Right',
      skillLevel: 'Advanced',
      rankingPoints: 1470,
      wins: 16,
      losses: 7,
      titles: 1,
      tags: ['U19', 'Junior Talent'],
      crmStatus: 'active',
      showEmail: false,
      bio: 'Fast-rising junior singles athlete representing Bhiwandi Racquet Club.',
    },
    {
      name: 'Ananya Prabhu',
      email: 'ananya.prabhu@example.com',
      phone: '+91 98202 54321',
      gender: 'Female',
      ageGroup: 'Open',
      club: 'Naupada Badminton Society',
      city: 'Thane West',
      handedness: 'Right',
      skillLevel: 'Advanced',
      rankingPoints: 1510,
      wins: 16,
      losses: 8,
      titles: 1,
      tags: ['Mixed Doubles Specialist'],
      crmStatus: 'active',
      showEmail: false,
      bio: 'Experienced mixed doubles player from Naupada, Thane.',
    },
    {
      name: 'Sanjay Deshmukh',
      email: 'sanjay.deshmukh@example.com',
      phone: '+91 98200 45678',
      gender: 'Male',
      ageGroup: '35+',
      club: 'Kalwa Veterans Shuttlers',
      city: 'Kalwa',
      handedness: 'Right',
      skillLevel: 'Advanced',
      rankingPoints: 1490,
      wins: 19,
      losses: 6,
      titles: 3,
      tags: ['Masters 35+', 'Veteran Champion'],
      crmStatus: 'active',
      showEmail: false,
      bio: 'Thane District Masters 35+ champion with 15 years competitive experience.',
    },
  ];

  const createdPlayers = [];
  for (let i = 0; i < rawPlayers.length; i++) {
    const rp = rawPlayers[i];
    const user = await User.create({
      name: rp.name,
      email: rp.email,
      passwordHash: playerHash,
      role: 'player',
    });

    const player = await Player.create({
      user: user._id,
      playerCode: `THN-${1000 + i}`,
      fullName: rp.name,
      email: rp.email,
      phone: rp.phone,
      gender: rp.gender,
      ageGroup: rp.ageGroup,
      club: rp.club,
      city: rp.city,
      handedness: rp.handedness,
      skillLevel: rp.skillLevel,
      rankingPoints: rp.rankingPoints,
      wins: rp.wins,
      losses: rp.losses,
      titles: rp.titles,
      tags: rp.tags,
      crmStatus: rp.crmStatus,
      bio: rp.bio,
    });
    createdPlayers.push({ user, player, raw: rp });
  }

  const daysFromNow = (d) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt;
  };

  // 4. Tournaments - Thane District Level Only
  const tournament1 = await Tournament.create({
    name: 'Thane District Badminton Championship 2026',
    slug: 'thane-district-badminton-championship-2026',
    subtitle: 'Official Thane District Annual Ranking & Inter-Taluka Showdown',
    bannerImage:
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=80',
    venue: 'Dadoji Konddev Indoor Stadium',
    address: 'Kharkar Alley, Near Castle Mill, Thane West, Maharashtra',
    city: 'Thane',
    startDate: daysFromNow(7),
    endDate: daysFromNow(10),
    registrationDeadline: daysFromNow(4),
    status: 'ongoing',
    registrationStatus: 'open',
    featured: true,
    prizePool: 75000,
    courtsCount: 6,
    shuttleType: 'Yonex Mavis 350 / Aerosensa 30 Feathers',
    description:
      'The premier annual badminton championship for players residing or training within Thane district. Featuring 6 wooden cushioned courts, electronic court scoring, and district ranking points.',
    rules: [
      'Matches strictly follow official BAI / BWF 3x21 rally point scoring rules.',
      'Only players from Thane district (Thane, Kalwa, Mumbra, Dombivli, Kalyan, Bhiwandi, Ulhasnagar) are eligible.',
      'Non-marking badminton indoor shoes are mandatory on all 6 stadium courts.',
      'Players must report to the Marshal Desk 20 minutes prior to scheduled match time; walkover strictly at 10 minutes.',
      'State & district ranking points awarded based on finishing stage.',
    ],
    categories: [
      {
        code: 'MS-OPEN',
        name: "Men's Singles Open (Thane District)",
        format: 'singles',
        gender: 'Male',
        ageGroup: 'Open',
        fee: 600,
        maxEntries: 32,
        prizeWinner: 15000,
      },
      {
        code: 'WS-OPEN',
        name: "Women's Singles Open (Thane District)",
        format: 'singles',
        gender: 'Female',
        ageGroup: 'Open',
        fee: 600,
        maxEntries: 24,
        prizeWinner: 15000,
      },
      {
        code: 'MD-OPEN',
        name: "Men's Doubles Open",
        format: 'doubles',
        gender: 'Male',
        ageGroup: 'Open',
        fee: 1000,
        maxEntries: 24,
        prizeWinner: 20000,
      },
      {
        code: 'XD-OPEN',
        name: 'Mixed Doubles Open',
        format: 'doubles',
        gender: 'Mixed',
        ageGroup: 'Open',
        fee: 1000,
        maxEntries: 20,
        prizeWinner: 15000,
      },
    ],
    sponsors: [
      { name: 'Thane Sports Authority', tier: 'Title', website: 'https://example.com' },
      { name: 'Maharashtra Badminton Equipment Co.', tier: 'Gold', website: 'https://example.com' },
      { name: 'Kalwa Smash Sports', tier: 'Official', website: 'https://example.com' },
    ],
    createdBy: adminUser._id,
  });

  const tournament2 = await Tournament.create({
    name: 'Kalyan-Dombivli Inter-Club Open 2026',
    slug: 'kalyan-dombivli-inter-club-open-2026',
    subtitle: 'KDMC Regional Club Championship & Junior Taluka Cup',
    bannerImage:
      'https://images.unsplash.com/photo-1626721105368-a69248e93b32?auto=format&fit=crop&w=1400&q=80',
    venue: 'Dombivli Gymkhana Sports Complex',
    address: 'MIDC Phase II, Dombivli East, Thane District, Maharashtra',
    city: 'Dombivli',
    startDate: daysFromNow(18),
    endDate: daysFromNow(20),
    registrationDeadline: daysFromNow(14),
    status: 'published',
    registrationStatus: 'open',
    featured: true,
    prizePool: 50000,
    courtsCount: 4,
    shuttleType: 'Yonex AS-20 Feather Shuttles',
    description:
      'Inter-club showdown welcoming all registered clubs and academies from Kalyan, Dombivli, Ambernath, and Badlapur across singles and doubles divisions.',
    rules: [
      'Standard 3x21 rally point system.',
      'Proof of residence or club affiliation in KDMC / Thane district required.',
      'Club jerseys with numbers recommended from Quarterfinals onward.',
    ],
    categories: [
      {
        code: 'MS-OPEN',
        name: "Men's Singles Open",
        format: 'singles',
        gender: 'Male',
        ageGroup: 'Open',
        fee: 500,
        maxEntries: 24,
        prizeWinner: 12000,
      },
      {
        code: 'MD-OPEN',
        name: "Men's Doubles Open",
        format: 'doubles',
        gender: 'Male',
        ageGroup: 'Open',
        fee: 900,
        maxEntries: 16,
        prizeWinner: 16000,
      },
      {
        code: 'U19-BOYS',
        name: 'Boys Singles U-19',
        format: 'singles',
        gender: 'Male',
        ageGroup: 'U19',
        fee: 400,
        maxEntries: 20,
        prizeWinner: 8000,
      },
    ],
    sponsors: [
      { name: 'Dombivli Gymkhana Sports Wing', tier: 'Title', website: 'https://example.com' },
      { name: 'Apex Sports Kalyan', tier: 'Official', website: 'https://example.com' },
    ],
    createdBy: organizerUser._id,
  });

  const tournament3 = await Tournament.create({
    name: 'Thane District Junior & Cadets Championship',
    slug: 'thane-district-junior-cadets-championship',
    subtitle: 'Dedicated U15 & U19 District Ranking Selection Tournament',
    bannerImage:
      'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?auto=format&fit=crop&w=1400&q=80',
    venue: 'Subhash Chandra Bose Sports Stadium',
    address: 'Near Birla College, Kalyan West, Thane District, Maharashtra',
    city: 'Kalyan',
    startDate: daysFromNow(32),
    endDate: daysFromNow(34),
    registrationDeadline: daysFromNow(26),
    status: 'published',
    registrationStatus: 'open',
    featured: false,
    prizePool: 35000,
    courtsCount: 4,
    description:
      'Official junior ranking tournament to shortlist district candidates for the Maharashtra State Badminton Championship squad.',
    rules: [
      'Age verification via municipal birth certificate mandatory.',
      'Only players residing or schooling in Thane district permitted.',
    ],
    categories: [
      {
        code: 'U15-BOYS',
        name: 'Boys Singles U-15',
        format: 'singles',
        gender: 'Male',
        ageGroup: 'U15',
        fee: 400,
        maxEntries: 24,
        prizeWinner: 7000,
      },
      {
        code: 'U19-GIRLS',
        name: 'Girls Singles U-19',
        format: 'singles',
        gender: 'Female',
        ageGroup: 'U19',
        fee: 400,
        maxEntries: 16,
        prizeWinner: 7000,
      },
    ],
    createdBy: adminUser._id,
  });

  const tournament4 = await Tournament.create({
    name: 'Kalwa-Mumbra Badminton Premier Cup',
    slug: 'kalwa-mumbra-badminton-premier-cup',
    subtitle: 'High-Pace Weekend Knockout Series',
    bannerImage:
      'https://images.unsplash.com/photo-1542308743-d21b236ab3f0?auto=format&fit=crop&w=1400&q=80',
    venue: 'Kalwa Sports Complex',
    address: 'Station Road, Kalwa, Thane, Maharashtra',
    city: 'Kalwa',
    startDate: daysFromNow(-14),
    endDate: daysFromNow(-11),
    registrationDeadline: daysFromNow(-18),
    status: 'completed',
    registrationStatus: 'closed',
    featured: false,
    prizePool: 40000,
    courtsCount: 4,
    description:
      'Completed season tournament that crowned Thane district open doubles champions and verified ranking points.',
    rules: ['BAI / BWF 3x21 rules applied.'],
    categories: [
      {
        code: 'MS-OPEN',
        name: "Men's Singles Open",
        format: 'singles',
        gender: 'Male',
        ageGroup: 'Open',
        fee: 500,
        maxEntries: 16,
        prizeWinner: 10000,
      },
      {
        code: 'MD-OPEN',
        name: "Men's Doubles Open",
        format: 'doubles',
        gender: 'Male',
        ageGroup: 'Open',
        fee: 800,
        maxEntries: 12,
        prizeWinner: 15000,
      },
    ],
    createdBy: adminUser._id,
  });

  // 5. Teams (Doubles pairs from Thane District)
  const team1 = await Team.create({
    teamCode: 'TM-THN-101',
    name: 'Aditya Shinde / Rohan Salvi',
    categoryCode: 'MD-OPEN',
    tournament: tournament1._id,
    player1: createdPlayers[0].player._id,
    player2: createdPlayers[4].player._id,
    club: 'Thane Central / Dadoji Stadium',
    seedNumber: 1,
    status: 'confirmed',
  });

  const team2 = await Team.create({
    teamCode: 'TM-THN-102',
    name: 'Prathamesh Kadam / Sanjay Deshmukh',
    categoryCode: 'MD-OPEN',
    tournament: tournament1._id,
    player1: createdPlayers[2].player._id,
    player2: createdPlayers[8].player._id,
    club: 'Dombivli Gymkhana / Kalwa',
    seedNumber: 2,
    status: 'confirmed',
  });

  const team3 = await Team.create({
    teamCode: 'TM-THN-103',
    name: 'Aditya Shinde / Tanvi Gokhale',
    categoryCode: 'XD-OPEN',
    tournament: tournament1._id,
    player1: createdPlayers[0].player._id,
    player2: createdPlayers[1].player._id,
    club: 'Dadoji / Kalwa Smashers',
    seedNumber: 1,
    status: 'confirmed',
  });

  const team4 = await Team.create({
    teamCode: 'TM-THN-104',
    name: 'Prathamesh Kadam / Sayali Mhatre',
    categoryCode: 'XD-OPEN',
    tournament: tournament1._id,
    player1: createdPlayers[2].player._id,
    player2: createdPlayers[3].player._id,
    club: 'Dombivli / Kalyan Academy',
    seedNumber: 2,
    status: 'confirmed',
  });

  // 6. Registrations
  for (let i = 0; i < createdPlayers.length; i++) {
    const cp = createdPlayers[i];
    await Registration.create({
      registrationNumber: `REG-THN-2026-${1000 + i}`,
      tournament: tournament1._id,
      categoryCode: cp.raw.gender === 'Female' ? 'WS-OPEN' : 'MS-OPEN',
      categoryName: cp.raw.gender === 'Female' ? "Women's Singles Open" : "Men's Singles Open",
      format: 'singles',
      player: cp.player._id,
      user: cp.user._id,
      emergencyContact: {
        name: 'Family Contact',
        relation: 'Parent / Guardian',
        phone: cp.raw.phone,
      },
      status: 'approved',
      paymentStatus: 'paid',
      feeAmount: 600,
      seedNumber: i === 0 || i === 1 ? 1 : i === 2 ? 2 : null,
    });
  }

  // 7. Matches (Thane District Level Matches & Live Court Scores)
  // Match 1: Completed Semifinal
  await Match.create({
    matchCode: 'THN-MS-SF1',
    tournament: tournament1._id,
    categoryCode: 'MS-OPEN',
    categoryName: "Men's Singles Open (Thane District)",
    format: 'singles',
    round: 'Semifinal',
    roundOrder: 3,
    matchNumber: 1,
    court: 'Court 1',
    scheduledAt: new Date(Date.now() - 3600000 * 3),
    status: 'completed',
    sideA: {
      player: createdPlayers[0].player._id,
      label: 'Aditya Shinde',
      club: 'Dadoji Konddev Stadium, Thane',
      seed: 1,
    },
    sideB: {
      player: createdPlayers[4].player._id,
      label: 'Rohan Salvi',
      club: 'Thane Central Shuttlers',
      seed: 4,
    },
    scores: [
      { gameNumber: 1, scoreA: 21, scoreB: 16 },
      { gameNumber: 2, scoreA: 21, scoreB: 18 },
    ],
    servingSide: 'A',
    winnerSide: 'A',
    assignedReferee: referee1._id,
    published: true,
    durationMinutes: 44,
    completedAt: new Date(Date.now() - 3600000 * 2),
    notes: 'Aditya Shinde advances to Thane District Final.',
  });

  // Match 2: Live Semifinal 2
  await Match.create({
    matchCode: 'THN-MS-SF2',
    tournament: tournament1._id,
    categoryCode: 'MS-OPEN',
    categoryName: "Men's Singles Open (Thane District)",
    format: 'singles',
    round: 'Semifinal',
    roundOrder: 3,
    matchNumber: 2,
    court: 'Court 1',
    scheduledAt: new Date(Date.now() - 1800000),
    status: 'live',
    sideA: {
      player: createdPlayers[2].player._id,
      label: 'Prathamesh Kadam',
      club: 'Dombivli Gymkhana',
      seed: 2,
    },
    sideB: {
      player: createdPlayers[6].player._id,
      label: 'Yashwardhan More',
      club: 'Bhiwandi Racquet Club',
      seed: 3,
    },
    scores: [
      { gameNumber: 1, scoreA: 21, scoreB: 19 },
      { gameNumber: 2, scoreA: 18, scoreB: 21 },
      { gameNumber: 3, scoreA: 14, scoreB: 11 },
    ],
    servingSide: 'A',
    winnerSide: null,
    assignedReferee: referee1._id,
    published: true,
    durationMinutes: 52,
    notes: 'Game 3 in progress on Court 1 (Dadoji Stadium).',
  });

  // Match 3: Live Mixed Doubles Final
  await Match.create({
    matchCode: 'THN-XD-F1',
    tournament: tournament1._id,
    categoryCode: 'XD-OPEN',
    categoryName: 'Mixed Doubles Open',
    format: 'doubles',
    round: 'Final',
    roundOrder: 4,
    matchNumber: 1,
    court: 'Court 2',
    scheduledAt: new Date(Date.now() - 1200000),
    status: 'live',
    sideA: {
      team: team3._id,
      label: 'Aditya Shinde / Tanvi Gokhale',
      club: 'Thane / Kalwa',
      seed: 1,
    },
    sideB: {
      team: team4._id,
      label: 'Prathamesh Kadam / Sayali Mhatre',
      club: 'Dombivli / Kalyan',
      seed: 2,
    },
    scores: [
      { gameNumber: 1, scoreA: 21, scoreB: 17 },
      { gameNumber: 2, scoreA: 19, scoreB: 16 },
    ],
    servingSide: 'A',
    winnerSide: null,
    assignedReferee: referee2._id,
    published: true,
    durationMinutes: 38,
    notes: 'Thane Mixed Doubles Championship Final on Court 2.',
  });

  // Match 4: Scheduled Men's Singles Final
  await Match.create({
    matchCode: 'THN-MS-F1',
    tournament: tournament1._id,
    categoryCode: 'MS-OPEN',
    categoryName: "Men's Singles Open (Thane District)",
    format: 'singles',
    round: 'Final',
    roundOrder: 4,
    matchNumber: 1,
    court: 'Center Court 1',
    scheduledAt: daysFromNow(1),
    status: 'scheduled',
    sideA: {
      player: createdPlayers[0].player._id,
      label: 'Aditya Shinde',
      club: 'Dadoji Konddev Stadium, Thane',
      seed: 1,
    },
    sideB: {
      label: 'Winner of SF2 (Prathamesh Kadam / Yashwardhan More)',
      club: 'Dombivli / Bhiwandi',
    },
    scores: [],
    servingSide: 'A',
    assignedReferee: referee1._id,
    published: true,
    notes: 'Thane District Grand Finale scheduled for Sunday 5:00 PM.',
  });

  console.log('[Seed] Thane District Badminton Tournament & CRM seed complete!');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  connectDB()
    .then(() => seedDatabase({ force: true }))
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}
