import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/user.model';
import { AppError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export class AuthService {
  static async register(data: { email: string; password: string; role: Role; name?: string; companyName?: string }) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) throw new AppError('Email already in use', 400);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = new User({
      email: data.email,
      passwordHash,
      role: data.role,
    });

    if (data.role === 'CANDIDATE') {
      user.candidateProfile = { name: data.name || '' };
    } else if (data.role === 'RECRUITER') {
      user.recruiterProfile = {
        name: data.name || '',
        companyName: data.companyName || '',
        companyEmail: data.email,
        status: 'PENDING'
      };
    }

    await user.save();
    return { id: user._id, email: user.email, role: user.role };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) throw new AppError('Invalid credentials', 401);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    if (user.role === 'RECRUITER' && user.recruiterProfile?.status === 'REJECTED') {
      throw new AppError('Your recruiter account was rejected.', 403);
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user: { id: user._id, email: user.email, role: user.role, status: user.recruiterProfile?.status } };
  }
}
