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

const nextCode = (prefix) =>
  `${prefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

const isCategoryEligible = (category, player) => {
  const genderEligible =
    !category.gender ||
    category.gender === 'Any' ||
    category.gender === player.gender ||
    (category.gender === 'Mixed' && ['Male', 'Female'].includes(player.gender));
  const ageEligible =
    !category.ageGroup ||
    category.ageGroup === 'Open' ||
    category.ageGroup === player.ageGroup;

  return genderEligible && ageEligible;
};

export const getPlayerDashboard = async (req, res, next) => {
  try {
    let player = await Player.findOne({ user: req.user._id });
    if (!player) {
      player = await Player.create({
        user: req.user._id,
        playerCode: `PL-${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: req.user.name,
        email: req.user.email,
      });
    }

    const registrations = await Registration.find({
      $or: [{ player: player._id }, { partner: player._id }, { user: req.user._id }],
    })
      .populate('tournament', 'name slug venue city startDate endDate status')
      .populate('partner', 'fullName email club')
      .populate('team', 'name teamCode status')
      .sort({ createdAt: -1 });
    const approvedRegistrations = registrations.filter((r) => r.status === 'approved');
    const approvedTournamentIds = [
      ...new Set(approvedRegistrations.map((r) => String(r.tournament?._id || r.tournament))),
    ];
    const approvedCategoryCodes = [...new Set(approvedRegistrations.map((r) => r.categoryCode))];
    const teamIds = approvedRegistrations.map((r) => r.team?._id).filter(Boolean);

    const [payments, matches, notifications, rankPosition, orgSettings] = await Promise.all([
      Payment.find({ player: player._id })
        .populate('tournament', 'name slug')
        .populate('registration', 'registrationNumber categoryName')
        .sort({ createdAt: -1 }),
      approvedTournamentIds.length
        ? Match.find({
            tournament: { $in: approvedTournamentIds },
            categoryCode: { $in: approvedCategoryCodes },
            $or: [
              { 'sideA.player': player._id },
              { 'sideB.player': player._id },
              ...(teamIds.length > 0
                ? [{ 'sideA.team': { $in: teamIds } }, { 'sideB.team': { $in: teamIds } }]
                : []),
            ],
          })
            .populate('tournament', 'name slug venue city')
            .sort({ scheduledAt: 1 })
        : [],
      Notification.find({
        $or: [
          { audience: { $in: ['all', 'players'] } },
          { recipientUsers: req.user._id },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20),
      Player.countDocuments({ rankingPoints: { $gt: player.rankingPoints } }),
      OrganizationSetting.findOne({ singletonKey: 'default' }),
    ]);

    const enrichedNotifications = notifications.map((n) => {
      const obj = n.toObject();
      obj.isRead = (n.readBy || []).some((id) => String(id) === String(req.user._id));
      return obj;
    });

    res.json({
      success: true,
      player,
      standingRank: rankPosition + 1,
      registrations,
      payments,
      fixtures: matches.filter((m) =>
        ['scheduled', 'live', 'postponed'].includes(m.status)
      ),
      results: matches.filter((m) => m.status === 'completed' || m.status === 'walkover'),
      notifications: enrichedNotifications,
      paymentInstructions: orgSettings?.paymentInstructions || '',
    });
  } catch (err) {
    next(err);
  }
};

export const updatePlayerProfile = async (req, res, next) => {
  try {
    const player = await Player.findOne({ user: req.user._id });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player profile not found.' });
    }

    const phone = req.body.phone === undefined ? player.phone : req.body.phone;
    if (String(phone || '').trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A valid contact number is required.',
      });
    }

    const allowedFields = [
      'fullName',
      'phone',
      'gender',
      'dateOfBirth',
      'ageGroup',
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

    let player = await Player.findOne({ user: req.user._id });
    if (!player) {
      player = await Player.create({
        user: req.user._id,
        playerCode: `PL-${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: req.user.name,
        email: req.user.email,
      });
    }

    if (
      !String(player.fullName || '').trim() ||
      !String(player.email || '').trim() ||
      String(player.phone || '').trim().length < 6
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete your name, email, and contact number in your player profile before applying.',
      });
    }

    if (!isCategoryEligible(category, player)) {
      return res.status(400).json({
        success: false,
        message: `Your profile does not meet the gender or age eligibility for ${category.name}.`,
      });
    }

    if (eligibilityConfirmed !== true) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm your eligibility before applying.',
      });
    }

    // Prevent duplicate active registration by this player in the same tournament + category
    const duplicate = await Registration.findOne({
      tournament: tournament._id,
      categoryCode,
      status: { $nin: ['rejected', 'cancelled'] },
      $or: [{ player: player._id }, { partner: player._id }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `You already have an active registration (${duplicate.registrationNumber}) in ${category.name}.`,
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
    if (id === 'all') {
      await Notification.updateMany(
        { readBy: { $ne: req.user._id } },
        { $addToSet: { readBy: req.user._id } }
      );
    } else {
      await Notification.findByIdAndUpdate(id, {
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
    const player = await Player.findOne({ user: req.user._id });
    const playerRegistrations = await Registration.find({
      $or: [
        { user: req.user._id },
        ...(player ? [{ player: player._id }, { partner: player._id }] : []),
      ],
      status: { $in: ['approved', 'pending', 'waitlisted'] },
    }).select('tournament');

    const tournamentIds = [...new Set(playerRegistrations.map((r) => String(r.tournament)))];

    const updates = await TournamentUpdate.find({
      tournament: { $in: tournamentIds },
    })
      .populate('tournament', 'name venue city startDate endDate')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, updates });
  } catch (err) {
    next(err);
  }
};

export const getAvailableTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find({
      status: { $in: ['published', 'ongoing'] },
    }).sort({ startDate: 1 });

    res.json({ success: true, tournaments });
  } catch (err) {
    next(err);
  }
};

