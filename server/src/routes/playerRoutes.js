import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPlayerDashboard,
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
    body('emergencyContact.name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Emergency contact name is required.'),
    body('emergencyContact.phone')
      .trim()
      .isLength({ min: 6 })
      .withMessage('Valid emergency contact phone number is required.'),
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
