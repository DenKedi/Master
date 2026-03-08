import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// GET /api/users — Admin: list all users
export async function GET() {
  await connectDB();
  const session = await auth();
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }
  const users = await UserModel.find({}, '-passwordHash')
    .lean()
    .sort({ createdAt: -1 });
  return apiOk(users);
}

// POST /api/users — Public: register new user
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, email, password } = body;

  if (!username || !email || !password) {
    return apiError('username, email, and password are required');
  }
  if (password.length < 8) {
    return apiError('Password must be at least 8 characters');
  }

  await connectDB();

  const existing = await UserModel.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    return apiError('Email or username already taken');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({ username, email, passwordHash });

  return apiOk(
    { id: user._id.toString(), username: user.username, email: user.email },
    201,
  );
}
