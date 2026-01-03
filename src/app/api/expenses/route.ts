import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses } from 'drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = expenseSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  const { description, amount } = result.data;

  const newExpense = await db.insert(expenses).values({
    description,
    amount,
    createdAt: new Date(),
  }).returning();

  return NextResponse.json({ success: true, expense: newExpense[0] });
}

export async function GET() {
  const allExpenses = await db.select().from(expenses);
  return NextResponse.json(allExpenses);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await db.delete(expenses).where(eq(expenses.id, id));

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const result = expenseSchema.extend({ id: z.number() }).safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  const { id, description, amount } = result.data;

  await db.update(expenses)
    .set({ description, amount })
    .where(eq(expenses.id, id));

  return NextResponse.json({ success: true });
}
