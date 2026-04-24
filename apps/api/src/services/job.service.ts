import { Job, IJob } from '../models/job.model';
import { Application } from '../models/application.model';
import { Types } from 'mongoose';
import { AppError } from '../utils/errors';

export class JobService {
  static async listOpenJobs(page = 1, limit = 20, searchQuery?: string) {
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
        .select('title description deadline applicantCount criteria createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter)
    ]);

    return {
      jobs: jobs.map(j => ({
        ...j,
        daysLeft: Math.ceil((new Date(j.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        deadlinePassed: false
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getJobDetail(jobId: string) {
    const job = await Job.findById(jobId).lean();
    if (!job) throw new AppError('Job not found', 404);

    const now = new Date();
    return {
      ...job,
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
