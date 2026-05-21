export type Category = {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string | null;
};

export type TransactionLine = {
  id: number;
  categoryId: number;
  amount: number;
  notes: string | null;
};

export type Transaction = {
  id: number;
  description: string;
  totalAmount: number;
  date: string;
  notes: string | null;
  lines: TransactionLine[];
};

export type Budget = {
  id: number;
  categoryId: number;
  monthYear: string;
  limit: number;
};

export type DashboardFilterRange = 'this-month' | 'last-month' | 'last-3-months' | 'all-time' | 'custom';