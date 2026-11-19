import { sendBulkEmail } from '../utils/mailer.js';
import {
  User,
  Player,
  Tournament,
  Registration,
  Team,
  Match,
  Payment,
  Notification,
  AuditLog,
  OrganizationSetting,
  TournamentUpdate,
} from '../models/index.js';
import { recordAudit } from '../utils/auditLogger.js';
import { toCsv } from '../utils/csvExport.js';
import { isThaneDistrictLocation } from '../utils/thaneLocations.js';

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const nextCode = (prefix) =>
  `${prefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

const notifyApprovedTournamentPlayers = async (tournamentId, title, message, sentBy) => {
  const registrations = await Registration.find({
    tournament: tournamentId,
    status: 'approved',
  }).populate('player', 'user');
  const recipientUsers = [
    ...new Map(
      registrations
        .map((registration) => registration.user || registration.player?.user)
        .filter(Boolean)
        .map((userId) => [String(userId), userId])
    ).values(),
  ];

  if (!recipientUsers.length) return;

  await Notification.create({
    title,
    message,
    type: 'schedule',
    audience: 'individual',
    tournament: tournamentId,
    recipientUsers,
    recipientCount: recipientUsers.length,
    sentBy,
  });
};

// 1. OVERVIEW METRICS
export const getCrmOverview = async (_req, res, next) => {
  try {
    const [
      totalPlayers,
      activeTournaments,
      totalRegistrations,
      pendingRegistrations,
      pendingPaymentsCount,
      paidPayments,
      upcomingMatches,
      liveMatchesCount,
      recentAudit,
      registrationsByStatus,
    ] = await Promise.all([
      Player.countDocuments(),
      Tournament.countDocuments({ status: { $in: ['published', 'ongoing'] } }),
      Registration.countDocuments(),
      Registration.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.find({ status: 'paid' }).select('amount'),
      Match.find({ status: { $in: ['scheduled', 'live'] } })
        .populate('tournament', 'name slug')
        .populate('assignedReferee', 'name')
        .sort({ status: 1, scheduledAt: 1 })
        .limit(8),
      Match.countDocuments({ status: 'live' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
      Registration.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.json({
      success: true,
      metrics: {
        totalPlayers,
        activeTournaments,
        totalRegistrations,
        pendingRegistrations,
        pendingPayments: pendingPaymentsCount,
        totalRevenue,
        upcomingMatchesCount: upcomingMatches.length,
        liveMatchesCount,
      },
      registrationsByStatus,
      upcomingMatches,
      recentAudit,
    });
  } catch (err) {
    next(err);
  }
};

// 2. PLAYER CRM
export const listCrmPlayers = async (req, res, next) => {
  try {
    const { search = '', status = '', tag = '', ageGroup = '' } = req.query;
    const filter = {};

    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [
        { fullName: rx },
        { email: rx },
        { phone: rx },
        { club: rx },
        { playerCode: rx },
      ];
    }
    if (status) filter['crm.status'] = status;
    if (tag) filter['crm.tags'] = tag;
    if (ageGroup) filter.ageGroup = ageGroup;

    const players = await Player.find(filter).sort({ createdAt: -1 });
    const playerIds = players.map((p) => p._id);

    const regs = await Registration.find({
      $or: [{ player: { $in: playerIds } }, { partner: { $in: playerIds } }],
    })
      .populate('tournament', 'name startDate status')
      .sort({ createdAt: -1 });

    const regMap = new Map();
    regs.forEach((r) => {
      const p1 = String(r.player);
      const p2 = r.partner ? String(r.partner) : null;
      if (!regMap.has(p1)) regMap.set(p1, []);
      regMap.get(p1).push(r);
      if (p2) {
        if (!regMap.has(p2)) regMap.set(p2, []);
        regMap.get(p2).push(r);
      }
    });

    const enriched = players.map((p) => {
      const obj = p.toObject();
      obj.registrationHistory = regMap.get(String(p._id)) || [];
      return obj;
    });

    res.json({ success: true, count: enriched.length, players: enriched });
  } catch (err) {
    next(err);
  }
};

export const createCrmPlayer = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone = '',
      gender = 'Male',
      ageGroup = 'Open',
      club = 'Independent',
      city = '',
      skillLevel = 'Intermediate',
      tags = [],
      crmStatus = 'active',
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Player.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A player record with this email already exists in the CRM.',
      });
    }

    const player = await Player.create({
      playerCode: `PL-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone,
      gender,
      ageGroup,
      club,
      city,
      skillLevel,
      crm: {
        status: crmStatus,
        tags: Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()).filter(Boolean),
        notes: [],
        contactPreferences: { emailUpdates: true, smsUpdates: false, marketing: false },
      },
    });

    await recordAudit({
      req,
      action: 'PLAYER_CREATE',
      entityType: 'Player',
      entityId: player._id,
      summary: `Created CRM player profile for ${player.fullName} (${player.playerCode})`,
    });

    res.status(201).json({ success: true, message: 'Player added to CRM.', player });
  } catch (err) {
    next(err);
  }
};

export const updateCrmPlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    const fields = [
      'fullName',
      'phone',
      'gender',
      'ageGroup',
      'club',
      'city',
      'handedness',
      'skillLevel',
      'rankingPoints',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) player[f] = req.body[f];
    });

    if (req.body.crmStatus) {
      player.crm.status = req.body.crmStatus;
    }
    if (req.body.tags !== undefined) {
      player.crm.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((t) => String(t).trim()).filter(Boolean)
        : String(req.body.tags)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
    }
    if (req.body.contactPreferences) {
      player.crm.contactPreferences = {
        ...player.crm.contactPreferences,
        ...req.body.contactPreferences,
      };
    }

    await player.save();

    await recordAudit({
      req,
      action: 'PLAYER_UPDATE',
      entityType: 'Player',
      entityId: player._id,
      summary: `Updated CRM profile for ${player.fullName} (status: ${player.crm.status})`,
    });

    res.json({ success: true, message: 'Player CRM record updated.', player });
  } catch (err) {
    next(err);
  }
};

export const addCrmPlayerNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required.' });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    player.crm.notes.unshift({
      text: text.trim(),
      authorName: req.user.name,
      authorId: req.user._id,
    });
    await player.save();

    await recordAudit({
      req,
      action: 'PLAYER_NOTE_ADD',
      entityType: 'Player',
      entityId: player._id,
      summary: `Added CRM note on ${player.fullName}`,
    });

    res.status(201).json({ success: true, message: 'CRM note added.', player });
  } catch (err) {
    next(err);
  }
};

// 3. TOURNAMENT MANAGEMENT
export const listCrmTournaments = async (_req, res, next) => {
  try {
    const tournaments = await Tournament.find().sort({ startDate: -1 });
    const regCounts = await Registration.aggregate([
      {
        $match: { status: { $nin: ['rejected', 'cancelled'] } },
      },
      {
        $group: {
          _id: '$tournament',
          count: { $sum: 1 },
        },
      },
    ]);
    const countMap = new Map(regCounts.map((r) => [String(r._id), r.count]));

    const enriched = tournaments.map((t) => {
      const obj = t.toObject();
      obj.activeRegistrations = countMap.get(String(t._id)) || 0;
      return obj;
    });

    res.json({ success: true, tournaments: enriched });
  } catch (err) {
    next(err);
  }
};

export const createCrmTournament = async (req, res, next) => {
  try {
    const {
      name,
      subtitle = '',
      bannerImage = '',
      venue,
      address = '',
      city,
      startDate,
      endDate,
      registrationDeadline,
      status = 'published',
      registrationStatus = 'open',
      description,
      rules = [],
      shuttleType = 'BWF Approved Feather Grade 1',
      courtsCount = 6,
      prizePool = 5000,
      featured = false,
      categories = [],
      sponsors = [],
    } = req.body;

    if (!isThaneDistrictLocation(city) && !isThaneDistrictLocation(venue) && !isThaneDistrictLocation(address)) {
      return res.status(400).json({
        success: false,
        message: 'Restriction: Only Thane District locations (Thane, Kalyan, Dombivli, Bhiwandi, Ulhasnagar, Ambernath, Badlapur, Kalwa, Mumbra, etc.) are allowed for tournaments.',
      });
    }

    const baseSlug = slugify(name);
    const exists = await Tournament.findOne({ slug: baseSlug });
    const slug = exists ? `${baseSlug}-${Math.floor(100 + Math.random() * 900)}` : baseSlug;

    const normalizedRules = Array.isArray(rules)
      ? rules.filter(Boolean)
      : String(rules)
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

    const tournament = await Tournament.create({
      name: name.trim(),
      slug,
      subtitle,
      bannerImage,
      venue,
      address,
      city,
      startDate,
      endDate,
      registrationDeadline,
      status,
      registrationStatus,
      description,
      rules: normalizedRules,
      shuttleType,
      courtsCount: Number(courtsCount) || 6,
      prizePool: Number(prizePool) || 0,
      featured: Boolean(featured),
      categories,
      sponsors,
      createdBy: req.user._id,
    });

    await recordAudit({
      req,
      action: 'TOURNAMENT_CREATE',
      entityType: 'Tournament',
      entityId: tournament._id,
      summary: `Created tournament "${tournament.name}" (${tournament.status})`,
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully.',
      tournament,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCrmTournament = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (req.body.city || req.body.venue || req.body.address) {
      const cityCheck = req.body.city || tournament.city;
      const venueCheck = req.body.venue || tournament.venue;
      const addressCheck = req.body.address || tournament.address;
      if (!isThaneDistrictLocation(cityCheck) && !isThaneDistrictLocation(venueCheck) && !isThaneDistrictLocation(addressCheck)) {
        return res.status(400).json({
          success: false,
          message: 'Restriction: Only Thane District locations are allowed for tournaments.',
        });
      }
    }

    const updatable = [
      'name',
      'subtitle',
      'bannerImage',
      'venue',
      'address',
      'city',
      'startDate',
      'endDate',
      'registrationDeadline',
      'status',
      'registrationStatus',
      'description',
      'shuttleType',
      'courtsCount',
      'prizePool',
      'featured',
      'categories',
      'sponsors',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        tournament[field] = req.body[field];
      }
    });

    if (req.body.rules !== undefined) {
      tournament.rules = Array.isArray(req.body.rules)
        ? req.body.rules.filter(Boolean)
        : String(req.body.rules)
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean);
    }

    await tournament.save();

    await recordAudit({
      req,
      action: 'TOURNAMENT_UPDATE',
      entityType: 'Tournament',
      entityId: tournament._id,
      summary: `Updated tournament "${tournament.name}" [status=${tournament.status}, reg=${tournament.registrationStatus}]`,
    });

    res.json({
      success: true,
      message: 'Tournament updated successfully.',
      tournament,
    });
  } catch (err) {
    next(err);
  }
};

// 4. REGISTRATION MANAGEMENT
export const listCrmRegistrations = async (req, res, next) => {
  try {
    const { tournament = '', status = '', paymentStatus = '', categoryCode = '', search = '' } = req.query;
    const filter = {};
    if (tournament) filter.tournament = tournament;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (categoryCode) filter.categoryCode = categoryCode;

    let regs = await Registration.find(filter)
      .populate('tournament', 'name slug startDate')
      .populate('player', 'fullName email phone club gender ageGroup playerCode')
      .populate('partner', 'fullName email club')
      .populate('team', 'name teamCode status')
      .sort({ createdAt: -1 });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      regs = regs.filter(
        (r) =>
          r.registrationNumber.toLowerCase().includes(q) ||
          r.player?.fullName?.toLowerCase().includes(q) ||
          r.player?.email?.toLowerCase().includes(q) ||
          r.partnerDetails?.name?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: regs.length, registrations: regs });
  } catch (err) {
    next(err);
  }
};

export const updateCrmRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, seedNumber, notes } = req.body;

    const reg = await Registration.findById(id)
      .populate('tournament', 'name')
      .populate('player', 'fullName user');

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    if (status) reg.status = status;
    if (paymentStatus) reg.paymentStatus = paymentStatus;
    if (seedNumber !== undefined) reg.seedNumber = seedNumber === '' || seedNumber === null ? null : Number(seedNumber);
    if (notes !== undefined) reg.notes = notes;
    await reg.save();

    if (paymentStatus === 'paid') {
      await Payment.findOneAndUpdate(
        { registration: reg._id },
        { status: 'paid', paidAt: new Date(), recordedBy: req.user._id }
      );
    }

    if (reg.user || reg.player?.user) {
      const targetUser = reg.user || reg.player.user;
      await Notification.create({
        title: `Registration Update: ${reg.registrationNumber}`,
        message: `Your registration for ${reg.tournament?.name} (${reg.categoryName}) is now "${reg.status.toUpperCase()}" (Payment: ${reg.paymentStatus.toUpperCase()}).`,
        type: 'registration',
        audience: 'individual',
        tournament: reg.tournament?._id,
        recipientUsers: [targetUser],
        recipientCount: 1,
        sentBy: req.user._id,
      });
    }

    await recordAudit({
      req,
      action: 'REGISTRATION_UPDATE',
      entityType: 'Registration',
      entityId: reg._id,
      summary: `Updated ${reg.registrationNumber} (${reg.player?.fullName}) -> status=${reg.status}, payment=${reg.paymentStatus}`,
    });

    res.json({ success: true, message: 'Registration updated.', registration: reg });
  } catch (err) {
    next(err);
  }
};

// 5. DOUBLES TEAM MANAGEMENT
export const listCrmTeams = async (req, res, next) => {
  try {
    const { tournament = '', categoryCode = '' } = req.query;
    const filter = {};
    if (tournament) filter.tournament = tournament;
    if (categoryCode) filter.categoryCode = categoryCode;

    const teams = await Team.find(filter)
      .populate('tournament', 'name slug')
      .populate('player1', 'fullName email club gender playerCode')
      .populate('player2', 'fullName email club gender playerCode')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: teams.length, teams });
  } catch (err) {
    next(err);
  }
};

export const createOrLinkTeam = async (req, res, next) => {
  try {
    const { tournamentId, categoryCode, player1Id, player2Id, seedNumber = null } = req.body;

    if (String(player1Id) === String(player2Id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doubles team: Player 1 and Player 2 cannot be the same person.',
      });
    }

    const [tournament, p1, p2] = await Promise.all([
      Tournament.findById(tournamentId),
      Player.findById(player1Id),
      Player.findById(player2Id),
    ]);

    if (!tournament || !p1 || !p2) {
      return res.status(404).json({
        success: false,
        message: 'Tournament or one of the selected players could not be found.',
      });
    }

    const category = tournament.categories.find((c) => c.code === categoryCode);
    if (!category || category.format !== 'doubles') {
      return res.status(400).json({
        success: false,
        message: 'Selected category must be a valid Doubles category in this tournament.',
      });
    }

    // Validate gender rules for Men's/Women's/Mixed Doubles
    if (
      category.gender === 'Mixed' &&
      p1.gender !== 'Other' &&
      p2.gender !== 'Other' &&
      p1.gender === p2.gender
    ) {
      return res.status(400).json({
        success: false,
        message: 'Mixed Doubles requires one Male and one Female player.',
      });
    }
    if (
      (category.gender === 'Male' || category.gender === 'Female') &&
      ((p1.gender !== 'Other' && p1.gender !== category.gender) ||
        (p2.gender !== 'Other' && p2.gender !== category.gender))
    ) {
      return res.status(400).json({
        success: false,
        message: `${category.name} requires both partners to be ${category.gender}.`,
      });
    }

    // Prevent either player from appearing in multiple active teams in the same tournament + category
    const conflictTeam = await Team.findOne({
      tournament: tournament._id,
      categoryCode,
      status: { $ne: 'disbanded' },
      $or: [
        { player1: { $in: [p1._id, p2._id] } },
        { player2: { $in: [p1._id, p2._id] } },
      ],
    });

    if (conflictTeam) {
      return res.status(409).json({
        success: false,
        message: `Duplicate entry prevented: One of these players is already paired in "${conflictTeam.name}" for ${category.name}.`,
      });
    }

    const team = await Team.create({
      teamCode: nextCode('TM'),
      name: `${p1.fullName} / ${p2.fullName}`,
      tournament: tournament._id,
      categoryCode,
      categoryName: category.name,
      player1: p1._id,
      player2: p2._id,
      partnerDetails: {
        name: p2.fullName,
        email: p2.email,
        phone: p2.phone,
        club: p2.club,
      },
      status: 'confirmed',
      seedNumber: seedNumber ? Number(seedNumber) : null,
    });

    // Link existing pending registration if any
    await Registration.updateMany(
      {
        tournament: tournament._id,
        categoryCode,
        player: p1._id,
      },
      {
        $set: { partner: p2._id, team: team._id },
      }
    );

    await recordAudit({
      req,
      action: 'TEAM_CREATE',
      entityType: 'Team',
      entityId: team._id,
      summary: `Linked doubles team "${team.name}" in ${tournament.name} (${category.code})`,
    });

    const populated = await Team.findById(team._id)
      .populate('tournament', 'name slug')
      .populate('player1', 'fullName email club gender')
      .populate('player2', 'fullName email club gender');

    res.status(201).json({
      success: true,
      message: 'Doubles team linked and validated.',
      team: populated,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCrmTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { player2Id, status, seedNumber } = req.body;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (player2Id) {
      if (String(team.player1) === String(player2Id)) {
        return res.status(400).json({
          success: false,
          message: 'Player cannot partner with themselves.',
        });
      }
      const p1 = await Player.findById(team.player1);
      const p2 = await Player.findById(player2Id);
      if (!p2) {
        return res.status(404).json({ success: false, message: 'Partner player not found.' });
      }
      team.player2 = p2._id;
      team.name = `${p1.fullName} / ${p2.fullName}`;
      team.partnerDetails = {
        name: p2.fullName,
        email: p2.email,
        phone: p2.phone,
        club: p2.club,
      };
      team.status = 'confirmed';
    }

    if (status) team.status = status;
    if (seedNumber !== undefined) {
      team.seedNumber = seedNumber === '' || seedNumber === null ? null : Number(seedNumber);
    }
    await team.save();

    await recordAudit({
      req,
      action: 'TEAM_UPDATE',
      entityType: 'Team',
      entityId: team._id,
      summary: `Updated team "${team.name}" (${team.status})`,
    });

    res.json({ success: true, message: 'Doubles team updated.', team });
  } catch (err) {
    next(err);
  }
};

// 6. DRAW & FIXTURE MANAGEMENT
export const generateCategoryDraw = async (req, res, next) => {
  try {
    const {
      tournamentId,
      categoryCode,
      startTime,
      courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'],
      refereeId = null,
      replaceExisting = false,
    } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    const category = tournament.categories.find((c) => c.code === categoryCode);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found in tournament.' });
    }

    const existingMatches = await Match.countDocuments({
      tournament: tournament._id,
      categoryCode,
    });
    if (existingMatches > 0 && !replaceExisting) {
      return res.status(409).json({
        success: false,
        message: `A draw already exists for ${category.name} (${existingMatches} matches). Enable "Replace existing draw" to regenerate.`,
      });
    }

    const approvedRegs = await Registration.find({
      tournament: tournament._id,
      categoryCode,
      status: 'approved',
    })
      .populate('player', 'fullName club rankingPoints')
      .populate('team', 'name');

    if (approvedRegs.length < 2) {
      return res.status(400).json({
        success: false,
        message: `At least 2 approved registrations are required in ${category.name} to generate a draw (currently ${approvedRegs.length}).`,
      });
    }

    if (replaceExisting) {
      await Match.deleteMany({ tournament: tournament._id, categoryCode });
    }

    // Sort seeded players first, then by ranking points
    const sorted = [...approvedRegs].sort((a, b) => {
      if (a.seedNumber && b.seedNumber) return a.seedNumber - b.seedNumber;
      if (a.seedNumber) return -1;
      if (b.seedNumber) return 1;
      return (b.player?.rankingPoints || 1000) - (a.player?.rankingPoints || 1000);
    });

    const entries = sorted.map((r, idx) => ({
      player: category.format === 'singles' ? r.player?._id : null,
      team: category.format === 'doubles' ? r.team?._id : null,
      label:
        category.format === 'doubles'
          ? r.team?.name || `${r.player?.fullName} / ${r.partnerDetails?.name || 'Partner'}`
          : r.player?.fullName || 'Player',
      club: r.player?.club || '',
      seed: r.seedNumber || (idx < 4 ? idx + 1 : null),
    }));

    // Determine next power of 2 bracket size (e.g. 2, 4, 8, 16, 32, 64)
    const numEntries = entries.length;
    let bracketSize = 2;
    while (bracketSize < numEntries) {
      bracketSize *= 2;
    }

    // Standard bracket position generation to place BYEs against top seeds
    // Standard seed order recursively
    const getSeedOrder = (size) => {
      let order = [1, 2];
      while (order.length < size) {
        const nextOrder = [];
        const currentSum = order.length * 2 + 1;
        for (const seed of order) {
          nextOrder.push(seed);
          nextOrder.push(currentSum - seed);
        }
        order = nextOrder;
      }
      return order;
    };

    const seedPositions = getSeedOrder(bracketSize);
    // Map entries to bracket slots according to seed order
    // entries[0...numEntries-1] get assigned to seeds 1...numEntries
    // Remaining slots (numEntries+1 ... bracketSize) become BYEs
    const bracketSlots = seedPositions.map((seedNum) => {
      if (seedNum <= numEntries) {
        return entries[seedNum - 1];
      }
      return { player: null, team: null, label: 'BYE', club: '', seed: null };
    });

    // Form initial pairs for Round 1
    const pairs = [];
    for (let i = 0; i < bracketSize; i += 2) {
      pairs.push([bracketSlots[i], bracketSlots[i + 1]]);
    }

    // Determine round names and orders
    const getRoundInfo = (roundParticipants) => {
      if (roundParticipants === 2) return { name: 'Final', order: 5, prefix: 'F' };
      if (roundParticipants === 4) return { name: 'Semifinal', order: 4, prefix: 'SF' };
      if (roundParticipants === 8) return { name: 'Quarterfinal', order: 3, prefix: 'QF' };
      if (roundParticipants === 16) return { name: 'Round of 16', order: 2, prefix: 'R16' };
      if (roundParticipants === 32) return { name: 'Round of 32', order: 1, prefix: 'R32' };
      return { name: `Round of ${roundParticipants}`, order: 0, prefix: `R${roundParticipants}` };
    };

    const baseDate = startTime ? new Date(startTime) : new Date(tournament.startDate);
    const courtList = Array.isArray(courts) && courts.length > 0 ? courts : ['Court 1', 'Court 2'];
    const prefix = `${categoryCode.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`;

    // Build tournament rounds structure from first round up to Final
    // Total rounds = log2(bracketSize)
    const totalRounds = Math.log2(bracketSize);
    const roundMatchesMap = []; // Array of arrays of match objects per round

    let currentMatchCount = bracketSize / 2;
    let roundIndex = 0;
    let matchTimeOffsetMinutes = 0;

    for (let rSize = bracketSize; rSize >= 2; rSize /= 2) {
      const matchCountInRound = rSize / 2;
      const { name: roundName, order: roundOrder, prefix: rPrefix } = getRoundInfo(rSize);
      const matchesInThisRound = [];

      for (let m = 0; m < matchCountInRound; m++) {
        const matchCode = `${prefix}-${rPrefix}${m + 1}`;
        const matchData = {
          matchCode,
          tournament: tournament._id,
          categoryCode,
          categoryName: category.name,
          format: category.format,
          round: roundName,
          roundOrder,
          matchNumber: m + 1,
          court: courtList[m % courtList.length],
          scheduledAt: new Date(baseDate.getTime() + matchTimeOffsetMinutes * 60000),
          sideA: { label: 'TBD' },
          sideB: { label: 'TBD' },
          assignedReferee: refereeId || null,
          status: 'scheduled',
          nextMatchCode: null,
          nextMatchSlot: null,
        };
        matchesInThisRound.push(matchData);
        matchTimeOffsetMinutes += 30;
      }
      roundMatchesMap.push(matchesInThisRound);
      roundIndex++;
    }

    // Link nextMatchCode and nextMatchSlot between consecutive rounds
    for (let r = 0; r < roundMatchesMap.length - 1; r++) {
      const currentRound = roundMatchesMap[r];
      const nextRound = roundMatchesMap[r + 1];
      for (let m = 0; m < currentRound.length; m++) {
        const parentMatchIndex = Math.floor(m / 2);
        currentRound[m].nextMatchCode = nextRound[parentMatchIndex].matchCode;
        currentRound[m].nextMatchSlot = m % 2 === 0 ? 'A' : 'B';
      }
    }

    // Populate Round 1 matches with pairs
    const firstRound = roundMatchesMap[0];
    for (let m = 0; m < firstRound.length; m++) {
      firstRound[m].sideA = pairs[m][0];
      firstRound[m].sideB = pairs[m][1];
    }

    // Handle BYE advancement:
    // If sideB is BYE and sideA is a real competitor, sideA wins by BYE and auto-advances to next round
    // If sideA is BYE and sideB is a real competitor, sideB wins by BYE
    const advanceQueue = [];

    for (let m = 0; m < firstRound.length; m++) {
      const match = firstRound[m];
      const aIsBye = match.sideA.label === 'BYE';
      const bIsBye = match.sideB.label === 'BYE';

      if (bIsBye && !aIsBye && match.sideA.label !== 'TBD') {
        match.status = 'completed';
        match.winnerSide = 'A';
        match.notes = 'Walkover / BYE advancement';
        advanceQueue.push({
          targetCode: match.nextMatchCode,
          slot: match.nextMatchSlot,
          competitor: match.sideA,
        });
      } else if (aIsBye && !bIsBye && match.sideB.label !== 'TBD') {
        match.status = 'completed';
        match.winnerSide = 'B';
        match.notes = 'Walkover / BYE advancement';
        advanceQueue.push({
          targetCode: match.nextMatchCode,
          slot: match.nextMatchSlot,
          competitor: match.sideB,
        });
      }
    }

    // Propagate advanceQueue into later rounds
    while (advanceQueue.length > 0) {
      const { targetCode, slot, competitor } = advanceQueue.shift();
      if (!targetCode) continue;

      // Find target match across rounds
      for (let r = 1; r < roundMatchesMap.length; r++) {
        const target = roundMatchesMap[r].find((match) => match.matchCode === targetCode);
        if (target) {
          if (slot === 'A') target.sideA = { ...competitor };
          if (slot === 'B') target.sideB = { ...competitor };

          // If this later round match now has one real competitor and one BYE, advance again!
          const aIsBye = target.sideA.label === 'BYE';
          const bIsBye = target.sideB.label === 'BYE';
          if (bIsBye && !aIsBye && target.sideA.label !== 'TBD') {
            target.status = 'completed';
            target.winnerSide = 'A';
            target.notes = 'BYE advancement';
            if (target.nextMatchCode) {
              advanceQueue.push({
                targetCode: target.nextMatchCode,
                slot: target.nextMatchSlot,
                competitor: target.sideA,
              });
            }
          } else if (aIsBye && !bIsBye && target.sideB.label !== 'TBD') {
            target.status = 'completed';
            target.winnerSide = 'B';
            target.notes = 'BYE advancement';
            if (target.nextMatchCode) {
              advanceQueue.push({
                targetCode: target.nextMatchCode,
                slot: target.nextMatchSlot,
                competitor: target.sideB,
              });
            }
          }
          break;
        }
      }
    }

    // Save all matches to the data store
    const allMatchesToSave = roundMatchesMap.flat();
    const createdMatches = await Match.insertMany(allMatchesToSave);

    await notifyApprovedTournamentPlayers(
      tournament._id,
      `Fixtures Published: ${tournament.name}`,
      `${createdMatches.length} ${category.name} fixture(s) have been added to the tournament schedule.`,
      req.user._id
    );

    await recordAudit({
      req,
      action: 'DRAW_GENERATE',
      entityType: 'Match',
      entityId: tournament._id,
      summary: `Generated ${bracketSize}-slot knockout draw (${createdMatches.length} matches) for ${tournament.name} - ${category.name}`,
    });

    res.status(201).json({
      success: true,
      message: `Generated ${createdMatches.length} bracket fixtures for ${category.name}.`,
      matches: createdMatches,
    });
  } catch (err) {
    next(err);
  }
};

export const createManualMatch = async (req, res, next) => {
  try {
    const {
      tournamentId,
      categoryCode,
      round = 'Quarterfinal',
      court = 'Court 1',
      scheduledAt,
      sideALabel,
      sideBLabel,
      assignedReferee = null,
    } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }
    const category = tournament.categories.find((c) => c.code === categoryCode) || {
      code: categoryCode,
      name: categoryCode,
      format: 'singles',
    };

    const roundOrderMap = {
      'Group Stage': 1,
      'Round of 16': 1,
      Quarterfinal: 2,
      Semifinal: 3,
      Final: 4,
    };

    const match = await Match.create({
      matchCode: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      tournament: tournament._id,
      categoryCode: category.code,
      categoryName: category.name,
      format: category.format,
      round,
      roundOrder: roundOrderMap[round] || 2,
      court,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      sideA: { label: sideALabel.trim() },
      sideB: { label: sideBLabel.trim() },
      assignedReferee: assignedReferee || null,
    });

    await recordAudit({
      req,
      action: 'MATCH_CREATE',
      entityType: 'Match',
      entityId: match._id,
      summary: `Created fixture ${match.matchCode}: ${sideALabel} vs ${sideBLabel} (${court})`,
    });

    await notifyApprovedTournamentPlayers(
      tournament._id,
      `Fixture Scheduled: ${tournament.name}`,
      `${category.name} match ${match.matchCode} is scheduled for ${new Date(match.scheduledAt).toLocaleString()} on ${match.court}.`,
      req.user._id
    );

    res.status(201).json({ success: true, message: 'Fixture created.', match });
  } catch (err) {
    next(err);
  }
};

export const updateMatchSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { court, scheduledAt, status, assignedReferee, sideALabel, sideBLabel, round, published } =
      req.body;

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    if (court !== undefined) match.court = court;
    if (scheduledAt !== undefined) match.scheduledAt = new Date(scheduledAt);
    if (status !== undefined) match.status = status;
    if (assignedReferee !== undefined) match.assignedReferee = assignedReferee || null;
    if (sideALabel !== undefined) match.sideA.label = sideALabel;
    if (sideBLabel !== undefined) match.sideB.label = sideBLabel;
    if (round !== undefined) match.round = round;
    if (published !== undefined) match.published = Boolean(published);

    await match.save();

    if (scheduledAt !== undefined || court !== undefined || status !== undefined) {
      const tournament = await Tournament.findById(match.tournament);
      if (tournament) {
        await notifyApprovedTournamentPlayers(
          tournament._id,
          `Schedule Updated: ${tournament.name}`,
          `${match.matchCode} is now scheduled for ${new Date(match.scheduledAt).toLocaleString()} on ${match.court} (${match.status}).`,
          req.user._id
        );
      }
    }

    await recordAudit({
      req,
      action: 'MATCH_RESCHEDULE',
      entityType: 'Match',
      entityId: match._id,
      summary: `Updated schedule/assignment for ${match.matchCode} (${match.court} @ ${new Date(match.scheduledAt).toLocaleString()})`,
    });

    const populated = await Match.findById(match._id)
      .populate('tournament', 'name slug')
      .populate('assignedReferee', 'name email');

    res.json({ success: true, message: 'Match schedule updated.', match: populated });
  } catch (err) {
    next(err);
  }
};

// 7. PAYMENT TRACKING (NEVER STORE CARD DETAILS)
export const listCrmPayments = async (req, res, next) => {
  try {
    const { status = '', tournament = '' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (tournament) filter.tournament = tournament;

    const payments = await Payment.find(filter)
      .populate('player', 'fullName email playerCode')
      .populate('tournament', 'name slug')
      .populate('registration', 'registrationNumber categoryName status')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

export const updateCrmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, method, referenceCode, amount, notes } = req.body;

    const payment = await Payment.findById(id).populate('player', 'fullName');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (status) payment.status = status;
    if (method) payment.method = method;
    if (referenceCode !== undefined) payment.referenceCode = referenceCode.trim();
    if (amount !== undefined) payment.amount = Number(amount);
    if (notes !== undefined) payment.notes = notes;
    if (status === 'paid' && !payment.paidAt) {
      payment.paidAt = new Date();
    }
    payment.recordedBy = req.user._id;
    await payment.save();

    // Sync corresponding registration payment status
    const regPaymentMap = {
      paid: 'paid',
      pending: 'pending',
      failed: 'unpaid',
      refunded: 'refunded',
    };
    if (status && payment.registration) {
      await Registration.findByIdAndUpdate(payment.registration, {
        paymentStatus: regPaymentMap[status] || 'pending',
      });
    }

    await recordAudit({
      req,
      action: 'PAYMENT_UPDATE',
      entityType: 'Payment',
      entityId: payment._id,
      summary: `Updated payment ${payment.receiptNumber} (${payment.player?.fullName}) -> ${payment.status.toUpperCase()} [₹${payment.amount}]`,
    });

    res.json({ success: true, message: 'Payment record updated.', payment });
  } catch (err) {
    next(err);
  }
};

// 8. COMMUNICATIONS
export const listCommunications = async (_req, res, next) => {
  try {
    const messages = await Notification.find()
      .populate('tournament', 'name')
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, communications: messages });
  } catch (err) {
    next(err);
  }
};

export const previewAudienceCount = async (req, res, next) => {
  try {
    const { audience = 'all', tournamentId = '' } = req.query;
    let count = 0;

    if (audience === 'all') {
      count = await User.countDocuments({ status: 'active' });
    } else if (audience === 'players') {
      count = await Player.countDocuments({ 'crm.contactPreferences.emailUpdates': true });
    } else if (audience === 'tournament' && tournamentId) {
      const regs = await Registration.distinct('player', {
        tournament: tournamentId,
        status: { $nin: ['rejected', 'cancelled'] },
      });
      count = regs.length;
    }

    res.json({ success: true, recipientCount: count });
  } catch (err) {
    next(err);
  }
};

export const sendCommunication = async (req, res, next) => {
  try {
    const {
      title,
      message,
      type = 'announcement',
      audience = 'all',
      tournamentId = null,
      channel = 'in_app_and_email',
    } = req.body;

    let recipientUsers = [];
    let recipientCount = 0;

    if (audience === 'tournament' && tournamentId) {
      const regs = await Registration.find({
        tournament: tournamentId,
        status: { $nin: ['rejected', 'cancelled'] },
      }).select('user player');
      const userIds = regs.map((r) => r.user).filter(Boolean);
      recipientUsers = [...new Set(userIds.map(String))];
      recipientCount = regs.length || recipientUsers.length;
    } else if (audience === 'players') {
      const users = await User.find({ role: 'player', status: 'active' }).select('_id');
      recipientCount = users.length;
    } else {
      recipientCount = await User.countDocuments({ status: 'active' });
    }

    const comm = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type,
      audience,
      tournament: tournamentId || null,
      recipientUsers,
      recipientCount,
      channel,
      sentBy: req.user._id,
      senderName: req.user.name,
    });

    // Email delivery through Amazon SES (no-op/log-only when SES is not configured)
    if (String(channel).includes('email')) {
      let emailUsers = [];
      if (audience === 'tournament' && tournamentId) {
        emailUsers = recipientUsers.length ? await User.find({ _id: { $in: recipientUsers } }) : [];
      } else if (audience === 'players') {
        emailUsers = await User.find({ role: 'player', status: 'active' });
      } else {
        emailUsers = await User.find({ status: 'active' });
      }
      await sendBulkEmail(
        emailUsers.map((u) => u.email),
        { subject: `[ShuttlePulse] ${comm.title}`, text: `${comm.message}\n\n— ${req.user.name}, ShuttlePulse Tournament Desk` }
      );
    }

    await recordAudit({
      req,
      action: 'COMMUNICATION_SEND',
      entityType: 'Notification',
      entityId: comm._id,
      summary: `Broadcast "${comm.title}" to ${audience} (${recipientCount} recipients)`,
    });

    res.status(201).json({
      success: true,
      message: `Announcement dispatched to ${recipientCount} recipient(s).`,
      communication: comm,
    });
  } catch (err) {
    next(err);
  }
};

// 9. REPORTS & CSV EXPORTS
export const getCrmReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { format = 'json', tournament = '' } = req.query;

    let headers = [];
    let rows = [];
    let summary = {};

    if (type === 'registrations') {
      const filter = tournament ? { tournament } : {};
      const data = await Registration.find(filter)
        .populate('tournament', 'name')
        .populate('player', 'fullName email club ageGroup')
        .sort({ createdAt: -1 });

      headers = [
        { key: 'registrationNumber', label: 'Reg #' },
        { key: 'tournament', label: 'Tournament' },
        { key: 'category', label: 'Category' },
        { key: 'format', label: 'Format' },
        { key: 'playerName', label: 'Player' },
        { key: 'playerEmail', label: 'Email' },
        { key: 'club', label: 'Club' },
        { key: 'partner', label: 'Partner' },
        { key: 'status', label: 'Reg Status' },
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'feeAmount', label: 'Fee (₹)' },
        { key: 'createdAt', label: 'Registered On' },
      ];

      rows = data.map((r) => ({
        registrationNumber: r.registrationNumber,
        tournament: r.tournament?.name || '',
        category: r.categoryName,
        format: r.format,
        playerName: r.player?.fullName || '',
        playerEmail: r.player?.email || '',
        club: r.player?.club || '',
        partner: r.partnerDetails?.name || '-',
        status: r.status,
        paymentStatus: r.paymentStatus,
        feeAmount: r.feeAmount,
        createdAt: new Date(r.createdAt).toISOString().split('T')[0],
      }));

      summary = {
        total: rows.length,
        approved: rows.filter((r) => r.status === 'approved').length,
        pending: rows.filter((r) => r.status === 'pending').length,
        waitlisted: rows.filter((r) => r.status === 'waitlisted').length,
      };
    } else if (type === 'players') {
      const data = await Player.find().sort({ rankingPoints: -1 });
      headers = [
        { key: 'playerCode', label: 'Player Code' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'gender', label: 'Gender' },
        { key: 'ageGroup', label: 'Age Group' },
        { key: 'club', label: 'Club' },
        { key: 'city', label: 'City' },
        { key: 'skillLevel', label: 'Skill' },
        { key: 'rankingPoints', label: 'Points' },
        { key: 'wins', label: 'Wins' },
        { key: 'losses', label: 'Losses' },
        { key: 'crmStatus', label: 'CRM Status' },
      ];
      rows = data.map((p) => ({
        playerCode: p.playerCode,
        fullName: p.fullName,
        email: p.email,
        gender: p.gender,
        ageGroup: p.ageGroup,
        club: p.club,
        city: p.city,
        skillLevel: p.skillLevel,
        rankingPoints: p.rankingPoints,
        wins: p.wins,
        losses: p.losses,
        crmStatus: p.crm?.status || 'active',
      }));
      summary = {
        totalPlayers: rows.length,
        vipPlayers: rows.filter((r) => r.crmStatus === 'vip').length,
        averagePoints: rows.length
          ? Math.round(rows.reduce((s, r) => s + r.rankingPoints, 0) / rows.length)
          : 0,
      };
    } else if (type === 'revenue') {
      const filter = tournament ? { tournament } : {};
      const data = await Payment.find(filter)
        .populate('tournament', 'name')
        .populate('player', 'fullName email')
        .populate('registration', 'registrationNumber categoryName')
        .sort({ createdAt: -1 });

      headers = [
        { key: 'receiptNumber', label: 'Receipt #' },
        { key: 'tournament', label: 'Tournament' },
        { key: 'registrationNumber', label: 'Reg #' },
        { key: 'category', label: 'Category' },
        { key: 'player', label: 'Player' },
        { key: 'method', label: 'Method' },
        { key: 'referenceCode', label: 'Reference' },
        { key: 'status', label: 'Status' },
        { key: 'amount', label: 'Amount (₹)' },
        { key: 'date', label: 'Date' },
      ];
      rows = data.map((p) => ({
        receiptNumber: p.receiptNumber,
        tournament: p.tournament?.name || '',
        registrationNumber: p.registration?.registrationNumber || '',
        category: p.registration?.categoryName || '',
        player: p.player?.fullName || '',
        method: p.method,
        referenceCode: p.referenceCode || '-',
        status: p.status,
        amount: p.amount,
        date: new Date(p.paidAt || p.createdAt).toISOString().split('T')[0],
      }));
      summary = {
        paidTotal: rows
          .filter((r) => r.status === 'paid')
          .reduce((s, r) => s + Number(r.amount || 0), 0),
        pendingTotal: rows
          .filter((r) => r.status === 'pending')
          .reduce((s, r) => s + Number(r.amount || 0), 0),
        transactions: rows.length,
      };
    } else if (type === 'matches') {
      const filter = tournament ? { tournament } : {};
      const data = await Match.find(filter)
        .populate('tournament', 'name')
        .populate('assignedReferee', 'name')
        .sort({ scheduledAt: -1 });

      headers = [
        { key: 'matchCode', label: 'Match Code' },
        { key: 'tournament', label: 'Tournament' },
        { key: 'category', label: 'Category' },
        { key: 'round', label: 'Round' },
        { key: 'court', label: 'Court' },
        { key: 'sideA', label: 'Side A' },
        { key: 'sideB', label: 'Side B' },
        { key: 'score', label: 'Game Scores' },
        { key: 'winner', label: 'Winner' },
        { key: 'status', label: 'Status' },
        { key: 'referee', label: 'Referee' },
      ];
      rows = data.map((m) => ({
        matchCode: m.matchCode,
        tournament: m.tournament?.name || '',
        category: m.categoryName,
        round: m.round,
        court: m.court,
        sideA: m.sideA?.label || '',
        sideB: m.sideB?.label || '',
        score: (m.scores || []).map((g) => `${g.scoreA}-${g.scoreB}`).join(' / ') || '-',
        winner:
          m.winnerSide === 'A'
            ? m.sideA?.label
            : m.winnerSide === 'B'
              ? m.sideB?.label
              : '-',
        status: m.status,
        referee: m.assignedReferee?.name || 'Unassigned',
      }));
      summary = {
        totalMatches: rows.length,
        completed: rows.filter((r) => r.status === 'completed').length,
        live: rows.filter((r) => r.status === 'live').length,
        scheduled: rows.filter((r) => r.status === 'scheduled').length,
      };
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported report type.' });
    }

    if (format === 'csv') {
      const csv = toCsv(headers, rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="shuttlepulse-${type}-report.csv"`);
      return res.send(csv);
    }

    res.json({ success: true, type, summary, headers, rows });
  } catch (err) {
    next(err);
  }
};

// 10. AUDIT LOGS
export const listAuditLogs = async (req, res, next) => {
  try {
    const { entityType = '', search = '' } = req.query;
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ summary: rx }, { actorName: rx }, { action: rx }];
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(150);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

// 11. ORGANIZATION SETTINGS & STAFF ACCOUNTS
export const getSettingsAndStaff = async (_req, res, next) => {
  try {
    let settings = await OrganizationSetting.findOne({ singletonKey: 'default' });
    if (!settings) {
      settings = await OrganizationSetting.create({ singletonKey: 'default' });
    }

    const staff = await User.find({
      role: { $in: ['admin', 'organizer', 'referee'] },
    })
      .select('name email role staffTitle status lastLoginAt createdAt')
      .sort({ role: 1, name: 1 });

    res.json({ success: true, settings, staff });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await OrganizationSetting.findOne({ singletonKey: 'default' });
    if (!settings) {
      settings = new OrganizationSetting({ singletonKey: 'default' });
    }

    const fields = [
      'organizationName',
      'shortName',
      'tagline',
      'supportEmail',
      'supportPhone',
      'headquarters',
      'website',
      'accentColor',
      'primaryColor',
      'currency',
      'defaultCourtsCount',
      'paymentInstructions',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) settings[f] = req.body[f];
    });
    settings.updatedBy = req.user._id;
    await settings.save();

    await recordAudit({
      req,
      action: 'SETTINGS_UPDATE',
      entityType: 'Settings',
      entityId: settings._id,
      summary: `Updated organization branding & settings (${settings.organizationName})`,
    });

    res.json({ success: true, message: 'Organization settings saved.', settings });
  } catch (err) {
    next(err);
  }
};

export const createStaffAccount = async (req, res, next) => {
  try {
    const { name, email, password, role, staffTitle = '' } = req.body;
    if (!['admin', 'organizer', 'referee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Staff role must be admin, organizer, or referee.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with that email already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const staffUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      staffTitle,
      status: 'active',
    });

    await recordAudit({
      req,
      action: 'STAFF_CREATE',
      entityType: 'User',
      entityId: staffUser._id,
      summary: `Created ${role} account for ${staffUser.name} (${staffUser.email})`,
    });

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} account created.`,
      staff: {
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
        staffTitle: staffUser.staffTitle,
        status: staffUser.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateStaffAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status, staffTitle } = req.body;
    const staffUser = await User.findById(id);
    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'Staff account not found.' });
    }

    if (String(staffUser._id) === String(req.user._id) && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own active admin session.',
      });
    }

    if (role && ['admin', 'organizer', 'referee', 'player'].includes(role)) {
      staffUser.role = role;
    }
    if (status && ['active', 'suspended'].includes(status)) {
      staffUser.status = status;
    }
    if (staffTitle !== undefined) {
      staffUser.staffTitle = staffTitle;
    }
    await staffUser.save();

    await recordAudit({
      req,
      action: 'STAFF_UPDATE',
      entityType: 'User',
      entityId: staffUser._id,
      summary: `Updated staff account ${staffUser.email} -> role=${staffUser.role}, status=${staffUser.status}`,
    });

    res.json({ success: true, message: 'Staff account updated.', staff: staffUser });
  } catch (err) {
    next(err);
  }
};

// 12. TOURNAMENT BULLETINS / UPDATES
export const listTournamentUpdates = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const filter = tournamentId ? { tournament: tournamentId } : {};
    const updates = await TournamentUpdate.find(filter)
      .populate('tournament', 'name slug venue city')
      .populate('postedBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, count: updates.length, updates });
  } catch (err) {
    next(err);
  }
};

export const createTournamentUpdate = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { title, content, type = 'announcement', isPinned = false, sendBroadcast = true } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    const updateDoc = await TournamentUpdate.create({
      tournament: tournament._id,
      title: title.trim(),
      content: content.trim(),
      type,
      isPinned: Boolean(isPinned),
      postedBy: req.user._id,
      authorName: req.user.name || 'Tournament Committee',
    });

    // Notify registered players in this tournament
    if (sendBroadcast) {
      const registrations = await Registration.find({
        tournament: tournament._id,
        status: { $in: ['approved', 'pending'] },
      }).select('user player');

      const userIds = new Set();
      registrations.forEach((reg) => {
        if (reg.user) userIds.add(String(reg.user));
      });

      const recipientArray = Array.from(userIds);
      if (recipientArray.length > 0) {
        await Notification.create({
          title: `[${tournament.name}] ${title}`,
          message: content,
          type: type === 'result' ? 'result' : type === 'schedule_change' ? 'schedule' : 'announcement',
          audience: 'tournament',
          tournament: tournament._id,
          recipientUsers: recipientArray,
          recipientCount: recipientArray.length,
          sentBy: req.user._id,
          senderName: req.user.name || 'Tournament Organizer',
        });
      }
    }

    await recordAudit({
      req,
      action: 'TOURNAMENT_UPDATE_CREATE',
      entityType: 'TournamentUpdate',
      entityId: updateDoc._id,
      summary: `Posted bulletin "${title}" for tournament ${tournament.name}`,
    });

    const populated = await TournamentUpdate.findById(updateDoc._id)
      .populate('tournament', 'name slug')
      .populate('postedBy', 'name role');

    res.status(201).json({
      success: true,
      message: 'Tournament announcement published.',
      update: populated,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTournamentUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, type, isPinned } = req.body;

    const updateDoc = await TournamentUpdate.findById(id);
    if (!updateDoc) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    if (title !== undefined) updateDoc.title = title.trim();
    if (content !== undefined) updateDoc.content = content.trim();
    if (type !== undefined) updateDoc.type = type;
    if (isPinned !== undefined) updateDoc.isPinned = Boolean(isPinned);

    await updateDoc.save();

    res.json({
      success: true,
      message: 'Announcement updated.',
      update: updateDoc,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTournamentUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateDoc = await TournamentUpdate.findById(id);
    if (!updateDoc) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    await TournamentUpdate.findByIdAndDelete(id);

    await recordAudit({
      req,
      action: 'TOURNAMENT_UPDATE_DELETE',
      entityType: 'TournamentUpdate',
      entityId: id,
      summary: `Deleted bulletin "${updateDoc.title}"`,
    });

    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    next(err);
  }
};
