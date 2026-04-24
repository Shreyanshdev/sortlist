import { Schema, model, Document, Types } from 'mongoose';

export type ApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED';

export interface IApplication extends Document {
  candidateId: Types.ObjectId;
  jobId:       Types.ObjectId;
  resumeId:    Types.ObjectId;
  status:      ApplicationStatus;
  resultId?:   Types.ObjectId;
  notifiedAt?: Date;
  appliedAt:   Date;
}

const ApplicationSchema = new Schema<IApplication>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  jobId:       { type: Schema.Types.ObjectId, ref: 'Job',    required: true },
  resumeId:    { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  status:      { type: String, enum: ['APPLIED','UNDER_REVIEW','SELECTED','REJECTED'], default: 'APPLIED' },
  resultId:    { type: Schema.Types.ObjectId, ref: 'AnalysisResult' },
  notifiedAt:  Date,
  appliedAt:   { type: Date, default: Date.now }
});

ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ jobId: 1 });
ApplicationSchema.index({ status: 1 });

export const Application = model<IApplication>('Application', ApplicationSchema);
