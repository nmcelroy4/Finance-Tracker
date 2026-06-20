import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budget } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const budgetSchema = z.object({
  categoryId: z.number().int().positive(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  limit: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = budgetSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  const { categoryId, monthYear, limit } = result.data;

  try {
    // Create new
    const newBudget = await db
      .insert(budget)
      .values({ categoryId, monthYear, limit })
      .returning();

    return NextResponse.json({ success: true, budget: newBudget[0] });
  } catch (error) {
    console.error('Budget creation failed:', error);
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const monthYear = searchParams.get('monthYear');

  if (!monthYear) {
    return NextResponse.json({ error: 'monthYear parameter required' }, { status: 400 });
  }

  try {
    const monthBudgets = await db
      .select()
      .from(budget)
      .where(eq(budget.monthYear, monthYear));

    return NextResponse.json(monthBudgets);
  } catch (error) {
    console.error('Budget fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await db.delete(budget).where(eq(budget.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Budget deletion failed:', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, limit } = body;

  if (!id || limit === undefined) {
    return NextResponse.json({ error: 'Missing id or limit' }, { status: 400 });
  }

  try {
    const updated = await db
      .update(budget)
      .set({ limit })
      .where(eq(budget.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, budget: updated[0] });
  } catch (error) {
    console.error('Budget update failed:', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}