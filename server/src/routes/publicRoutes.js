import { Router } from 'express';
import { body } from 'express-validator';
import {
  getHomeSummary,
  listPublicTournaments,
  getPublicTournamentDetail,
  getPublicFixtures,
  getLiveAndResults,
  getPublicPlayers,
  submitContactInquiry,
} from '../controllers/publicController.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = Router();

router.get('/home', getHomeSummary);
router.get('/tournaments', listPublicTournaments);
router.get('/tournaments/:idOrSlug', getPublicTournamentDetail);
router.get('/fixtures', getPublicFixtures);
router.get('/live-results', getLiveAndResults);
router.get('/players', getPublicPlayers);

router.post(
  '/contact',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('subject').trim().notEmpty().withMessage('Subject is required.'),
    body('message')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Message must be at least 10 characters.'),
  ],
  validateRequest,
  submitContactInquiry
);

export default router;
