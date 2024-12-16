import express from 'express';
import { body } from 'express-validator';
import { register, login, logout } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

router.post('/register', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateRequest
], register);

router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
], login);

router.post('/logout', logout);

export default router;

