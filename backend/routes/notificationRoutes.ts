import express from 'express';
import { body, param } from 'express-validator';
import { getNotifications, addNotification, markNotification, deleteNotification } from '../controllers/notificationController';
import { validateRequest } from '../middleware/validateRequest';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', getNotifications);

router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('category').isIn(['info', 'alert', 'message']).withMessage('Invalid category'),
  validateRequest
], addNotification);

router.patch('/:id', [
  param('id').isMongoId().withMessage('Invalid notification ID'),
  body('read').isBoolean().withMessage('Read status must be a boolean'),
  validateRequest
], markNotification);

router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid notification ID'),
  validateRequest
], deleteNotification);

export default router;

