'use client'

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardTitle } from "@/components/ui/Card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/Input"
import { Checkbox } from "@/components/ui/Checkbox"
import { useEffect, useState } from "react"

interface Goal {
  id: number
  title: string
  goalAmount: number   
  currentAmount: number 
  dueDate: string | null
}

interface GoalsTileProps {
  title?: string
  deletable?: boolean
}

const toIsoDateTime = (dateOnly: string) => new Date(`${dateOnly}T00:00:00.000Z`).toISOString()

export default function GoalsTile({ title = "Goals", deletable = true }: GoalsTileProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [deleteMode, setDeleteMode] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editGoalAmount, setEditGoalAmount] = useState('')
  const [editCurrentAmount, setEditCurrentAmount] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGoalAmount, setNewGoalAmount] = useState('')
  const [newCurrentAmount, setNewCurrentAmount] = useState('0')
  const [newDueDate, setNewDueDate] = useState('')

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/goals')
      if (!res.ok) throw new Error('Failed to load goals')
      const data = await res.json()
      setGoals(data.goals ?? []) 
    } catch (err) {
      console.error('Error loading goals:', err)
      setError('Could not load goals')
    } finally {
      setLoading(false)
    }
  }

  const getPercentage = (goal: Goal) => {
    return goal.goalAmount > 0
      ? Math.round((goal.currentAmount / goal.goalAmount) * 100)
      : 0
  }

  const getStatus = (goal: Goal) => {
    const pct = getPercentage(goal)
    if (pct >= 100) return 'Reached'
    if (goal.dueDate && new Date(goal.dueDate) < new Date()) return 'Past due'
    if (pct === 0) return 'Not started'
    return 'In progress'
  }

  const resetCreateForm = () => {
    setNewTitle('')
    setNewGoalAmount('')
    setNewCurrentAmount('0')
    setNewDueDate('')
    setCreating(false)
  }

  const handleCreate = async () => {
    if (!newTitle || !newGoalAmount) return
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          goalAmount: Math.round(Number(newGoalAmount) * 100),
          currentAmount: Math.round(Number(newCurrentAmount || '0') * 100),
          ...(newDueDate ? { dueDate: toIsoDateTime(newDueDate) } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to create goal:', data.error)
        setError('Could not create goal')
        return
      }
      setGoals(prev => [...prev, data.goal])
      resetCreateForm()
    } catch (err) {
      console.error('Error creating goal:', err)
      setError('Could not create goal')
    }
  }

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setEditTitle(goal.title)
    setEditGoalAmount((goal.goalAmount / 100).toFixed(2))
    setEditCurrentAmount((goal.currentAmount / 100).toFixed(2))
    setEditDueDate(goal.dueDate ? goal.dueDate.slice(0, 10) : '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditGoalAmount('')
    setEditCurrentAmount('')
    setEditDueDate('')
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editGoalAmount || !editCurrentAmount) return
    try {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: editTitle,
          goalAmount: Math.round(Number(editGoalAmount) * 100),
          currentAmount: Math.round(Number(editCurrentAmount) * 100),
          dueDate: editDueDate ? toIsoDateTime(editDueDate) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to update goal:', data.error)
        setError('Could not update goal')
        return
      }
      setGoals(prev => prev.map(g => (g.id === id ? data.goal : g)))
      cancelEdit()
    } catch (err) {
      console.error('Error updating goal:', err)
      setError('Could not update goal')
    }
  }

  const toggleRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleDelete = async () => {
    try {
      for (const id of selectedIds) {
        const res = await fetch('/api/goals', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        if (!res.ok) {
          const err = await res.json()
          console.error(`Failed to delete goal ${id}:`, err.error)
        }
      }
      setGoals(prev => prev.filter(g => !selectedIds.includes(g.id)))
      setSelectedIds([])
    } catch (err) {
      console.error('Error deleting goals:', err)
      setError('Could not delete selected goals')
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {deletable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteMode(v => !v)
                  setSelectedIds([])
                }}
              >
                {deleteMode ? 'Done' : 'Select'}
              </Button>
            )}
            <Button size="sm" onClick={() => setCreating(v => !v)}>
              {creating ? 'Cancel' : 'New Goal'}
            </Button>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {creating && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 items-end border rounded-md p-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Title</label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Emergency fund" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Goal amount ($)</label>
              <Input type="number" step="0.01" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Starting amount ($)</label>
              <Input type="number" step="0.01" value={newCurrentAmount} onChange={e => setNewCurrentAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Due date</label>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
            <div className="col-span-2 md:col-span-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetCreateForm}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}>Save Goal</Button>
            </div>
          </div>
        )}

        {deleteMode && selectedIds.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm">{selectedIds.length} selected</span>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete Selected
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
              Clear Selection
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              {deleteMode && <TableHead className="w-12"></TableHead>}
              <TableHead>Goal</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Saved</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  Loading goals…
                </TableCell>
              </TableRow>
            ) : goals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No goals yet
                </TableCell>
              </TableRow>
            ) : (
              goals.map(goal => {
                const percentage = getPercentage(goal)
                const status = getStatus(goal)
                const reached = percentage >= 100
                const isEditing = editingId === goal.id

                return (
                  <TableRow key={goal.id} className={reached ? 'bg-green-50' : ''}>
                    {deleteMode && (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedIds.includes(goal.id)}
                          onCheckedChange={() => toggleRow(goal.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {isEditing ? (
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-36" />
                      ) : (
                        goal.title
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editGoalAmount}
                          onChange={e => setEditGoalAmount(e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        `$${(goal.goalAmount / 100).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editCurrentAmount}
                          onChange={e => setEditCurrentAmount(e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        `$${(goal.currentAmount / 100).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editDueDate}
                          onChange={e => setEditDueDate(e.target.value)}
                          className="w-36"
                        />
                      ) : (
                        goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          reached
                            ? 'bg-green-100 text-green-800'
                            : status === 'Past due'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${reached ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10">{percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => saveEdit(goal.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEdit(goal)}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
