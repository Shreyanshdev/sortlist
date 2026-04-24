import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.getUnread);
router.patch('/read', NotificationController.markAllRead);

export default router;
