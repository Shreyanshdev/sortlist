import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class NotificationController {
  static async getUnread(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id as string;
      const notifications = await NotificationService.getUnread(userId);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }

  static async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id as string;
      await NotificationService.markAllRead(userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}
