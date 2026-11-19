import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCrmOverview,
  listCrmPlayers,
  createCrmPlayer,
  updateCrmPlayer,
  addCrmPlayerNote,
  listCrmTournaments,
  createCrmTournament,
  updateCrmTournament,
  listCrmRegistrations,
  updateCrmRegistration,
  listCrmTeams,
  createOrLinkTeam,
  updateCrmTeam,
  generateCategoryDraw,
  createManualMatch,
  updateMatchSchedule,
  listCrmPayments,
  updateCrmPayment,
  listCommunications,
  previewAudienceCount,
  sendCommunication,
  getCrmReport,
  listAuditLogs,
  getSettingsAndStaff,
  updateSettings,
  createStaffAccount,
  updateStaffAccount,
  listTournamentUpdates,
  createTournamentUpdate,
  updateTournamentUpdate,
  deleteTournamentUpdate,
} from '../controllers/crmController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest, rejectCardDetails } from '../middleware/errorHandler.js';

const router = Router();

router.use(protect);
router.use(authorize('admin', 'organizer'));

router.get('/overview', getCrmOverview);

// Player CRM
router.get('/players', listCrmPlayers);
router.post(
  '/players',
  [
    body('fullName').trim().isLength({ min: 2 }).withMessage('Player name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
  ],
  validateRequest,
  createCrmPlayer
);
router.put('/players/:id', updateCrmPlayer);
router.post('/players/:id/notes', addCrmPlayerNote);

// Tournaments
router.get('/tournaments', listCrmTournaments);
router.post(
  '/tournaments',
  [
    body('name').trim().isLength({ min: 3 }).withMessage('Tournament name is required.'),
    body('venue').trim().notEmpty().withMessage('Venue is required.'),
    body('city').trim().notEmpty().withMessage('City is required.'),
    body('startDate').notEmpty().withMessage('Start date is required.'),
    body('endDate').notEmpty().withMessage('End date is required.'),
    body('registrationDeadline').notEmpty().withMessage('Registration deadline is required.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    body('categories').isArray({ min: 1 }).withMessage('At least one category is required.'),
  ],
  validateRequest,
  createCrmTournament
);
router.put('/tournaments/:id', updateCrmTournament);

// Tournament Bulletins / Announcements
router.get('/tournaments/:tournamentId/updates', listTournamentUpdates);
router.post(
  '/tournaments/:tournamentId/updates',
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Announcement title is required.'),
    body('content').trim().isLength({ min: 5 }).withMessage('Announcement content is required.'),
  ],
  validateRequest,
  createTournamentUpdate
);
router.put('/updates/:id', updateTournamentUpdate);
router.delete('/updates/:id', deleteTournamentUpdate);

// Registrations
router.get('/registrations', listCrmRegistrations);
router.patch('/registrations/:id', updateCrmRegistration);

// Doubles Teams
router.get('/teams', listCrmTeams);
router.post(
  '/teams',
  [
    body('tournamentId').notEmpty().withMessage('Tournament is required.'),
    body('categoryCode').notEmpty().withMessage('Category is required.'),
    body('player1Id').notEmpty().withMessage('Player 1 is required.'),
    body('player2Id').notEmpty().withMessage('Player 2 is required.'),
  ],
  validateRequest,
  createOrLinkTeam
);
router.patch('/teams/:id', updateCrmTeam);

// Draws & Fixtures
router.post(
  '/draws/generate',
  [
    body('tournamentId').notEmpty().withMessage('Tournament is required.'),
    body('categoryCode').notEmpty().withMessage('Category is required.'),
  ],
  validateRequest,
  generateCategoryDraw
);
router.post(
  '/matches',
  [
    body('tournamentId').notEmpty().withMessage('Tournament is required.'),
    body('categoryCode').notEmpty().withMessage('Category is required.'),
    body('sideALabel').trim().notEmpty().withMessage('Side A competitor label is required.'),
    body('sideBLabel').trim().notEmpty().withMessage('Side B competitor label is required.'),
  ],
  validateRequest,
  createManualMatch
);
router.patch('/matches/:id/schedule', updateMatchSchedule);

// Payments (Card details strictly rejected)
router.get('/payments', listCrmPayments);
router.patch('/payments/:id', rejectCardDetails, updateCrmPayment);

// Communications
router.get('/communications', listCommunications);
router.get('/communications/preview', previewAudienceCount);
router.post(
  '/communications',
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Subject title is required.'),
    body('message').trim().isLength({ min: 8 }).withMessage('Announcement body is required.'),
  ],
  validateRequest,
  sendCommunication
);

// Reports & CSV Export
router.get('/reports/:type', getCrmReport);

// Audit Logs
router.get('/audit-logs', listAuditLogs);

// Settings & Staff Accounts (Staff mutations require strict 'admin' role)
router.get('/settings', getSettingsAndStaff);
router.put('/settings', authorize('admin'), updateSettings);
router.post(
  '/staff',
  authorize('admin'),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Staff name is required.'),
    body('email').isEmail().withMessage('Valid staff email is required.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Temporary password must be at least 6 characters.'),
    body('role')
      .isIn(['admin', 'organizer', 'referee'])
      .withMessage('Role must be admin, organizer, or referee.'),
  ],
  validateRequest,
  createStaffAccount
);
router.patch('/staff/:id', authorize('admin'), updateStaffAccount);

export default router;
