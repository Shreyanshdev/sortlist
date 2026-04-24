import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/users',                    AdminController.listUsers);
router.get('/recruiters',               AdminController.listRecruiters);
router.get('/recruiters/pending',       AdminController.listPendingRecruiters);
router.post('/recruiters/:id/verify',   AdminController.verifyRecruiter);
router.post('/recruiters/:id/reject',   AdminController.rejectRecruiter);
router.get('/stats',                    AdminController.getSystemStats);

export default router;
