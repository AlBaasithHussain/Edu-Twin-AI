import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HeartPulse, Brain, TrendingUp, TrendingDown, CalendarDays, Sparkles } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import GaugeMeter from '../../components/GaugeMeter'
import api from '../../utils/api'

const dayColor = {
  'Monday': 'border-indigo-400/20', 'Tuesday': 'border-indigo-400/20', 'Wednesday': 'border-indigo-400/20',
  'Thursday': 'border-indigo-400/20', 'Friday': 'border-indigo-400/20',
  'Saturday': 'border-violet-400/30', 'Sunday': 'border-violet-400/30',
}

export default function StudentDigitalTwin() {
  const [twin, setTwin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const me = await api.get('/api/students/me')
      const res = await api.get(`/api/students/${me.data.id}/digital-twin`)
      setTwin(res.data)
      setLoading(false)
    })()
  }, [])

  if (loading) return <DashboardLayout role="student" title="AI Digital Twin"><LoadingState label="Building your digital twin…" /></DashboardLayout>
  if (!twin) return <DashboardLayout role="student" title="AI Digital Twin"><div className="glass-card text-coral-400">Couldn't load your digital twin.</div></DashboardLayout>

  return (
    <DashboardLayout role="student" title="AI Digital Twin">
      <div className="grid sm:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-mint-500/20 to-mint-500/0 flex items-center justify-center shrink-0">
            <HeartPulse size={24} className="text-mint-400" />
          </div>
          <div>
            <p className="section-label">Academic Health Score</p>
            <p className="font-display text-3xl font-semibold mt-1">{twin.health_score}<span className="text-base text-slate-400">/100</span></p>
            <p className="text-xs text-slate-400 mt-1">Attendance, marks, assignments & study time combined</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/0 flex items-center justify-center shrink-0">
            <Brain size={24} className="text-violet-300" />
          </div>
          <div>
            <p className="section-label">Learning Score</p>
            <p className="font-display text-3xl font-semibold mt-1">{twin.learning_score}<span className="text-base text-slate-400">/100</span></p>
            <p className="text-xs text-slate-400 mt-1">How well concepts are landing — quizzes & assignment quality</p>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass-card flex flex-col items-center justify-center">
          <p className="section-label mb-2">Predicted Final Marks</p>
          <GaugeMeter value={twin.predicted_final_marks || 0} />
          {twin.risk_level && (
            <span className={`pill mt-3 border ${
              twin.risk_level === 'Low' ? 'bg-mint-500/10 text-mint-400 border-mint-500/20'
              : twin.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-coral-500/10 text-coral-400 border-coral-500/20'
            }`}>{twin.risk_level} risk</span>
          )}
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-mint-400" />
            <p className="section-label">Strong Subjects</p>
          </div>
          <div className="space-y-2">
            {twin.strong_subjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-mint-500/[0.06] border border-mint-500/15 px-4 py-2.5">
                <span className="text-sm">{s.subject}</span>
                <span className="font-display font-semibold text-mint-400">{s.marks}</span>
              </div>
            ))}
            {twin.strong_subjects.length === 0 && <p className="text-sm text-slate-400">No marks recorded yet.</p>}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-coral-400" />
            <p className="section-label">Weak Subjects</p>
          </div>
          <div className="space-y-2">
            {twin.weak_subjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-coral-500/[0.06] border border-coral-500/15 px-4 py-2.5">
                <span className="text-sm">{s.subject}</span>
                <span className="font-display font-semibold text-coral-400">{s.marks}</span>
              </div>
            ))}
            {twin.weak_subjects.length === 0 && <p className="text-sm text-slate-400">No marks recorded yet.</p>}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays size={16} className="text-indigo-300" />
          <p className="section-label">AI Study Planner — This Week</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {twin.study_plan.map((p, i) => (
            <div key={i} className={`rounded-2xl bg-white/5 border ${dayColor[p.day] || 'border-white/10'} p-3.5`}>
              <p className="text-xs font-semibold text-slate-400">{p.day}</p>
              <p className="font-display font-semibold text-sm mt-2">{p.subject}</p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className={`pill !py-0.5 !px-2 ${p.type === 'Revision' ? 'bg-violet-500/10 text-violet-300' : 'bg-indigo-500/10 text-indigo-300'}`}>{p.type}</span>
                <span className="text-slate-400">{p.hours}h</span>
              </div>
            </div>
          ))}
        </div>
        {twin.study_plan.length === 0 && (
          <p className="text-sm text-slate-400 flex items-center gap-2"><Sparkles size={14} /> Once you have marks recorded, your personalized study plan will appear here.</p>
        )}
      </div>
    </DashboardLayout>
  )
}
