import { RequestHandler } from 'express';
import { Job } from '../models/job.model';

export const checkDeadlineMiddleware: RequestHandler = async (req, res, next) => {
  const jobId = req.params.id ?? req.body.jobId;
  if (!jobId) return next();

  try {
    const job = await Job.findById(jobId).select('deadline isActive').lean();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.isActive) {
      return res.status(400).json({ error: 'This job is no longer accepting applications', code: 'JOB_INACTIVE' });
    }

    if (job.deadline < new Date()) {
      return res.status(400).json({
        error: 'Application deadline has passed',
        code: 'DEADLINE_PASSED',
        deadline: job.deadline.toISOString()
      });
    }

    next();
  } catch {
    next();
  }
};
