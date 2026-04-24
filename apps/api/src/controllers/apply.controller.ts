import { Request, Response, NextFunction } from 'express';
import { ApplyService } from '../services/apply.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../utils/errors';

export class ApplyController {
  static async apply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const candidateId = req.user!.id as string;
      const jobId = req.params.id as string;
      const file = req.file;

      if (!file) {
        throw new AppError('No resume file provided', 400);
      }

      const result = await ApplyService.applyToJob(candidateId, jobId, file);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async myApplications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const candidateId = req.user!.id as string;
      const applications = await ApplyService.getCandidateApplications(candidateId);
      res.json(applications);
    } catch (err) {
      next(err);
    }
  }

  static async getResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Results are returned inside myApplications normally, but this could fetch single
      res.json({ message: 'Not implemented directly, use myApplications' });
    } catch (err) {
      next(err);
    }
  }
}
