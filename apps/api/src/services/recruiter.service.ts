import { Types } from 'mongoose';
import { Job } from '../models/job.model';
import { Resume } from '../models/resume.model';
import { AnalysisResult } from '../models/result.model';
import { User } from '../models/user.model';
import { uploadToCloudinary } from '../core/cloudinary';
import crypto from 'crypto';
import { validateMagicBytes } from '../middleware/upload.middleware';
import { AppError } from '../utils/errors';
import { runAnalysis } from '../workers/analyse.worker';
import { Application } from '../models/application.model';
import { Notification } from '../models/notification.model';

export class RecruiterService {

  static async createJob(
    recruiterId: string,
    data: {
      title: string;
      description: string;
      deadline: string;
      criteria: any[];
      enableGithubInspection?: boolean;
      enableLeetcodeInspection?: boolean;
    }
  ) {
    const recruiter = await User.findById(recruiterId);
    if (!recruiter || recruiter.recruiterProfile?.status !== 'VERIFIED') {
      throw new AppError('Your recruiter account must be verified before posting jobs', 403);
    }

    const job = await Job.create({
      recruiterId: new Types.ObjectId(recruiterId),
      title:       data.title,
      description: data.description,
      deadline:    new Date(data.deadline),
      criteria:    data.criteria,
      enableGithubInspection:   data.enableGithubInspection ?? false,
      enableLeetcodeInspection: data.enableLeetcodeInspection ?? false,
    });

    return { jobId: job._id, title: job.title };
  }

  static async listRecruiterJobs(recruiterId: string) {
    const jobs = await Job.find({ recruiterId: new Types.ObjectId(recruiterId) })
      .sort({ createdAt: -1 })
      .lean();

    return { jobs };
  }

  static async bulkUploadResumes(
    recruiterId: string,
    jobId: string,
    files: Express.Multer.File[]
  ) {
    const job = await Job.findOne({ _id: jobId, recruiterId });
    if (!job) throw new AppError('Job not found', 404);

    const resumes = [];
    for (const file of files) {
      if (!validateMagicBytes(file.buffer, file.mimetype)) continue;

      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const folder = `resumes/recruiter-bulk/${recruiterId}/${jobId}`;
      const filename = `${crypto.randomUUID()}-${cleanFileName}`;
      const { url, publicId } = await uploadToCloudinary(file.buffer, folder, filename);

      const resume = await Resume.create({
        recruiterId:  new Types.ObjectId(recruiterId),
        jobId:        new Types.ObjectId(jobId),
        source:       'RECRUITER_BULK',
        filename:     file.originalname,
        s3Key:        publicId,
        fileUrl:      url,
        fileBuffer:   file.buffer,   // store bytes for ML analysis
        mimeType:     file.mimetype,
        fileSize:     file.size,
        status:       'UPLOADED'
      });

      resumes.push(resume._id);
    }

    return { uploaded: resumes.length };
  }

  static async triggerAnalyse(jobId: string, recruiterId: string) {
    const job = await Job.findOne({ _id: jobId, recruiterId });
    if (!job) throw new AppError('Job not found', 404);

    if (job.analyseStatus === 'IN_PROGRESS') {
      throw new AppError('Analysis already in progress', 409);
    }

    const resumes = await Resume.find({
      jobId: new Types.ObjectId(jobId),
      status: { $ne: 'FAILED' }
    }).lean();

    if (resumes.length === 0) {
      throw new AppError('No resumes to analyse. Wait for candidates to apply or upload bulk resumes.', 400);
    }

    await Job.findByIdAndUpdate(jobId, {
      analyseStatus: 'IN_PROGRESS',
      analyseTriggeredAt: new Date()
    });

    // Reset resume status so the worker re-parses them
    await Resume.updateMany(
      { jobId: new Types.ObjectId(jobId), status: { $ne: 'FAILED' } },
      { $set: { status: 'UPLOADED' } }
    );

    const resultOps = resumes.map(r => ({
      updateOne: {
        filter: { jobId: r.jobId, resumeId: r._id },
        update: {
          $set: {
            jobId:        r.jobId,
            resumeId:     r._id,
            candidateId:  r.candidateId,
            isAnonymous:  r.source === 'RECRUITER_BULK',
            anonymousName: r.source === 'RECRUITER_BULK'
              ? r.filename.replace(/\.[^/.]+$/, '')
              : undefined,
            status: 'PENDING',
            // Clear old scores during re-analysis
            resumeScore: 0,
            finalScore: 0,
            rank: 999,
          }
        },
        upsert: true
      }
    }));
    await AnalysisResult.bulkWrite(resultOps as any);

    // Collect all resume jobs and run analysis directly (no Redis needed)
    const resumeJobs = [];
    for (const resume of resumes) {
      let githubUrl: string | null = null;
      let leetcodeUrl: string | null = null;

      // Only resolve external URLs if the corresponding toggle is ON
      if (resume.candidateId) {
        const candidate = await User.findById(resume.candidateId).select('candidateProfile').lean();
        if (job.enableGithubInspection) {
          githubUrl = candidate?.candidateProfile?.githubUrl ?? null;
        }
        if (job.enableLeetcodeInspection) {
          leetcodeUrl = candidate?.candidateProfile?.leetcodeUrl ?? null;
        }
      }

      console.log(`[RecruiterService] Triggering analysis for resume ${resume._id} (Job: ${jobId})`);
      console.log(`[RecruiterService]   - Profile GitHub: ${githubUrl || 'none'}`);
      console.log(`[RecruiterService]   - Profile LeetCode: ${leetcodeUrl || 'none'}`);

      resumeJobs.push({
        jobId:      jobId,
        resumeId:   resume._id.toString(),
        mimeType:   resume.mimeType,
        criteria:   job.criteria,
        githubUrl,
        leetcodeUrl,
        enableGithubInspection:   job.enableGithubInspection,
        enableLeetcodeInspection: job.enableLeetcodeInspection,
        totalInJob: resumes.length
      });
    }

    // Run analysis async (don't await — return immediately to the recruiter)
    runAnalysis(resumeJobs).catch(err => {
      console.error('[Analyse] Background analysis failed:', err);
    });

    return { queued: resumes.length };
  }

  static async getRankedResults(jobId: string, recruiterId: string) {
    const job = await Job.findOne({ _id: jobId, recruiterId }).lean();
    if (!job) throw new AppError('Job not found', 404);

    const results = await AnalysisResult.find({ jobId, status: 'COMPLETE' })
      .sort({ finalScore: -1 })
      .populate('candidateId', 'candidateProfile.name candidateProfile.githubUrl candidateProfile.linkedinUrl')
      .populate('resumeId', 'fileUrl')
      .lean();

    // Count resumes that haven't been analyzed yet (new uploads since last analysis)
    const totalResumes = await Resume.countDocuments({
      jobId: new Types.ObjectId(jobId),
      status: { $ne: 'FAILED' }
    });
    const analyzedCount = await AnalysisResult.countDocuments({ jobId });
    const newUnanalyzedCount = Math.max(0, totalResumes - analyzedCount);

    return {
      jobTitle:      job.title,
      analyseStatus: job.analyseStatus,
      totalResults:  results.length,
      newUnanalyzedCount,
      feedbackSentAt: job.feedbackSentAt ?? null,
      rankings: results.map((r, i) => ({
        rank:          r.rank ?? i + 1,
        resultId:      r._id,
        candidateName: r.isAnonymous
          ? r.anonymousName
          : (r.candidateId as any)?.candidateProfile?.name ?? 'Unknown',
        isAnonymous:   r.isAnonymous,
        isFromPortal:  !r.isAnonymous && !!r.candidateId,
        resumeFileUrl: (r.resumeId as any)?.fileUrl ?? null,
        finalScore:    r.finalScore,
        scoreBreakdown: {
          resume:   r.resumeScore,
          github:   r.githubScore,
          leetcode: r.leetcodeScore
        },
        githubBreakdown: r.githubBreakdown,
        leetcodeBreakdown: r.leetcodeBreakdown,
        criteriaScores: r.criteriaScores,
        strengths:    r.strengths,
        weaknesses:   r.weaknesses,
        suggestions:  r.suggestions,
        explanation:  r.explanation,
        isCandidateSelected:   r.isCandidateSelected,
        links: r.isAnonymous ? {} : {
          github:   (r.candidateId as any)?.candidateProfile?.githubUrl,
          linkedin: (r.candidateId as any)?.candidateProfile?.linkedinUrl
        }
      }))
    };
  }

  static async sendFeedback(jobId: string, recruiterId: string, selectedResultIds: string[]) {
    const job = await Job.findOne({ _id: jobId, recruiterId });
    if (!job) throw new AppError('Job not found', 404);
    if (job.analyseStatus !== 'COMPLETE') {
      throw new AppError('Analysis not yet complete', 400);
    }
    if (job.feedbackSentAt) {
      throw new AppError('Feedback has already been sent for this job. This action cannot be undone.', 409);
    }

    // Mark selected candidates
    await AnalysisResult.updateMany(
      { jobId: new Types.ObjectId(jobId) },
      { isCandidateSelected: false, feedbackSentAt: new Date() }
    );
    await AnalysisResult.updateMany(
      { _id: { $in: selectedResultIds }, jobId: new Types.ObjectId(jobId) },
      { isCandidateSelected: true, feedbackSentAt: new Date() }
    );

    // Mark job as feedback sent (immutable)
    await Job.findByIdAndUpdate(jobId, { feedbackSentAt: new Date() });

    const selectedResults = await AnalysisResult.find({
      _id: { $in: selectedResultIds }
    }).lean();

    const rejectedResults = await AnalysisResult.find({
      jobId:       new Types.ObjectId(jobId),
      _id:         { $nin: selectedResultIds },
      candidateId: { $exists: true },
      status:      'COMPLETE'
    }).lean();

    for (const result of selectedResults) {
      if (!result.candidateId) continue;
      await Application.findOneAndUpdate(
        { candidateId: result.candidateId, jobId: result.jobId },
        { status: 'SELECTED', resultId: result._id, notifiedAt: new Date() }
      );
      await Notification.create([{
        userId:  result.candidateId,
        type:    'CANDIDATE_SELECTED',
        payload: {
          jobId,
          jobTitle: job.title,
          message:  `Congratulations! You have been shortlisted for "${job.title}".`,
          finalScore:  result.finalScore,
          explanation: result.explanation,
          strengths:   result.strengths,
          weaknesses:  result.weaknesses
        }
      }]);
    }

    for (const result of rejectedResults) {
      if (!result.candidateId) continue;
      await Application.findOneAndUpdate(
        { candidateId: result.candidateId, jobId: result.jobId },
        { status: 'REJECTED', resultId: result._id, notifiedAt: new Date() }
      );
      await Notification.create([{
        userId:  result.candidateId,
        type:    'CANDIDATE_REJECTED',
        payload: {
          jobId,
          jobTitle: job.title,
          message:  `Thank you for applying to "${job.title}". Unfortunately, you were not selected at this time.`,
          finalScore:  result.finalScore,
          explanation: result.explanation,
          suggestions: result.suggestions
        }
      }]);
    }

    return { notified: selectedResultIds.length + rejectedResults.length };
  }
}

