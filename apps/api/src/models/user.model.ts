import { Schema, model, Document, Types } from 'mongoose';

export type Role = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';
export type RecruiterStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IUser extends Document {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  candidateProfile?: {
    name: string;
    linkedinUrl?: string;
    githubUrl?: string;
    leetcodeUrl?: string;
  };
  recruiterProfile?: {
    name: string;
    companyName: string;
    companyEmail: string;
    companyWebsite?: string;
    linkedinUrl?: string;
    status: RecruiterStatus;
    rejectionReason?: string;
    verifiedAt?: Date;
    verifiedBy?: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['ADMIN','RECRUITER','CANDIDATE'], default: 'CANDIDATE' },
  candidateProfile: {
    name:         String,
    linkedinUrl:  String,
    githubUrl:    String,
    leetcodeUrl:  String
  },
  recruiterProfile: {
    name:             String,
    companyName:      String,
    companyEmail:     String,
    companyWebsite:   String,
    linkedinUrl:      String,
    status:           { type: String, enum: ['PENDING','VERIFIED','REJECTED'], default: 'PENDING' },
    rejectionReason:  String,
    verifiedAt:       Date,
    verifiedBy:       { type: Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true });

UserSchema.index({ 'recruiterProfile.status': 1 });

export const User = model<IUser>('User', UserSchema);
