import {
  Player,
  Tournament,
  Registration,
  Team,
  Match,
  Payment,
  Notification,
  OrganizationSetting,
  TournamentUpdate,
} from '../models/index.js';
import {
  ageGroupForAge,
  getPlayerSelectedLocation,
  getTournamentLocation,
  isCategoryEligible,
} from '../utils/playerEligibility.js';

const nextCode = (prefix) =>
  `${prefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

const hasValidContactNumber = (phone) =>
  String(phone || '').replace(/\D/g, '').length >= 6;

const getPlayerForUser = async (user) => {
  let player = await Player.findOne({ user: user._id });
  if (!player) {
    player = await Player.create({
      user: user._id,
      playerCode: `PL-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: user.name,
      email: user.email,
    });
  } else if (player.email !== user.email) {
    player.email = user.email;
    await player.save();
  }
  return player;
};

const getPlayerRegistrations = (user, player) =>
  Registration.find({
    $or: [{ player: player._id }, { user: user._id }],
  })
    .populate('tournament', 'name slug venue city address startDate endDate status categories')
    .populate('partner', 'fullName email club')
    .populate('team', 'name teamCode status')
    .sort({ createdAt: -1 });

const getAvailableTournamentsForPlayer = async (player) => {
  const selectedLocation = getPlayerSelectedLocation(player);
  const tournaments = await Tournament.find({
    status: { $in: ['published', 'ongoing'] },
  }).sort({ startDate: 1 });

  return tournaments
    .map((tournament) => ({
      ...tournament.toObject(),
      location: getTournamentLocation(tournament),
      categories: (tournament.categories || []).filter((category) =>
        isCategoryEligible(category, player)
      ),
    }))
    .filter((tournament) => tournament.categories.length > 0)
    .sort((left, right) => {
      const leftMatches = left.location === selectedLocation;
      const rightMatches = right.location === selectedLocation;
      if (leftMatches !== rightMatches) return leftMatches ? -1 : 1;
      return new Date(left.startDate) - new Date(right.startDate);
    });
};

const getPlayerNotifications = async (user, registrations) => {
  const tournamentIds = [
    ...new Set(registrations.map((registration) =>
      String(registration.tournament?._id || registration.tournament)
    )),
  ];
  const notifications = await Notification.find({
    $or: [
      { recipientUsers: user._id },
      { audience: { $in: ['all', 'players'] }, tournament: null },
      ...(tournamentIds.length
        ? [{
            audience: { $in: ['all', 'players', 'tournament'] },
            tournament: { $in: tournamentIds },
          }]
        : []),
    ],
  }).sort({ createdAt: -1 });

  return notifications.slice(0, 20).map((notification) => {
    const object = notification.toObject();
    object.isRead = (notification.readBy || []).some(
      (id) => String(id) === String(user._id)
    );
    return object;
  });
};

const getPlayerMatches = async (approvedRegistrations) => {
  const registrationFilters = [
    ...new Map(
      approvedRegistrations
        .filter((registration) => registration.tournament && registration.categoryCode)
        .map((registration) => {
          const tournamentId = registration.tournament?._id || registration.tournament;
          return [`${tournamentId}:${registration.categoryCode}`, {
            tournament: tournamentId,
            categoryCode: registration.categoryCode,
          }];
        })
    ).values(),
  ];

  if (!registrationFilters.length) return [];

  return Match.find({
    $or: registrationFilters,
    published: true,
  })
    .populate('tournament', 'name slug venue city')
    .sort({ scheduledAt: 1 });
};

export const getPlayerNotificationsForUser = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);
    const registrations = await getPlayerRegistrations(req.user, player);
    const notifications = await getPlayerNotifications(req.user, registrations);
    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

export const getPlayerDashboard = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);
    const registrations = await getPlayerRegistrations(req.user, player);
    const approvedRegistrations = registrations.filter((r) => r.status === 'approved');
    const registrationIds = registrations.map((registration) => registration._id);

    const [payments, matches, notifications, rankPosition, orgSettings, availableTournaments] = await Promise.all([
      Payment.find({ registration: { $in: registrationIds } })
        .populate('tournament', 'name slug')
        .populate('registration', 'registrationNumber categoryName')
        .sort({ createdAt: -1 }),
      getPlayerMatches(approvedRegistrations),
      getPlayerNotifications(req.user, registrations),
      Player.countDocuments({ rankingPoints: { $gt: player.rankingPoints } }),
      OrganizationSetting.findOne({ singletonKey: 'default' }),
      getAvailableTournamentsForPlayer(player),
    ]);

    res.json({
      success: true,
      player,
      selectedLocation: getPlayerSelectedLocation(player),
      availableTournaments,
      standingRank: rankPosition + 1,
      registrations,
      payments,
      fixtures: matches.filter((m) =>
        ['scheduled', 'live', 'postponed'].includes(m.status)
      ),
      results: matches.filter((m) => m.status === 'completed' || m.status === 'walkover'),
      notifications,
      paymentInstructions: orgSettings?.paymentInstructions || '',
    });
  } catch (err) {
    next(err);
  }
};

export const getPlayerProfile = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);
    res.json({ success: true, player });
  } catch (err) {
    next(err);
  }
};

export const getPlayerApplications = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);
    const registrations = await getPlayerRegistrations(req.user, player);
    res.json({ success: true, applications: registrations });
  } catch (err) {
    next(err);
  }
};

export const getPlayerTournaments = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);
    const registrations = await getPlayerRegistrations(req.user, player);
    const approvedRegistrations = registrations.filter((r) => r.status === 'approved');
    const tournamentsById = new Map();

    approvedRegistrations.forEach((registration) => {
      if (!registration.tournament) return;
      const tournamentId = String(registration.tournament._id);
      if (!tournamentsById.has(tournamentId)) {
        tournamentsById.set(tournamentId, {
          tournament: registration.tournament,
          entries: [],
        });
      }
      tournamentsById.get(tournamentId).entries.push(registration);
    });

    const matches = await getPlayerMatches(approvedRegistrations);
    res.json({
      success: true,
      tournaments: [...tournamentsById.values()],
      registrations: approvedRegistrations,
      fixtures: matches.filter((m) => ['scheduled', 'live', 'postponed'].includes(m.status)),
      results: matches.filter((m) => ['completed', 'walkover'].includes(m.status)),
    });
  } catch (err) {
    next(err);
  }
};

export const updatePlayerProfile = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);

    const phone = req.body.phone === undefined ? player.phone : req.body.phone;
    if (!hasValidContactNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'A valid contact number is required.',
      });
    }

    if (req.body.gender !== undefined && !['Male', 'Female', 'Other'].includes(req.body.gender)) {
      return res.status(400).json({ success: false, message: 'Select a valid gender.' });
    }

    if (
      req.body.age !== undefined &&
      (!Number.isInteger(Number(req.body.age)) ||
        Number(req.body.age) < 1 ||
        Number(req.body.age) > 120)
    ) {
      return res.status(400).json({ success: false, message: 'Enter an age between 1 and 120.' });
    }

    if (req.body.fullName !== undefined && String(req.body.fullName).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Enter a valid full name.' });
    }

    const allowedFields = [
      'fullName',
      'phone',
      'gender',
      'age',
      'dateOfBirth',
      'club',
      'city',
      'handedness',
      'skillLevel',
      'bio',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        player[field] = req.body[field];
      }
    });
    if (req.body.age !== undefined) {
      player.age = Number(req.body.age);
      player.ageGroup = ageGroupForAge(player.age);
    }

    if (req.body.emergencyContact && typeof req.body.emergencyContact === 'object') {
      player.emergencyContact = {
        ...player.emergencyContact,
        ...req.body.emergencyContact,
      };
    }

    if (req.body.publicProfile && typeof req.body.publicProfile === 'object') {
      player.publicProfile = {
        ...player.publicProfile,
        ...req.body.publicProfile,
      };
    }

    if (req.body.contactPreferences && typeof req.body.contactPreferences === 'object') {
      player.crm.contactPreferences = {
        ...player.crm.contactPreferences,
        ...req.body.contactPreferences,
      };
    }

    await player.save();

    if (req.body.fullName && req.body.fullName.trim()) {
      req.user.name = req.body.fullName.trim();
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Player profile and privacy settings updated.',
      player,
    });
  } catch (err) {
    next(err);
  }
};

export const createRegistration = async (req, res, next) => {
  try {
    const {
      tournamentId,
      categoryCode,
      eligibilityConfirmed,
      partnerDetails = {},
      emergencyContact = {},
      shirtSize = 'M',
      paymentMethod = 'bank_transfer',
      paymentReference = '',
      notes = '',
    } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.status === 'draft' || tournament.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Tournament is not available for registration.',
      });
    }

    if (!['published', 'ongoing'].includes(tournament.status)) {
      return res.status(400).json({
        success: false,
        message: 'This tournament is not accepting applications.',
      });
    }

    if (tournament.registrationStatus === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Registration for this tournament is closed.',
      });
    }

    if (new Date(tournament.registrationDeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The registration deadline for this tournament has passed.',
      });
    }

    const category = tournament.categories.find((c) => c.code === categoryCode);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Selected tournament category does not exist.',
      });
    }

    const player = await getPlayerForUser(req.user);

    if (
      !String(player.fullName || '').trim() ||
      !String(player.email || '').trim() ||
      !hasValidContactNumber(player.phone) ||
      !['Male', 'Female', 'Other'].includes(player.gender) ||
      !Number.isInteger(player.age) ||
      player.age < 1 ||
      player.age > 120
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Complete your name, email, contact number, gender, and age in your player profile before applying.',
      });
    }

    if (!isCategoryEligible(category, player)) {
      return res.status(400).json({
        success: false,
        message: `This event does not match your gender and age eligibility for ${category.name}.`,
      });
    }

    if (eligibilityConfirmed !== true) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm your eligibility before applying.',
      });
    }

    // Keep an application unique for a player, even if an earlier application was closed.
    const duplicate = await Registration.findOne({
      tournament: tournament._id,
      categoryCode,
      $or: [{ user: req.user._id }, { player: player._id }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `You already have an application (${duplicate.registrationNumber}) in ${category.name}.`,
      });
    }

    let partnerDoc = null;
    let createdTeam = null;

    if (category.format === 'doubles') {
      const partnerName = String(partnerDetails.name || '').trim();
      const partnerEmail = String(partnerDetails.email || '').toLowerCase().trim();

      if (Boolean(partnerName) !== Boolean(partnerEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Provide both partner name and email, or leave both blank to apply without a partner.',
        });
      }

      if (partnerEmail && partnerEmail === player.email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot register yourself as your own doubles partner.',
        });
      }

      if (partnerEmail) partnerDoc = await Player.findOne({ email: partnerEmail });

      const partnerGender = partnerDoc?.gender || partnerDetails.gender || '';
      if (
        category.gender === 'Mixed' &&
        partnerGender &&
        player.gender !== 'Other' &&
        partnerGender !== 'Other' &&
        partnerGender === player.gender
      ) {
        return res.status(400).json({
          success: false,
          message: 'Mixed Doubles requires one Male and one Female partner.',
        });
      }

      if (
        (category.gender === 'Male' || category.gender === 'Female') &&
        partnerGender &&
        partnerGender !== 'Other' &&
        partnerGender !== category.gender
      ) {
        return res.status(400).json({
          success: false,
          message: `${category.name} requires both partners to be ${category.gender}.`,
        });
      }

      // Prevent partner from being registered twice in the same category
      if (partnerEmail) {
        const partnerConflict = await Registration.findOne({
          tournament: tournament._id,
          categoryCode,
          status: { $nin: ['rejected', 'cancelled'] },
          $or: [
            ...(partnerDoc ? [{ player: partnerDoc._id }, { partner: partnerDoc._id }] : []),
            { 'partnerDetails.email': partnerEmail },
          ],
        });

        if (partnerConflict) {
          return res.status(409).json({
            success: false,
            message: `Partner (${partnerName}) is already entered in ${category.name} for this tournament.`,
          });
        }
      }
    }

    // Check category capacity
    const activeCategoryEntries = await Registration.countDocuments({
      tournament: tournament._id,
      categoryCode,
      status: { $in: ['pending', 'approved'] },
    });

    const isWaitlisted =
      tournament.registrationStatus === 'waitlist_only' ||
      activeCategoryEntries >= category.maxEntries;

    if (category.format === 'doubles') {
      const partnerName = String(partnerDetails.name || '').trim();
      createdTeam = await Team.create({
        teamCode: nextCode('TM'),
        name: `${player.fullName} / ${partnerName || 'Partner pending'}`,
        tournament: tournament._id,
        categoryCode,
        categoryName: category.name,
        player1: player._id,
        player2: partnerDoc ? partnerDoc._id : null,
        partnerDetails: {
          name: partnerName,
          email: String(partnerDetails.email || '').toLowerCase().trim(),
          phone: partnerDetails.phone || '',
          club: partnerDetails.club || '',
        },
        status: partnerDoc ? 'confirmed' : 'pending_partner',
      });
    }

    const hasPaymentRef = Boolean(paymentReference && paymentReference.trim());
    const applicationEmergencyContact = {
      name: String(emergencyContact.name || player.emergencyContact?.name || '').trim(),
      relation: String(emergencyContact.relation || player.emergencyContact?.relation || 'Family').trim(),
      phone: String(emergencyContact.phone || player.emergencyContact?.phone || '').trim(),
    };
    const registration = await Registration.create({
      registrationNumber: nextCode('REG'),
      tournament: tournament._id,
      categoryCode: category.code,
      categoryName: category.name,
      format: category.format,
      player: player._id,
      user: req.user._id,
      partner: partnerDoc ? partnerDoc._id : null,
      partnerDetails:
        category.format === 'doubles'
          ? {
              name: String(partnerDetails.name || '').trim(),
              email: String(partnerDetails.email || '').toLowerCase().trim(),
              phone: partnerDetails.phone || '',
              club: partnerDetails.club || '',
              gender: partnerDetails.gender || partnerDoc?.gender || '',
            }
          : undefined,
      team: createdTeam ? createdTeam._id : null,
      emergencyContact: {
        ...applicationEmergencyContact,
      },
      status: isWaitlisted ? 'waitlisted' : 'pending',
      paymentStatus: hasPaymentRef ? 'pending' : 'unpaid',
      feeAmount: category.fee,
      shirtSize,
      notes,
    });

    const payment = await Payment.create({
      receiptNumber: nextCode('PAY'),
      registration: registration._id,
      player: player._id,
      tournament: tournament._id,
      amount: category.fee,
      method: paymentMethod,
      referenceCode: paymentReference ? paymentReference.trim() : '',
      status: 'pending',
      notes: hasPaymentRef
        ? 'Player submitted transfer reference during registration.'
        : 'Awaiting player payment reference or arena desk settlement.',
    });

    await Notification.create({
      title: isWaitlisted
        ? `Waitlisted: ${tournament.name} (${category.code})`
        : `Registration Received: ${tournament.name}`,
      message: isWaitlisted
        ? `Category ${category.name} is currently at capacity. Your entry (${registration.registrationNumber}) has been placed on the official waitlist.`
        : `Your entry (${registration.registrationNumber}) for ${category.name} has been submitted. Entry fee: $${category.fee}.`,
      type: 'registration',
      audience: 'individual',
      tournament: tournament._id,
      recipientUsers: [req.user._id],
      recipientCount: 1,
    });

    const populated = await Registration.findById(registration._id)
      .populate('tournament', 'name slug venue city startDate')
      .populate('team', 'name teamCode status');

    res.status(201).json({
      success: true,
      message: isWaitlisted
        ? 'Category is full — you have been added to the official waitlist!'
        : 'Registration submitted successfully!',
      registration: populated,
      payment,
    });
  } catch (err) {
    next(err);
  }
};

export const submitPaymentReference = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { method = 'bank_transfer', referenceCode = '' } = req.body;

    if (!referenceCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid payment transfer or receipt reference code.',
      });
    }

    const player = await Player.findOne({ user: req.user._id });
    const registration = await Registration.findById(id);

    if (
      !registration ||
      (String(registration.user) !== String(req.user._id) &&
        (!player || String(registration.player) !== String(player._id)))
    ) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found for your account.',
      });
    }

    registration.paymentStatus = 'pending';
    await registration.save();

    let payment = await Payment.findOne({ registration: registration._id });
    if (payment) {
      payment.method = method;
      payment.referenceCode = referenceCode.trim();
      payment.status = 'pending';
      payment.notes = 'Updated payment reference submitted by player.';
      await payment.save();
    } else {
      payment = await Payment.create({
        receiptNumber: nextCode('PAY'),
        registration: registration._id,
        player: registration.player,
        tournament: registration.tournament,
        amount: registration.feeAmount,
        method,
        referenceCode: referenceCode.trim(),
        status: 'pending',
      });
    }

    res.json({
      success: true,
      message: 'Payment reference recorded. Organizer verification is now pending.',
      registration,
      payment,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await getPlayerForUser(req.user);
    const registrations = await getPlayerRegistrations(req.user, player);
    const tournamentIds = [
      ...new Set(registrations.map((registration) =>
        String(registration.tournament?._id || registration.tournament)
      )),
    ];
    const ownNotificationFilter = {
      $or: [
        { recipientUsers: req.user._id },
        { audience: { $in: ['all', 'players'] }, tournament: null },
        ...(tournamentIds.length
          ? [{
              audience: { $in: ['all', 'players', 'tournament'] },
              tournament: { $in: tournamentIds },
            }]
          : []),
      ],
    };

    if (id === 'all') {
      await Notification.updateMany(
        { ...ownNotificationFilter, readBy: { $ne: req.user._id } },
        { $addToSet: { readBy: req.user._id } }
      );
    } else {
      const notification = await Notification.findOne({
        _id: id,
        ...ownNotificationFilter,
      });
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found for your account.',
        });
      }
      await Notification.findByIdAndUpdate(notification._id, {
        $addToSet: { readBy: req.user._id },
      });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const player = await Player.findOne({ user: req.user._id });
    const reg = await Registration.findById(id).populate('tournament', 'name');

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (
      String(reg.user) !== String(req.user._id) &&
      (!player || String(reg.player) !== String(player._id))
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this application.' });
    }

    if (reg.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Application is already cancelled.' });
    }

    reg.status = 'cancelled';
    await reg.save();

    await Notification.create({
      title: `Application Cancelled: ${reg.tournament?.name || 'Tournament'}`,
      message: `Your application (${reg.registrationNumber}) for ${reg.categoryName} was cancelled.`,
      type: 'registration',
      audience: 'individual',
      tournament: reg.tournament?._id,
      recipientUsers: [req.user._id],
      recipientCount: 1,
    });

    res.json({ success: true, message: 'Application cancelled successfully.', registration: reg });
  } catch (err) {
    next(err);
  }
};

export const getTournamentUpdates = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);
    const registrations = await getPlayerRegistrations(req.user, player);
    const playerRegistrations = registrations.filter(
      (registration) => registration.status === 'approved'
    );

    const tournamentIds = [
      ...new Set(playerRegistrations.map((r) => String(r.tournament?._id || r.tournament))),
    ];

    const approvedRegistrations = registrations.filter((r) => r.status === 'approved');
    const [updates, matches] = await Promise.all([
      tournamentIds.length
        ? TournamentUpdate.find({ tournament: { $in: tournamentIds } })
            .populate('tournament', 'name venue city startDate endDate')
            .sort({ isPinned: -1, createdAt: -1 })
        : [],
      getPlayerMatches(approvedRegistrations),
    ]);

    res.json({
      success: true,
      updates,
      fixtures: matches.filter((m) => ['scheduled', 'live', 'postponed'].includes(m.status)),
      results: matches.filter((m) => ['completed', 'walkover'].includes(m.status)),
    });
  } catch (err) {
    next(err);
  }
};

export const getAvailableTournaments = async (req, res, next) => {
  try {
    const player = await getPlayerForUser(req.user);
    const selectedLocation = getPlayerSelectedLocation(player);
    const tournaments = await getAvailableTournamentsForPlayer(player);
    res.json({ success: true, selectedLocation, tournaments });
  } catch (err) {
    next(err);
  }
};

