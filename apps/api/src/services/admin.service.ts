import { User } from '../models/user.model';
import { Resume } from '../models/resume.model';
import { AnalysisResult } from '../models/result.model';
import { Notification } from '../models/notification.model';
import { AppError } from '../utils/errors';

export class AdminService {
  static async verifyRecruiter(recruiterId: string, adminId: string) {
    const recruiter = await User.findOne({ _id: recruiterId, role: 'RECRUITER' });

    if (!recruiter) throw new AppError('Recruiter not found', 404);
    if (recruiter.recruiterProfile?.status === 'VERIFIED') throw new AppError('Already verified', 400);

    if (recruiter.recruiterProfile) {
      recruiter.recruiterProfile.status = 'VERIFIED';
      recruiter.recruiterProfile.verifiedAt = new Date();
      recruiter.recruiterProfile.verifiedBy = adminId as any;
      delete recruiter.recruiterProfile.rejectionReason;
      await recruiter.save();
    }

    await Notification.create({
      userId: recruiter._id,
      type: 'RECRUITER_VERIFIED',
      payload: {
        message: 'Your recruiter account has been verified. You can now access all features.',
        verifiedAt: recruiter.recruiterProfile?.verifiedAt
      }
    });

    return recruiter;
  }

  static async rejectRecruiter(recruiterId: string, adminId: string, reason: string) {
    const recruiter = await User.findOne({ _id: recruiterId, role: 'RECRUITER' });

    if (!recruiter) throw new AppError('Recruiter not found', 404);

    if (recruiter.recruiterProfile) {
      recruiter.recruiterProfile.status = 'REJECTED';
      recruiter.recruiterProfile.rejectionReason = reason;
      recruiter.recruiterProfile.verifiedBy = adminId as any;
      await recruiter.save();
    }

    await Notification.create({
      userId: recruiter._id,
      type: 'RECRUITER_REJECTED',
      payload: { message: `Your application was rejected: ${reason}` }
    });

    return recruiter;
  }

  static async getSystemStats() {
    const [totalUsers, totalResumes, pendingRecruiters, verifiedRecruiters, totalResults] =
      await Promise.all([
        User.countDocuments(),
        Resume.countDocuments(),
        User.countDocuments({ role: 'RECRUITER', 'recruiterProfile.status': 'PENDING' }),
        User.countDocuments({ role: 'RECRUITER', 'recruiterProfile.status': 'VERIFIED' }),
        AnalysisResult.countDocuments({ status: 'COMPLETE' })
      ]);

    return { totalUsers, totalResumes, pendingRecruiters, verifiedRecruiters, totalResults };
  }
}
