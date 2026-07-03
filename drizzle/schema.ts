import { accountCategoryEnum, accountTypeEnum } from '@/types/enum';
import { pgTable, serial, text, integer, timestamp, varchar, date, unique } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  totalAmount: integer('total_amount').notNull(),
  date: timestamp('date').notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactionLines = pgTable('transaction_lines', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const budget = pgTable('budget', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
  .notNull()
  .references(() => categories.id, {onDelete: 'cascade'}),
  monthYear: varchar('month_year', {length: 7}).notNull(),
  limit: integer('limit').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  goalAmount: integer('goal_amount').notNull(),
  currentAmount: integer('current_amount').notNull(),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),          
  type:      accountTypeEnum('type').notNull(), 
  category:  accountCategoryEnum('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
 
export const netWorthSnapshots = pgTable(
  'net_worth_snapshots',
  {
    id:           serial('id').primaryKey(),
    accountId:    integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    value:        integer('value').notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    createdAt:    timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.accountId, table.snapshotDate),
  ]
)