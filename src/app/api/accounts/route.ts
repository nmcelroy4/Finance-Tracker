import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const accountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['liquid', 'non_liquid', 'debt']),
  category: z.enum(['cash', 'brokerage', 'retirement', 'real_estate', 'vehicle', 'loan', 'credit_card', 'other']),
});

export async function GET() {
  try {
    const allAccounts = await db.select().from(accounts).orderBy(accounts.name);
    return NextResponse.json({ success: true, accounts: allAccounts });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = accountSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  try {
    const newAccount = await db
      .insert(accounts)
      .values(result.data)
      .returning();

    return NextResponse.json({ success: true, account: newAccount[0] });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const deleted = await db.delete(accounts).where(eq(accounts.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}