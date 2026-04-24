import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'RECRUITER_VERIFIED' | 'RECRUITER_REJECTED'
  | 'APPLICATION_RECEIVED' | 'ANALYSE_COMPLETE'
  | 'CANDIDATE_SELECTED' | 'CANDIDATE_REJECTED';

export interface INotification extends Document {
  userId:  Types.ObjectId;
  type:    NotificationType;
  payload: Record<string, unknown>;
  read:    boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  read:    { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
