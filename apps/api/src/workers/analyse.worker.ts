import { MLService } from '../services/ml.service';
import { GitHubService } from '../services/github.service';
import { LeetCodeService } from '../services/leetcode.service';
import { Resume } from '../models/resume.model';
import { AnalysisResult } from '../models/result.model';
import { Job } from '../models/job.model';
import { Notification } from '../models/notification.model';
import { User } from '../models/user.model';

/**
 * Core analysis logic — reads file bytes from MongoDB, sends to ML.
 */
async function processResume(data: {
  jobId: string;
  resumeId: string;
  mimeType: string;
  criteria: any[];
  githubUrl: string | null;
  leetcodeUrl: string | null;
  totalInJob: number;
}) {
  const { jobId, resumeId, mimeType, criteria, githubUrl, leetcodeUrl } = data;

  try {
    await Resume.findByIdAndUpdate(resumeId, { status: 'PARSING' });
    await AnalysisResult.findOneAndUpdate({ resumeId }, { status: 'PROCESSING' });

    // Step 1: Read file bytes from MongoDB
    const resumeDoc = await Resume.findById(resumeId).select('fileBuffer').lean();
    if (!resumeDoc?.fileBuffer) {
      throw new Error('No file buffer found in database. Please re-upload the resume.');
    }

    // MongoDB .lean() returns Binary objects; extract the underlying buffer properly
    const rawBuf = resumeDoc.fileBuffer;
    const fileBuffer = Buffer.isBuffer(rawBuf)
      ? rawBuf
      : Buffer.from((rawBuf as any).buffer ?? rawBuf);

    if (fileBuffer.length === 0) {
      throw new Error(`Resume ${resumeId} has an empty file buffer (0 bytes). Please re-upload.`);
    }

    const fileBase64 = fileBuffer.toString('base64');
    console.log(`[Analyse] Read ${fileBuffer.length} bytes from MongoDB for resume ${resumeId}`);

    // Step 2: Parse — send file bytes to ML service
    const ext = mimeType.includes('pdf') ? 'pdf' : 'docx';
    const parseResult = await MLService.parseResume(fileBase64, ext);

    await Resume.findByIdAndUpdate(resumeId, {
      status: 'PARSED',
      rawText: parseResult.rawText,
      parsedSections: parseResult.sections,
      sentences: parseResult.sentences
    });

    // Step 3: External signals (GitHub + LeetCode)
    await Resume.findByIdAndUpdate(resumeId, { status: 'EMBEDDING' });

    const [githubResult, leetcodeResult] = await Promise.allSettled([
      githubUrl ? GitHubService.analyze(githubUrl, criteria) : Promise.resolve(null),
      leetcodeUrl ? LeetCodeService.analyze(leetcodeUrl) : Promise.resolve(null)
    ]);

    const githubScore = githubResult.status === 'fulfilled' ? githubResult.value?.score ?? null : null;
    const leetcodeScore = leetcodeResult.status === 'fulfilled' ? leetcodeResult.value?.score ?? null : null;

    // Step 4: Score via ML
    const scoreResult = await MLService.scoreResume({
      s3Key: '',
      parsedSections: parseResult.sections,
      sentences: parseResult.sentences,
      criteria,
      githubScore,
      leetcodeScore
    });

    await Resume.findByIdAndUpdate(resumeId, { status: 'SCORED', processedAt: new Date() });

    await AnalysisResult.findOneAndUpdate(
      { resumeId },
      {
        status: 'COMPLETE',
        resumeScore: scoreResult.resume_score,
        githubScore,
        leetcodeScore,
        finalScore: scoreResult.final_score,
        criteriaScores: Object.entries(scoreResult.criteria_scores).map(([criterionId, d]: [string, any]) => ({
          criterionId,
          score: d.score,
          rawSimilarity: d.rawSimilarity,
          matchedSentence: d.matchedSentence,
          matchedSection: d.matchedSection,
          confidence: d.confidence,
          weight: d.weight
        })),
        strengths: scoreResult.strengths,
        weaknesses: scoreResult.weaknesses,
        suggestions: scoreResult.suggestions,
        explanation: scoreResult.explanation
      }
    );

    console.log(`[Analyse] ✅ Resume ${resumeId} scored: ${scoreResult.final_score.toFixed(3)}`);

  } catch (err) {
    console.error(`[Analyse] ❌ Resume ${resumeId} failed:`, err);
    await Resume.findByIdAndUpdate(resumeId, {
      status: 'FAILED',
      errorMessage: String(err)
    });
    await AnalysisResult.findOneAndUpdate(
      { resumeId },
      { status: 'FAILED', errorMessage: String(err) }
    );
  }
}

/**
 * After all resumes for a job are processed, rank them and update job status.
 */
async function finalizeJob(jobId: string) {
  const pendingCount = await AnalysisResult.countDocuments({
    jobId,
    status: { $in: ['PENDING', 'PROCESSING'] }
  });

  if (pendingCount === 0) {
    const results = await AnalysisResult.find({ jobId, status: 'COMPLETE' })
      .sort({ finalScore: -1 })
      .lean();

    const rankOps = results.map((r, i) => ({
      updateOne: {
        filter: { _id: r._id },
        update: { $set: { rank: i + 1 } }
      }
    }));
    if (rankOps.length > 0) {
      await AnalysisResult.bulkWrite(rankOps as any);
    }

    await Job.findByIdAndUpdate(jobId, { analyseStatus: 'COMPLETE' });

    const jobDoc = await Job.findById(jobId).lean();
    if (jobDoc) {
      await Notification.create({
        userId: jobDoc.recruiterId,
        type: 'ANALYSE_COMPLETE',
        payload: { jobId, jobTitle: jobDoc.title, totalRanked: results.length }
      });
    }

    console.log(`[Analyse] 🎉 Job ${jobId} analysis complete — ${results.length} ranked`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Direct execution mode (no Redis needed).
// Processes all resumes sequentially in-process.
// ──────────────────────────────────────────────────────────────────────────────

export async function runAnalysis(resumeJobs: Array<{
  jobId: string;
  resumeId: string;
  mimeType: string;
  criteria: any[];
  githubUrl: string | null;
  leetcodeUrl: string | null;
  totalInJob: number;
}>) {
  if (resumeJobs.length === 0) return;

  const first = resumeJobs[0];
  if (!first) return;

  const jobId = first.jobId;
  console.log(`[Analyse] Starting analysis for job ${jobId} — ${resumeJobs.length} resumes`);

  for (const resumeData of resumeJobs) {
    await processResume(resumeData);
  }

  await finalizeJob(jobId);
}
