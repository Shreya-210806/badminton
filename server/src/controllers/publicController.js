import { isValidId } from '../utils/ids.js';
import {
  Tournament,
  Player,
  Registration,
  Match,
  OrganizationSetting,
  Notification,
} from '../models/index.js';

async function attachCategoryCounts(tournaments) {
  const tournamentIds = tournaments.map((t) => t._id);
  const regCounts = await Registration.aggregate([
    {
      $match: {
        tournament: { $in: tournamentIds },
        status: { $in: ['pending', 'approved'] },
      },
    },
    {
      $group: {
        _id: { tournament: '$tournament', categoryCode: '$categoryCode' },
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map();
  regCounts.forEach((r) => {
    countMap.set(`${r._id.tournament}_${r._id.categoryCode}`, r.count);
  });

  return tournaments.map((t) => {
    const obj = t.toObject ? t.toObject() : { ...t };
    let totalEntries = 0;
    let totalCapacity = 0;
    obj.categories = (obj.categories || []).map((cat) => {
      const currentEntries = countMap.get(`${obj._id}_${cat.code}`) || 0;
      totalEntries += currentEntries;
      totalCapacity += cat.maxEntries || 0;
      return {
        ...cat,
        currentEntries,
        spotsRemaining: Math.max(0, (cat.maxEntries || 0) - currentEntries),
      };
    });
    obj.totalEntries = totalEntries;
    obj.totalCapacity = totalCapacity;
    return obj;
  });
}

export const getHomeSummary = async (_req, res, next) => {
  try {
    const [rawTournaments, liveMatches, recentResults, topPlayers, totalPlayers, completedMatchesCount, orgSettings] =
      await Promise.all([
        Tournament.find({ status: { $in: ['published', 'ongoing', 'completed'] } })
          .sort({ featured: -1, startDate: 1 })
          .limit(6),
        Match.find({ status: 'live', published: true })
          .populate('tournament', 'name slug venue city')
          .sort({ scheduledAt: 1 })
          .limit(4),
        Match.find({ status: 'completed', published: true })
          .populate('tournament', 'name slug venue city')
          .sort({ completedAt: -1, updatedAt: -1 })
          .limit(6),
        Player.find({ 'publicProfile.isListed': true })
          .select('playerCode fullName club city ageGroup gender skillLevel rankingPoints wins losses titles publicProfile')
          .sort({ rankingPoints: -1 })
          .limit(6),
        Player.countDocuments(),
        Match.countDocuments({ status: 'completed' }),
        OrganizationSetting.findOne({ singletonKey: 'default' }),
      ]);

    const tournaments = await attachCategoryCounts(rawTournaments);

    // Collect unique sponsors across tournaments
    const sponsorMap = new Map();
    tournaments.forEach((t) => {
      (t.sponsors || []).forEach((s) => {
        if (!sponsorMap.has(s.name)) sponsorMap.set(s.name, s);
      });
    });

    res.json({
      success: true,
      stats: {
        activeTournaments: tournaments.filter((t) => t.status !== 'completed').length,
        registeredPlayers: totalPlayers,
        matchesCompleted: completedMatchesCount,
        liveCourts: liveMatches.length,
      },
      tournaments,
      liveMatches,
      recentResults,
      topPlayers: topPlayers.map(sanitizePublicPlayer),
      sponsors: Array.from(sponsorMap.values()),
      organization: orgSettings,
    });
  } catch (err) {
    next(err);
  }
};

export const listPublicTournaments = async (req, res, next) => {
  try {
    const {
      search = '',
      city = '',
      category = '',
      ageGroup = '',
      registrationStatus = '',
      startAfter = '',
      startBefore = '',
    } = req.query;

    const filter = { status: { $in: ['published', 'ongoing', 'completed'] } };

    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: rx }, { venue: rx }, { city: rx }, { description: rx }];
    }
    if (city.trim()) {
      filter.city = new RegExp(city.trim(), 'i');
    }
    if (registrationStatus) {
      filter.registrationStatus = registrationStatus;
    }
    if (category) {
      filter['categories.format'] = category.toLowerCase();
    }
    if (ageGroup) {
      filter['categories.ageGroup'] = ageGroup;
    }
    if (startAfter || startBefore) {
      filter.startDate = {};
      if (startAfter) filter.startDate.$gte = new Date(startAfter);
      if (startBefore) filter.startDate.$lte = new Date(startBefore);
    }

    const raw = await Tournament.find(filter).sort({ startDate: 1 });
    const tournaments = await attachCategoryCounts(raw);

    res.json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicTournamentDetail = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const query = isValidId(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const tournamentDoc = await Tournament.findOne({
      ...query,
      status: { $ne: 'draft' },
    });

    if (!tournamentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found.',
      });
    }

    const [enriched] = await attachCategoryCounts([tournamentDoc]);
    const matches = await Match.find({
      tournament: tournamentDoc._id,
      published: true,
    }).sort({ roundOrder: 1, matchNumber: 1, scheduledAt: 1 });

    const orgSettings = await OrganizationSetting.findOne({ singletonKey: 'default' });

    res.json({
      success: true,
      tournament: enriched,
      matches,
      paymentInstructions: orgSettings?.paymentInstructions || '',
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicFixtures = async (req, res, next) => {
  try {
    const { tournament = '', category = '', round = '', status = '', search = '' } = req.query;
    const filter = { published: true };

    if (tournament && isValidId(tournament)) {
      filter.tournament = tournament;
    }
    if (category) {
      filter.categoryCode = category;
    }
    if (round) {
      filter.round = round;
    }
    if (status) {
      filter.status = status;
    }
    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'sideA.label': rx },
        { 'sideB.label': rx },
        { matchCode: rx },
        { court: rx },
      ];
    }

    const matches = await Match.find(filter)
      .populate('tournament', 'name slug venue city startDate')
      .sort({ scheduledAt: 1, roundOrder: 1, matchNumber: 1 });

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err) {
    next(err);
  }
};

export const getLiveAndResults = async (req, res, next) => {
  try {
    const { tournament = '', category = '' } = req.query;
    const baseFilter = { published: true };
    if (tournament && isValidId(tournament)) {
      baseFilter.tournament = tournament;
    }
    if (category) {
      baseFilter.categoryCode = category;
    }

    const [liveMatches, completedMatches, rankings] = await Promise.all([
      Match.find({ ...baseFilter, status: 'live' })
        .populate('tournament', 'name slug venue city')
        .sort({ scheduledAt: 1 }),
      Match.find({ ...baseFilter, status: { $in: ['completed', 'walkover'] } })
        .populate('tournament', 'name slug venue city')
        .sort({ completedAt: -1, updatedAt: -1 }),
      Player.find({ 'publicProfile.isListed': true })
        .select('playerCode fullName club city gender ageGroup skillLevel rankingPoints wins losses titles publicProfile')
        .sort({ rankingPoints: -1, wins: -1 })
        .limit(25),
    ]);

    // Compute category podium / standings from Finals and Semifinals
    const podiumMap = new Map();
    completedMatches.forEach((m) => {
      if (m.round === 'Final' && m.winnerSide) {
        const key = `${m.tournament?._id}_${m.categoryCode}`;
        const champion = m.winnerSide === 'A' ? m.sideA : m.sideB;
        const runnerUp = m.winnerSide === 'A' ? m.sideB : m.sideA;
        podiumMap.set(key, {
          tournamentName: m.tournament?.name || 'Tournament',
          categoryCode: m.categoryCode,
          categoryName: m.categoryName,
          champion: champion?.label,
          championClub: champion?.club,
          runnerUp: runnerUp?.label,
          runnerUpClub: runnerUp?.club,
          finalScore: (m.scores || []).map((g) => `${g.scoreA}-${g.scoreB}`).join(', '),
        });
      }
    });

    res.json({
      success: true,
      liveMatches,
      completedMatches,
      standings: Array.from(podiumMap.values()),
      rankings: rankings.map(sanitizePublicPlayer),
    });
  } catch (err) {
    next(err);
  }
};

function sanitizePublicPlayer(playerDoc) {
  const p = playerDoc.toObject ? playerDoc.toObject() : { ...playerDoc };
  const prefs = p.publicProfile || {};
  return {
    _id: p._id,
    playerCode: p.playerCode,
    fullName: p.fullName,
    gender: p.gender,
    ageGroup: p.ageGroup,
    city: p.city,
    handedness: p.handedness,
    skillLevel: p.skillLevel,
    bio: p.bio,
    club: prefs.showClub !== false ? p.club : 'Private Club',
    email: prefs.showEmail ? p.email : null,
    phone: prefs.showPhone ? p.phone : null,
    rankingPoints: prefs.showStats !== false ? p.rankingPoints : null,
    wins: prefs.showStats !== false ? p.wins : null,
    losses: prefs.showStats !== false ? p.losses : null,
    titles: prefs.showStats !== false ? p.titles : null,
  };
}

export const getPublicPlayers = async (req, res, next) => {
  try {
    const { search = '', ageGroup = '', skillLevel = '', gender = '' } = req.query;
    const filter = { 'publicProfile.isListed': true };

    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ fullName: rx }, { club: rx }, { city: rx }, { playerCode: rx }];
    }
    if (ageGroup) filter.ageGroup = ageGroup;
    if (skillLevel) filter.skillLevel = skillLevel;
    if (gender) filter.gender = gender;

    const players = await Player.find(filter).sort({ rankingPoints: -1, fullName: 1 });
    res.json({
      success: true,
      count: players.length,
      players: players.map(sanitizePublicPlayer),
    });
  } catch (err) {
    next(err);
  }
};

export const submitContactInquiry = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    await Notification.create({
      title: `Contact Inquiry: ${subject}`,
      message: `From ${name} (${email}): ${message}`,
      type: 'inquiry',
      audience: 'admins',
      senderName: name,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Our tournament desk has received your message and will respond shortly.',
    });
  } catch (err) {
    next(err);
  }
};
