import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';
import jwt from 'jsonwebtoken';

export class JobController {
  static async listOpenJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const searchQuery = req.query.search as string;

      // Try to extract candidateId from token (optional — route is public)
      let candidateId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as any;
            if (decoded.role === 'CANDIDATE') candidateId = decoded.id;
          } catch { /* Token invalid/expired — ignore */ }
        }
      }

      const result = await JobService.listOpenJobs(page, limit, searchQuery, candidateId);
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

