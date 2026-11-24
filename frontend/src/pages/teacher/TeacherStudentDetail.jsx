import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, HeartPulse, Brain, TrendingUp, TrendingDown, CalendarDays, Eye } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import GaugeMeter from '../../components/GaugeMeter'
import api from '../../utils/api'

export default function TeacherStudentDetail() {
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [twin, setTwin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [dash, tw] = await Promise.all([
          api.get(`/api/students/${studentId}/dashboard`),
          api.get(`/api/students/${studentId}/digital-twin`),
        ])
        setStudent(dash.data.student)
        setTwin(tw.data)
      } catch (err) {
        setError(err?.response?.data?.detail || 'Could not load this student.')
      } finally {
        setLoading(false)
      }
    })()
  }, [studentId])

  if (loading) return <DashboardLayout role="teacher" title="Student Profile"><LoadingState /></DashboardLayout>
  if (error || !twin) return (
    <DashboardLayout role="teacher" title="Student Profile">
      <div className="glass-card text-coral-400">{error}</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="teacher" title={student?.name || 'Student Profile'}>
      <Link to="/teacher/students" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={14} /> Back to all students
      </Link>

      <div className="glass-card flex items-center gap-2 !py-3 text-sm text-slate-400">
        <Eye size={14} /> View-only — attendance, marks, and predictions here are read-only to teachers.
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="glass-card flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-mint-500/20 to-mint-500/0 flex items-center justify-center shrink-0">
            <HeartPulse size={24} className="text-mint-400" />
          </div>
          <div>
            <p className="section-label">Academic Health Score</p>
            <p className="font-display text-3xl font-semibold mt-1">{twin.health_score}<span className="text-base text-slate-400">/100</span></p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/0 flex items-center justify-center shrink-0">
            <Brain size={24} className="text-violet-300" />
          </div>
          <div>
            <p className="section-label">Learning Score</p>
            <p className="font-display text-3xl font-semibold mt-1">{twin.learning_score}<span className="text-base text-slate-400">/100</span></p>
          </div>
        </div>
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
          <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-mint-400" /><p className="section-label">Strong Subjects</p></div>
          <div className="space-y-2">
            {twin.strong_subjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-mint-500/[0.06] border border-mint-500/15 px-4 py-2.5">
                <span className="text-sm">{s.subject}</span>
                <span className="font-display font-semibold text-mint-400">{s.marks}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4"><TrendingDown size={16} className="text-coral-400" /><p className="section-label">Weak Subjects</p></div>
          <div className="space-y-2">
            {twin.weak_subjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-coral-500/[0.06] border border-coral-500/15 px-4 py-2.5">
                <span className="text-sm">{s.subject}</span>
                <span className="font-display font-semibold text-coral-400">{s.marks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center gap-2 mb-5"><CalendarDays size={16} className="text-indigo-300" /><p className="section-label">AI Study Plan</p></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {twin.study_plan.map((p, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-3.5">
              <p className="text-xs font-semibold text-slate-400">{p.day}</p>
              <p className="font-display font-semibold text-sm mt-2">{p.subject}</p>
              <p className="text-xs text-slate-400 mt-2">{p.hours}h · {p.type}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
