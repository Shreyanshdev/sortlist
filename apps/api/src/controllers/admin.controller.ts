import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/user.model';

export class AdminController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  static async listRecruiters(req: Request, res: Response, next: NextFunction) {
    try {
      const recruiters = await User.find({ role: 'RECRUITER' });
      res.json(recruiters);
    } catch (err) {
      next(err);
    }
  }

  static async listPendingRecruiters(req: Request, res: Response, next: NextFunction) {
    try {
      const recruiters = await User.find({ role: 'RECRUITER', 'recruiterProfile.status': 'PENDING' });
      res.json(recruiters);
    } catch (err) {
      next(err);
    }
  }

  static async verifyRecruiter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id as string;
      const recruiterId = req.params.id as string;
      const recruiter = await AdminService.verifyRecruiter(recruiterId, adminId);
      res.json(recruiter);
    } catch (err) {
      next(err);
    }
  }

  static async rejectRecruiter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id as string;
      const recruiterId = req.params.id as string;
      const { reason } = req.body;
      const recruiter = await AdminService.rejectRecruiter(recruiterId, adminId, reason);
      res.json(recruiter);
    } catch (err) {
      next(err);
    }
  }

  static async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getSystemStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
}
