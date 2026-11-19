import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPlayerDashboard,
  getPlayerProfile,
  getPlayerApplications,
  getPlayerTournaments,
  getPlayerNotificationsForUser,
  updatePlayerProfile,
  createRegistration,
  submitPaymentReference,
  markNotificationRead,
  cancelRegistration,
  getTournamentUpdates,
  getAvailableTournaments,
} from '../controllers/playerController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest, rejectCardDetails } from '../middleware/errorHandler.js';

const router = Router();

router.use(protect);

router.get('/dashboard', getPlayerDashboard);
router.get('/profile', getPlayerProfile);
router.get('/applications', getPlayerApplications);
router.get('/my-tournaments', getPlayerTournaments);
router.get('/notifications', getPlayerNotificationsForUser);
router.put('/profile', updatePlayerProfile);
router.get('/available-tournaments', getAvailableTournaments);
router.get('/updates', getTournamentUpdates);
router.patch('/registrations/:id/cancel', cancelRegistration);

router.post(
  '/registrations',
  rejectCardDetails,
  [
    body('tournamentId').notEmpty().withMessage('Tournament selection is required.'),
    body('categoryCode').notEmpty().withMessage('Category selection is required.'),
    body('eligibilityConfirmed')
      .custom((value) => value === true)
      .withMessage('Please confirm your eligibility before applying.'),
  ],
  validateRequest,
  createRegistration
);

router.post(
  '/registrations/:id/payment-ref',
  rejectCardDetails,
  [body('referenceCode').trim().notEmpty().withMessage('Payment reference code is required.')],
  validateRequest,
  submitPaymentReference
);

router.put('/notifications/:id/read', markNotificationRead);

export default router;
