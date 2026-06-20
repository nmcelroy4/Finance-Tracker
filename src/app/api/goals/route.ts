import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const goalsSchema = z.object({
  title: z.string(),
  goalAmount: z.number().int().positive(),
  currentAmount: z.number().int().nonnegative(), // was .positive(), blocked 0
  dueDate: z.string().datetime().optional(),
});

const goalsUpdateSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  goalAmount: z.number().int().positive().optional(),
  currentAmount: z.number().int().nonnegative().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    const allGoals = await db.select().from(goals);
    return NextResponse.json({ success: true, goals: allGoals });
  } catch (error) {
    console.error('Goal fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = goalsSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  const { title, goalAmount, currentAmount, dueDate } = result.data;

  try {
    const newGoal = await db
      .insert(goals)
      .values({
        title,
        goalAmount,
        currentAmount: currentAmount ?? 0,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    return NextResponse.json({ success: true, goal: newGoal[0] });
  } catch (error) {
    console.error('Goal creation failed:', error);
    return NextResponse.json({ error: 'Failed to save goal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const deleted = await db.delete(goals).where(eq(goals.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Goal deletion failed:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const result = goalsUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  const { id, title, goalAmount, currentAmount, dueDate } = result.data;

  // Build a partial update object containing only the fields that were sent
  const updateValues: Partial<typeof goals.$inferInsert> = {};
  if (title !== undefined) updateValues.title = title;
  if (goalAmount !== undefined) updateValues.goalAmount = goalAmount;
  if (currentAmount !== undefined) updateValues.currentAmount = currentAmount;
  if (dueDate !== undefined) updateValues.dueDate = dueDate ? new Date(dueDate) : null;

  if (Object.keys(updateValues).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const updated = await db
      .update(goals)
      .set(updateValues)
      .where(eq(goals.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal: updated[0] });
  } catch (error) {
    console.error('Goal update failed:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
