import { Schema, model, Document, Types } from 'mongoose';

export interface ICriteriaScore {
  criterionId:     string;
  score:           number;
  rawSimilarity:   number;
  matchedSentence: string;
  matchedSection:  string;
  confidence:      number;
  weight:          number;
}

export interface IAnalysisResult extends Document {
  jobId:       Types.ObjectId;
  resumeId:    Types.ObjectId;
  candidateId?: Types.ObjectId;
  isAnonymous:  boolean;
  anonymousName?: string;
  resumeScore?:   number;
  githubScore?:   number;
  leetcodeScore?: number;
  finalScore?:    number;
  criteriaScores: ICriteriaScore[];
  strengths?:    string[];
  weaknesses?:   string[];
  suggestions?:  string[];
  explanation?:  string;
  rank?:         number;
  isCandidateSelected: boolean;
  recruiterNote?: string;
  feedbackSentAt?: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisResultSchema = new Schema<IAnalysisResult>({
  jobId:        { type: Schema.Types.ObjectId, ref: 'Job',    required: true },
  resumeId:     { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  candidateId:  { type: Schema.Types.ObjectId, ref: 'User' },
  isAnonymous:  { type: Boolean, default: false },
  anonymousName: String,
  resumeScore:  Number,
  githubScore:  Number,
  leetcodeScore: Number,
  finalScore:   Number,
  criteriaScores: [{
    criterionId:     String,
    score:           Number,
    rawSimilarity:   Number,
    matchedSentence: String,
    matchedSection:  String,
    confidence:      Number,
    weight:          Number
  }],
  strengths:    [String],
  weaknesses:   [String],
  suggestions:  [String],
  explanation:  String,
  rank:         Number,
  isCandidateSelected: { type: Boolean, default: false },
  recruiterNote: String,
  feedbackSentAt: Date,
  status: { type: String, enum: ['PENDING','PROCESSING','COMPLETE','FAILED'], default: 'PENDING' },
  errorMessage: String
}, { timestamps: true });

AnalysisResultSchema.index({ jobId: 1, finalScore: -1 });
AnalysisResultSchema.index({ jobId: 1, resumeId: 1 }, { unique: true });
AnalysisResultSchema.index({ candidateId: 1 });

export const AnalysisResult = model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);
