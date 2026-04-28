import { Schema, model, Document, Types } from 'mongoose';

export type ResumeStatus = 'UPLOADED' | 'PARSING' | 'PARSED' | 'EMBEDDING' | 'SCORED' | 'FAILED';
export type ResumeSource = 'CANDIDATE_APPLY' | 'RECRUITER_BULK';

export interface IParsedSections {
  summary?: string;
  skills?: string;
  experience?: string;
  education?: string;
  projects?: string;
  certifications?: string;
  other?: string;
}

export interface IResume extends Document {
  candidateId?: Types.ObjectId;
  recruiterId?: Types.ObjectId;
  source:        ResumeSource;
  jobId:         Types.ObjectId;
  filename:      string;
  s3Key:         string;
  fileUrl?:      string;
  fileBuffer?:   Buffer;
  mimeType:      string;
  fileSize:      number;
  status:        ResumeStatus;
  rawText?:      string;
  parsedSections?: IParsedSections;
  sentences?:    string[];
  extractedLinks?: {
    github:   string[];
    leetcode: string[];
    linkedin: string[];
    repos:    string[];
  };
  embeddingCached: boolean;
  errorMessage?: string;
  uploadedAt:    Date;
  processedAt?:  Date;
}

const ResumeSchema = new Schema<IResume>({
  candidateId:    { type: Schema.Types.ObjectId, ref: 'User' },
  recruiterId:    { type: Schema.Types.ObjectId, ref: 'User' },
  source:         { type: String, enum: ['CANDIDATE_APPLY','RECRUITER_BULK'], required: true },
  jobId:          { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  filename:       { type: String, required: true },
  s3Key:          { type: String, required: true, unique: true },
  fileUrl:        { type: String },
  fileBuffer:     { type: Buffer },
  mimeType:       { type: String, required: true },
  fileSize:       { type: Number, required: true },
  status:         { type: String, enum: ['UPLOADED','PARSING','PARSED','EMBEDDING','SCORED','FAILED'], default: 'UPLOADED' },
  rawText:        String,
  parsedSections: {
    summary: String, skills: String, experience: String,
    education: String, projects: String, certifications: String, other: String
  },
  sentences:      [String],
  extractedLinks: {
    github:   [String],
    leetcode: [String],
    linkedin: [String],
    repos:    [String]
  },
  embeddingCached: { type: Boolean, default: false },
  errorMessage:   String,
  uploadedAt:     { type: Date, default: Date.now },
  processedAt:    Date
}, { timestamps: false });

ResumeSchema.index({ jobId: 1, source: 1 });
ResumeSchema.index({ candidateId: 1 });
ResumeSchema.index({ status: 1 });

export const Resume = model<IResume>('Resume', ResumeSchema);
