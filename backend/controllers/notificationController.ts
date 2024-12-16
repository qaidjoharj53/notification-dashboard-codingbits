import { Request, Response } from 'express';
import Notification, { INotification } from '../models/Notification';
import { io } from '../server';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const cachedNotifications = await redisClient.get(`notifications:${userId}`);

    if (cachedNotifications) {
      return res.json(JSON.parse(cachedNotifications));
    }

    const notifications = await Notification.find({ userId }).sort({ timestamp: -1 });
    await redisClient.setex(`notifications:${userId}`, 3600, JSON.stringify(notifications));

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const addNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const notification = new Notification({
      ...req.body,
      userId
    });
    await notification.save();

    await redisClient.del(`notifications:${userId}`);

    io.emit('newNotification', notification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error adding notification' });
  }
};

export const markNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: req.body.read },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await redisClient.del(`notifications:${userId}`);

    io.emit('updateNotification', notification);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await redisClient.del(`notifications:${userId}`);

    io.emit('deleteNotification', req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

