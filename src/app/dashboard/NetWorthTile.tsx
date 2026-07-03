'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

// ---------- Types ----------

interface Account {
  id: number
  name: string
  type: 'liquid' | 'non_liquid' | 'debt'
  category: string
}

interface Snapshot {
  id: number
  accountId: number
  value: number        // cents
  snapshotDate: string // YYYY-MM-DD
  accountName: string
  accountType: 'liquid' | 'non_liquid' | 'debt'
  accountCategory: string
}

interface ChartPoint {
  label: string        // e.g. "Jun '26"
  date: string         // YYYY-MM-DD for sorting
  liquid: number       // dollars
  nonLiquid: number
  debt: number
  total: number
}

interface NewAccountForm {
  name: string
  type: 'liquid' | 'non_liquid' | 'debt'
  category: string
}

// ---------- Helpers ----------

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)

const monthLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })

const toFirstOfMonth = (yyyyMm: string) => `${yyyyMm}-01`

const buildChartData = (snapshots: Snapshot[]): ChartPoint[] => {
  const byDate = new Map<string, Snapshot[]>()
  for (const s of snapshots) {
    byDate.set(s.snapshotDate, [...(byDate.get(s.snapshotDate) ?? []), s])
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => ({
      date,
      label: monthLabel(date),
      liquid:    entries.filter(e => e.accountType === 'liquid').reduce((s, e) => s + e.value, 0) / 100,
      nonLiquid: entries.filter(e => e.accountType === 'non_liquid').reduce((s, e) => s + e.value, 0) / 100,
      debt:      entries.filter(e => e.accountType === 'debt').reduce((s, e) => s + e.value, 0) / 100,
      total:     entries.reduce((s, e) => s + e.value, 0) / 100,
    }))
}

const CATEGORY_OPTIONS = [
  'cash', 'brokerage', 'retirement', 'real_estate', 'vehicle', 'loan', 'credit_card', 'other',
]

const TYPE_LABELS: Record<string, string> = {
  liquid: 'Liquid', non_liquid: 'Non-liquid', debt: 'Debt',
}

// ---------- Component ----------

interface NetWorthTileProps {
  title?: string
}

export default function NetWorthTile({ title = 'Net Worth' }: NetWorthTileProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Snapshot form
  const [showSnapshotForm, setShowSnapshotForm] = useState(false)
  const [formMonth, setFormMonth] = useState('')          // YYYY-MM from <input type="month">
  const [formValues, setFormValues] = useState<Record<number, string>>({}) // accountId -> dollar string
  const [savingSnapshot, setSavingSnapshot] = useState(false)

  // Account management
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [newAccount, setNewAccount] = useState<NewAccountForm>({ name: '', type: 'liquid', category: 'cash' })
  const [savingAccount, setSavingAccount] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [accRes, snapRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/snapshot'),
      ])
      const accData  = await accRes.json().catch(() => null)
      const snapData = await snapRes.json().catch(() => null)
      setAccounts(Array.isArray(accData?.accounts) ? accData.accounts : [])
      setSnapshots(Array.isArray(snapData?.snapshots) ? snapData.snapshots : [])
    } catch (err) {
      console.error('Error loading net worth data:', err)
      setError('Could not load net worth data')
    } finally {
      setLoading(false)
    }
  }

  const chartData = buildChartData(snapshots)

  // ---------- Snapshot form ----------

  const openAddForm = () => {
    // Default to current month
    const now = new Date()
    const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setFormMonth(yyyyMm)
    setFormValues(Object.fromEntries(accounts.map(a => [a.id, ''])))
    setShowSnapshotForm(true)
  }

  const openEditForm = (date: string) => {
    const yyyyMm = date.slice(0, 7) // YYYY-MM-DD -> YYYY-MM
    const existing = snapshots.filter(s => s.snapshotDate === date)
    const vals: Record<number, string> = Object.fromEntries(accounts.map(a => [a.id, '']))
    for (const s of existing) {
      vals[s.accountId] = (s.value / 100).toFixed(2)
    }
    setFormMonth(yyyyMm)
    setFormValues(vals)
    setShowSnapshotForm(true)
  }

  const closeSnapshotForm = () => {
    setShowSnapshotForm(false)
    setFormMonth('')
    setFormValues({})
  }

  const handleSaveSnapshot = async () => {
    if (!formMonth) return
    const snapshotDate = toFirstOfMonth(formMonth)

    const entries = accounts
      .filter(a => formValues[a.id] !== '' && formValues[a.id] !== undefined)
      .map(a => ({
        accountId:    a.id,
        value:        Math.round(Number(formValues[a.id]) * 100),
        snapshotDate,
      }))

    if (entries.length === 0) return

    setSavingSnapshot(true)
    try {
      const res = await fetch('/api/snapshot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ entries }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to save snapshot:', data.error)
        setError('Could not save snapshot')
        return
      }
      // Merge upserted entries back into state — replace existing for this month, keep others
      setSnapshots(prev => {
        const kept = prev.filter(s => s.snapshotDate !== snapshotDate)
        // Re-fetch to get the joined accountName/accountType — loadAll is simplest
        return kept
      })
      await loadAll()
      closeSnapshotForm()
    } catch (err) {
      console.error('Error saving snapshot:', err)
      setError('Could not save snapshot')
    } finally {
      setSavingSnapshot(false)
    }
  }

  // ---------- Account management ----------

  const handleAddAccount = async () => {
    if (!newAccount.name) return
    setSavingAccount(true)
    try {
      const res = await fetch('/api/accounts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(newAccount),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to create account:', data.error)
        setError('Could not create account')
        return
      }
      setAccounts(prev => [...prev, data.account])
      setNewAccount({ name: '', type: 'liquid', category: 'cash' })
      setShowAccountForm(false)
    } catch (err) {
      console.error('Error creating account:', err)
      setError('Could not create account')
    } finally {
      setSavingAccount(false)
    }
  }

  const handleDeleteAccount = async (id: number) => {
    try {
      const res = await fetch('/api/accounts', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      if (!res.ok) return
      setAccounts(prev => prev.filter(a => a.id !== id))
      setSnapshots(prev => prev.filter(s => s.accountId !== id))
    } catch (err) {
      console.error('Error deleting account:', err)
    }
  }

  // ---------- Render ----------

  // Unique months for the summary table
  const months = [...new Set(snapshots.map(s => s.snapshotDate))].sort((a, b) => b.localeCompare(a))

  return (
    <Card>
      <CardContent className="pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAccountForm(v => !v)}>
              {showAccountForm ? 'Done' : 'Manage Accounts'}
            </Button>
            <Button size="sm" onClick={openAddForm} disabled={accounts.length === 0}>
              Add Snapshot
            </Button>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {/* Account management panel */}
        {showAccountForm && (
          <div className="mb-6 border rounded-md p-4">
            <p className="text-sm font-medium mb-3">Accounts</p>
            <div className="space-y-2 mb-4">
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500">No accounts yet — add one below.</p>
              ) : (
                accounts.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-gray-500 mr-auto ml-3">{TYPE_LABELS[a.type]} · {a.category}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteAccount(a.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Name</label>
                <Input
                  value={newAccount.name}
                  onChange={e => setNewAccount(v => ({ ...v, name: e.target.value }))}
                  placeholder="e.g. Wife 401k"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Type</label>
                <select
                  className="border rounded-md h-9 px-2 text-sm"
                  value={newAccount.type}
                  onChange={e => setNewAccount(v => ({ ...v, type: e.target.value as Account['type'] }))}
                >
                  <option value="liquid">Liquid</option>
                  <option value="non_liquid">Non-liquid</option>
                  <option value="debt">Debt</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Category</label>
                <select
                  className="border rounded-md h-9 px-2 text-sm"
                  value={newAccount.category}
                  onChange={e => setNewAccount(v => ({ ...v, category: e.target.value }))}
                >
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={handleAddAccount} disabled={savingAccount || !newAccount.name}>
                Add Account
              </Button>
            </div>
          </div>
        )}

        {/* Snapshot form */}
        {showSnapshotForm && (
          <div className="mb-6 border rounded-md p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Month</label>
                <Input
                  type="month"
                  value={formMonth}
                  onChange={e => setFormMonth(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {accounts.map(a => (
                <div key={a.id} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">
                    {a.name}
                    <span className="ml-1 text-gray-400">({TYPE_LABELS[a.type]})</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formValues[a.id] ?? ''}
                    onChange={e => setFormValues(v => ({ ...v, [a.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={closeSnapshotForm}>Cancel</Button>
              <Button size="sm" onClick={handleSaveSnapshot} disabled={savingSnapshot || !formMonth}>
                Save Snapshot
              </Button>
            </div>
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            No data yet — add accounts, then record your first snapshot.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={v => `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                formatter={(value) => {
                    const amount = typeof value === 'number' ? value : Number(value);

                    return Number.isFinite(amount)
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                        }).format(amount)
                    : '—';
                }}
                />
              <Legend />
              <Line type="monotone" dataKey="total"     name="Total"      stroke="#1d4ed8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="liquid"    name="Liquid"     stroke="#16a34a" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="nonLiquid" name="Non-liquid" stroke="#9333ea" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="debt"      name="Debt"       stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Monthly summary table */}
        {months.length > 0 && (
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Liquid</TableHead>
                  <TableHead className="text-right">Non-liquid</TableHead>
                  <TableHead className="text-right">Debt</TableHead>
                  <TableHead className="text-right font-semibold">Net Worth</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map(date => {
                  const entries    = snapshots.filter(s => s.snapshotDate === date)
                  const liquid     = entries.filter(e => e.accountType === 'liquid').reduce((s, e) => s + e.value, 0)
                  const nonLiquid  = entries.filter(e => e.accountType === 'non_liquid').reduce((s, e) => s + e.value, 0)
                  const debt       = entries.filter(e => e.accountType === 'debt').reduce((s, e) => s + e.value, 0)
                  const total      = liquid + nonLiquid + debt

                  return (
                    <TableRow key={date}>
                      <TableCell className="font-medium">{monthLabel(date)}</TableCell>
                      <TableCell className="text-right text-green-700">{fmt(liquid)}</TableCell>
                      <TableCell className="text-right text-purple-700">{fmt(nonLiquid)}</TableCell>
                      <TableCell className="text-right text-red-600">{fmt(debt)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(total)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openEditForm(date)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

      </CardContent>
    </Card>
  )
}