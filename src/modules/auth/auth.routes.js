import express from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe, forgotPassword, resetPassword } from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
router.post('/reset-password', body('newPassword').isLength({ min: 6 }), validate, resetPassword);

export default router;
