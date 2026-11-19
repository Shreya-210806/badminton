import { Router } from 'express';
import { body } from 'express-validator';
import { getAssignedMatches, updateMatchScore } from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = Router();

router.use(protect);
router.use(authorize('referee', 'organizer', 'admin'));

router.get('/assigned', getAssignedMatches);

router.put(
  '/:id/score',
  [
    body('status')
      .isIn(['scheduled', 'live', 'completed', 'walkover', 'postponed'])
      .withMessage('Invalid match status.'),
  ],
  validateRequest,
  updateMatchScore
);

export default router;
