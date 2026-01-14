import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '../../../../drizzle/schema';

export async function GET() {
  const allCategories = await db.select().from(categories);
  return NextResponse.json(allCategories);
}