
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../drizzle/schema'; // adjust path if needed

// Open (or create) your SQLite database file
const sqlite = new Database('drizzle/expense-tracker.db');

// Initialize Drizzle with the DB and your schema
export const db = drizzle(sqlite, { schema });
