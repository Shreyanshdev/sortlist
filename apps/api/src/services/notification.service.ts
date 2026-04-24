import { Notification } from '../models/notification.model';
import { Types } from 'mongoose';

export class NotificationService {

  static async create(data: {
    userId: string | Types.ObjectId;
    type: string;
    payload: Record<string, unknown>;
  }) {
    return Notification.create({
      userId:  data.userId,
      type:    data.type,
      payload: data.payload
    });
  }

  static async getUnread(userId: string) {
    return Notification.find({
      userId: new Types.ObjectId(userId),
      read:   false
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  static async markAllRead(userId: string) {
    await Notification.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    );
  }
}
