import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { resumeUpload } from '../middleware/upload.middleware';
import { checkDeadlineMiddleware } from '../middleware/deadline.middleware';
import { JobController } from '../controllers/job.controller';
import { ApplyController } from '../controllers/apply.controller';

const router = Router();

// Job browsing (accessible without login or with login)
router.get('/jobs',          JobController.listOpenJobs);
router.get('/jobs/:id',      JobController.getJobDetail);

router.use(requireAuth, requireRole('CANDIDATE'));

// Apply
router.post('/jobs/:id/apply',
  checkDeadlineMiddleware,
  resumeUpload.single('resume'),
  ApplyController.apply
);

// My applications
router.get('/applications',           ApplyController.myApplications);
router.get('/applications/:id/result', ApplyController.getResult);

export default router;
