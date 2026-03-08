import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// GET /api/admin/users — Paginated user management list
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }
  const users = await UserModel.find({}, '-passwordHash')
    .lean()
    .sort({ createdAt: -1 })
    .limit(200);

  return apiOk(users);
}
