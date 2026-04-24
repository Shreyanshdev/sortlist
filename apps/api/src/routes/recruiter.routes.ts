import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { resumeUpload } from '../middleware/upload.middleware';
import { RecruiterController } from '../controllers/recruiter.controller';

const router = Router();

router.use(requireAuth, requireRole('RECRUITER'));

router.post('/jobs',                    RecruiterController.createJob);
router.get('/jobs',                     RecruiterController.listMyJobs);
router.post('/jobs/:id/analyse',        RecruiterController.triggerAnalyse);
router.post('/jobs/:id/bulk-upload',    resumeUpload.array('resumes', 50), RecruiterController.bulkUploadResumes);
router.get('/jobs/:id/results',         RecruiterController.getRankedResults);
router.post('/jobs/:id/send-feedback',  RecruiterController.sendFeedback);

export default router;
