import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';

export class JobController {
  static async listOpenJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const searchQuery = req.query.search as string;

      const result = await JobService.listOpenJobs(page, limit, searchQuery);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getJobDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await JobService.getJobDetail(req.params.id as string);
      res.json(job);
    } catch (err) {
      next(err);
    }
  }
}
