import { Job, IJob } from '../models/job.model';
import { Application } from '../models/application.model';
import { User } from '../models/user.model';
import { Resume } from '../models/resume.model';
import { Types } from 'mongoose';
import { AppError } from '../utils/errors';

export class JobService {
  static async listOpenJobs(page = 1, limit = 20, searchQuery?: string, candidateId?: string) {
    const now = new Date();
    const filter: Record<string, unknown> = {
      isActive: true,
      deadline: { $gt: now }
    };

    if (searchQuery) {
      filter.$text = { $search: searchQuery };
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .select('title description deadline applicantCount criteria recruiterId enableGithubInspection enableLeetcodeInspection createdAt')
        .populate('recruiterId', 'recruiterProfile.companyName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter)
    ]);

    // Get applied job IDs for this candidate
    let appliedJobIds = new Set<string>();
    if (candidateId) {
      const applications = await Application.find({
        candidateId: new Types.ObjectId(candidateId)
      }).select('jobId').lean();
      appliedJobIds = new Set(applications.map(a => a.jobId.toString()));
    }

    return {
      jobs: jobs.map(j => ({
        ...j,
        companyName: (j.recruiterId as any)?.recruiterProfile?.companyName ?? 'Unknown Company',
        recruiterId: undefined, // Don't leak recruiter ID to candidates
        daysLeft: Math.ceil((new Date(j.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        deadlinePassed: false,
        hasApplied: appliedJobIds.has((j._id as any).toString())
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getJobDetail(jobId: string) {
    const job = await Job.findById(jobId)
      .populate('recruiterId', 'recruiterProfile.companyName')
      .lean();
    if (!job) throw new AppError('Job not found', 404);

    const now = new Date();
    return {
      ...job,
      companyName: (job.recruiterId as any)?.recruiterProfile?.companyName ?? 'Unknown Company',
      deadlinePassed: job.deadline < now,
      daysLeft: Math.max(0, Math.ceil((job.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    };
  }

  static async hasApplied(candidateId: string, jobId: string): Promise<boolean> {
    const app = await Application.findOne({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId)
    });
    return !!app;
  }
}

