import { Request, Response, NextFunction } from 'express';
import { RecruiterService } from '../services/recruiter.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class RecruiterController {
  static async createJob(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recruiterId = req.user!.id as string;
      const { title, description, deadline, criteria, enableGithubInspection, enableLeetcodeInspection } = req.body;
      const result = await RecruiterService.createJob(recruiterId, {
        title, description, deadline, criteria,
        enableGithubInspection, enableLeetcodeInspection
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async listMyJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recruiterId = req.user!.id as string;
      const result = await RecruiterService.listRecruiterJobs(recruiterId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async bulkUploadResumes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recruiterId = req.user!.id as string;
      const jobId = req.params.id as string;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const result = await RecruiterService.bulkUploadResumes(recruiterId, jobId, files);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async triggerAnalyse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recruiterId = req.user!.id as string;
      const jobId = req.params.id as string;

      const result = await RecruiterService.triggerAnalyse(jobId, recruiterId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getRankedResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recruiterId = req.user!.id as string;
      const jobId = req.params.id as string;

      const result = await RecruiterService.getRankedResults(jobId, recruiterId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async sendFeedback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recruiterId = req.user!.id as string;
      const jobId = req.params.id as string;
      const { selectedResultIds } = req.body;

      if (!Array.isArray(selectedResultIds)) {
        return res.status(400).json({ error: 'selectedResultIds must be an array' });
      }

      const result = await RecruiterService.sendFeedback(jobId, recruiterId, selectedResultIds);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
