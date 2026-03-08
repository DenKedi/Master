import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { TOTAL_TUTORIAL_STEPS } from '@/lib/battle/tutorial';

// GET /api/tutorial — Get current user's tutorial progress
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session?.user) return apiError('Unauthorized', 401);
  const userId = (session.user as any).id;

  const user = await UserModel.findById(userId).select(
    'tutorialCompleted tutorialStep',
  );
  if (!user) return apiError('User not found', 404);

  return apiOk({
    tutorialCompleted: user.tutorialCompleted,
    tutorialStep: user.tutorialStep,
    totalSteps: TOTAL_TUTORIAL_STEPS,
  });
}

// PATCH /api/tutorial — Update tutorial progress
export async function PATCH(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session?.user) return apiError('Unauthorized', 401);
  const userId = (session.user as any).id;

  const body = await req.json();
  const { tutorialStep, tutorialCompleted } = body;

  const update: Record<string, unknown> = {};

  if (typeof tutorialStep === 'number' && tutorialStep >= 0) {
    update.tutorialStep = Math.min(tutorialStep, TOTAL_TUTORIAL_STEPS);
  }

  if (typeof tutorialCompleted === 'boolean') {
    update.tutorialCompleted = tutorialCompleted;
  }

  if (Object.keys(update).length === 0) {
    return apiError('No valid fields to update');
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: update },
    { returnDocument: 'after' },
  ).select('tutorialCompleted tutorialStep');

  if (!user) return apiError('User not found', 404);

  return apiOk({
    tutorialCompleted: user.tutorialCompleted,
    tutorialStep: user.tutorialStep,
    totalSteps: TOTAL_TUTORIAL_STEPS,
  });
}
