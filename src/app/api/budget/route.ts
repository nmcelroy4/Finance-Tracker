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
    // Check if budget already exists
    const existing = await db
      .select()
      .from(budget)
      .where(and(
        eq(budget.categoryId, categoryId),
        eq(budget.monthYear, monthYear)
      ));

    if (existing.length > 0) {
      // Update existing
      const updated = await db
        .update(budget)
        .set({ limit })
        .where(and(
          eq(budget.categoryId, categoryId),
          eq(budget.monthYear, monthYear)
        ))
        .returning();

      return NextResponse.json({ success: true, budget: updated[0] });
    } else {
      // Create new
      const newBudget = await db
        .insert(budget)
        .values({ categoryId, monthYear, limit })
        .returning();

      return NextResponse.json({ success: true, budget: newBudget[0] });
    }
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