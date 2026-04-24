import { Types } from 'mongoose';
import { Job, IJob } from '../models/job.model';
import { Resume } from '../models/resume.model';
import { Application } from '../models/application.model';
import { uploadToCloudinary } from '../core/cloudinary';
import crypto from 'crypto';
import { validateMagicBytes } from '../middleware/upload.middleware';
import { AppError } from '../utils/errors';

export class ApplyService {

  static async applyToJob(
    candidateId: string,
    jobId: string,
    file: Express.Multer.File
  ) {
    const job = await Job.findById(jobId);
    if (!job) throw new AppError('Job not found', 404);
    if (!job.isActive) throw new AppError('This job is no longer accepting applications', 400);
    if (job.deadline < new Date()) {
      throw new AppError('Application deadline has passed', 400, 'DEADLINE_PASSED');
    }

    const existing = await Application.findOne({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId)
    });
    if (existing) throw new AppError('You have already applied to this job', 409);

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) throw new AppError('Only PDF and DOCX allowed', 400);
    if (file.size > 5 * 1024 * 1024) throw new AppError('File must be under 5MB', 400);
    if (!validateMagicBytes(file.buffer, file.mimetype)) throw new AppError('File content does not match declared type', 400);

    // Normalize filename: remove spaces and special chars to prevent signature issues
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = `resumes/candidate/${candidateId}/${jobId}`;
    const filename = `${crypto.randomUUID()}-${cleanFileName}`;
    const { url, publicId } = await uploadToCloudinary(file.buffer, folder, filename);

    const resume = await Resume.create({
      candidateId: new Types.ObjectId(candidateId),
      jobId:       new Types.ObjectId(jobId),
      source:      'CANDIDATE_APPLY',
      filename:    file.originalname,
      s3Key:       publicId,
      fileUrl:     url,
      fileBuffer:  file.buffer,   // store bytes for ML analysis
      mimeType:    file.mimetype,
      fileSize:    file.size,
      status:      'UPLOADED'
    });

    const application = await Application.create({
      candidateId: new Types.ObjectId(candidateId),
      jobId:       new Types.ObjectId(jobId),
      resumeId:    resume._id,
      status:      'APPLIED'
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    return { applicationId: application._id, resumeId: resume._id };
  }

  static async getCandidateApplications(candidateId: string) {
    const applications = await Application.find({
      candidateId: new Types.ObjectId(candidateId)
    })
      .populate<{ jobId: IJob }>('jobId', 'title deadline description analyseStatus')
      .populate('resultId')
      .sort({ appliedAt: -1 })
      .lean();

    return applications.map(app => {
      const job = app.jobId as IJob;
      const now = new Date();
      return {
        applicationId: app._id,
        jobTitle:      job.title,
        jobDeadline:   job.deadline,
        deadlinePassed: job.deadline < now,
        analyseStatus: job.analyseStatus,
        applicationStatus: app.status,
        result: app.resultId ? {
          finalScore:   (app.resultId as any).finalScore,
          explanation:  (app.resultId as any).explanation,
          strengths:    (app.resultId as any).strengths,
          weaknesses:   (app.resultId as any).weaknesses,
          suggestions:  (app.resultId as any).suggestions,
          isCandidateSelected:   (app.resultId as any).isCandidateSelected
        } : null,
        appliedAt: app.appliedAt
      };
    });
  }
}
