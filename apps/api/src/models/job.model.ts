import { Schema, model, Document, Types } from 'mongoose';

export interface ICriteria {
  id: string;
  label: string;
  weight: number;
  description?: string;
}

export interface IJob extends Document {
  recruiterId:   Types.ObjectId;
  title:         string;
  description:   string;
  criteria:      ICriteria[];
  deadline:      Date;
  isActive:      boolean;
  analyseStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  analyseTriggeredAt?: Date;
  applicantCount: number;
  createdAt:     Date;
  updatedAt:     Date;
}

const JobSchema = new Schema<IJob>({
  recruiterId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true, maxlength: 200 },
  description:   { type: String, required: true, maxlength: 10000 },
  criteria: [{
    id:          { type: String, required: true },
    label:       { type: String, required: true },
    weight:      { type: Number, required: true, min: 0.05, max: 0.95 },
    description: String
  }],
  deadline:       { type: Date, required: true },
  isActive:       { type: Boolean, default: true },
  analyseStatus:  { type: String, enum: ['NOT_STARTED','IN_PROGRESS','COMPLETE'], default: 'NOT_STARTED' },
  analyseTriggeredAt: Date,
  applicantCount: { type: Number, default: 0 }
}, { timestamps: true });

JobSchema.index({ recruiterId: 1 });
JobSchema.index({ deadline: 1 });
JobSchema.index({ isActive: 1, deadline: 1 });

export const Job = model<IJob>('Job', JobSchema);
