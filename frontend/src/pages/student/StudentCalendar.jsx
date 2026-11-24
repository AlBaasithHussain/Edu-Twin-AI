import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Plus, Target, Trash2, Check } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

const PERIODS = ['daily', 'weekly', 'monthly']

export default function StudentCalendar() {
  const [exams, setExams] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState({ period: 'daily', title: '' })
  const [adding, setAdding] = useState(false)

  async function load() {
    const [examRes, goalRes] = await Promise.all([
      api.get('/api/calendar/exams'),
      api.get('/api/calendar/goals'),
    ])
    setExams(examRes.data)
    setGoals(goalRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addGoal(e) {
    e.preventDefault()
    if (!newGoal.title.trim()) return
    setAdding(true)
    try {
      await api.post('/api/calendar/goals', { period: newGoal.period, title: newGoal.title.trim(), target_value: 100 })
      setNewGoal({ ...newGoal, title: '' })
      await load()
    } finally {
      setAdding(false)
    }
  }

  async function bumpProgress(goal, delta) {
    const progress = Math.max(0, Math.min(100, goal.progress + delta))
    const res = await api.put(`/api/calendar/goals/${goal.id}/progress`, { progress })
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? res.data : g)))
  }

  async function removeGoal(goalId) {
    await api.delete(`/api/calendar/goals/${goalId}`)
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
  }

  if (loading) return <DashboardLayout role="student" title="Calendar & Goals"><LoadingState label="Loading your calendar…" /></DashboardLayout>

  return (
    <DashboardLayout role="student" title="Calendar & Goals">
      <div className="glass-card">
        <p className="section-label mb-4 flex items-center gap-2"><CalendarDays size={15} /> Upcoming Exams</p>
        {exams.length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming exams scheduled for your semester yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((ex) => (
              <div key={ex.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-sm font-medium">{ex.title}</p>
                <p className="text-xs text-slate-400 mt-1">{ex.subject_name}</p>
                <p className="text-xs text-indigo-300 mt-2">{new Date(ex.exam_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {PERIODS.map((period) => {
        const periodGoals = goals.filter((g) => g.period === period)
        return (
          <div key={period} className="glass-card">
            <p className="section-label mb-4 flex items-center gap-2 capitalize"><Target size={15} /> {period} Goals</p>
            <div className="space-y-2.5">
              {periodGoals.length === 0 && <p className="text-sm text-slate-400">No {period} goals yet.</p>}
              {periodGoals.map((g) => (
                <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => bumpProgress(g, g.is_completed ? -100 : 100 - g.progress)}
                    className={`h-6 w-6 shrink-0 rounded-lg flex items-center justify-center border ${
                      g.is_completed ? 'bg-mint-500 border-mint-500' : 'border-white/20 hover:border-indigo-400/50'
                    }`}
                  >
                    {g.is_completed && <Check size={13} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${g.is_completed ? 'line-through text-slate-500' : ''}`}>{g.title}</p>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1.5">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                  {!g.is_completed && (
                    <button onClick={() => bumpProgress(g, 25)} className="text-[11px] text-indigo-300 hover:text-white shrink-0 px-2">+25%</button>
                  )}
                  <button onClick={() => removeGoal(g.id)} className="text-slate-500 hover:text-coral-400 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}

      <form onSubmit={addGoal} className="glass-card flex items-center gap-3">
        <select
          value={newGoal.period}
          onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm capitalize focus:outline-none"
        >
          {PERIODS.map((p) => <option key={p} value={p} className="bg-surface">{p}</option>)}
        </select>
        <input
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          placeholder="e.g. Finish 2 chapters of Data Structures"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-400/40"
        />
        <button
          type="submit"
          disabled={adding || !newGoal.title.trim()}
          className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center disabled:opacity-40"
        >
          <Plus size={17} className="text-white" />
        </button>
      </form>
    </DashboardLayout>
  )
}
