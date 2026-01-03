'use client';

import { useEffect, useState } from 'react';


type Expense = {
  id: number;
  description: string;
  amount: number;
  createdAt: string;
};

export default function HomePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: 0 });

  useEffect(() => {
    const loadExpenses = async () => {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data);
    };

    loadExpenses();
  }, []);

  return (
    <main>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const res = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              description,
              amount: Number(amount), // cast string to number
            }),
          });

          if (res.ok) {
            setDescription('');
            setAmount('');
            const newData = await res.json();
            // Optional: Re-fetch the full list or add to the existing list
            setExpenses((prev) => [...prev, { ...newData.expense }]);
          } else {
            console.error('Failed to create expense');
          }
        }}
      >
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit">Add Expense</button>
      </form>

      <h1>Expenses</h1>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
          {editingId === expense.id ? (
            <>
              <input
                type="text"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
                }
              />
              <button
                onClick={async () => {
                  const res = await fetch('/api/expenses', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      id: expense.id,
                      ...editForm,
                    }),
                  });
        
                  if (res.ok) {
                    setExpenses((prev) =>
                      prev.map((e) =>
                        e.id === expense.id ? { ...e, ...editForm } : e
                      )
                    );
                    setEditingId(null);
                  }
                }}
              >
                Save
              </button>
              <button onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <>
              {expense.description} — ${expense.amount}
              <button
                onClick={() => {
                  setEditingId(expense.id);
                  setEditForm({
                    description: expense.description,
                    amount: expense.amount,
                  });
                }}
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  const res = await fetch('/api/expenses', {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: expense.id }),
                  });
        
                  if (res.ok) {
                    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
                  }
                }}
              >
                Delete
              </button>
            </>
          )}
        </li>
        ))}
      </ul>
    </main>
  );
}
