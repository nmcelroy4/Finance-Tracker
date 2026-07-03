import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { netWorthSnapshots, accounts } from '../../../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const snapshotEntrySchema = z.object({
  accountId: z.number().int().positive(),
  value: z.number().int(),           // cents, negative for debts
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

const batchUpsertSchema = z.object({
  entries: z.array(snapshotEntrySchema).min(1),
});

export async function GET() {
  try {
    const snapshots = await db
      .select({
        id:              netWorthSnapshots.id,
        accountId:       netWorthSnapshots.accountId,
        value:           netWorthSnapshots.value,
        snapshotDate:    netWorthSnapshots.snapshotDate,
        accountName:     accounts.name,
        accountType:     accounts.type,
        accountCategory: accounts.category,
      })
      .from(netWorthSnapshots)
      .innerJoin(accounts, eq(netWorthSnapshots.accountId, accounts.id))
      .orderBy(netWorthSnapshots.snapshotDate);

    return NextResponse.json({ success: true, snapshots });
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = batchUpsertSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  try {
    // Upsert: insert or update value if (accountId, snapshotDate) already exists
    const upserted = await db
      .insert(netWorthSnapshots)
      .values(result.data.entries)
      .onConflictDoUpdate({
        target: [netWorthSnapshots.accountId, netWorthSnapshots.snapshotDate],
        set: { value: sql`excluded.value` },
      })
      .returning();

    return NextResponse.json({ success: true, snapshots: upserted });
  } catch (error) {
    console.error('Failed to upsert snapshots:', error);
    return NextResponse.json({ error: 'Failed to save snapshots' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(netWorthSnapshots)
      .where(eq(netWorthSnapshots.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete snapshot:', error);
    return NextResponse.json({ error: 'Failed to delete snapshot' }, { status: 500 });
  }
}