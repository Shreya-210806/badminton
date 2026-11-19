import { Router } from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = Router();

router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters.'),
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    body('phone')
      .trim()
      .custom((value) => value.replace(/\D/g, '').length >= 6)
      .withMessage('A valid contact number is required.'),
    body('gender')
      .isIn(['Male', 'Female', 'Other'])
      .withMessage('Please select a valid gender.'),
    body('age').isInt({ min: 1, max: 120 }).withMessage('Enter an age between 1 and 120.'),
  ],
  validateRequest,
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validateRequest,
  login
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required.')],
  validateRequest,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('resetCode').trim().notEmpty().withMessage('Reset code is required.'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long.'),
  ],
  validateRequest,
  resetPassword
);

router.get('/me', protect, getMe);

export default router;
