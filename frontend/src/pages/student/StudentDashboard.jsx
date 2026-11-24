import React from 'react'
import { Bar, Radar } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { CalendarCheck, BookOpenText, ClipboardList, Timer, RefreshCcw, Sparkles, Bot, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import StatCard from '../../components/StatCard'
import GaugeMeter from '../../components/GaugeMeter'
import LoadingState from '../../components/LoadingState'
import { useStudentDashboard } from '../../hooks/useStudentDashboard'
import { baseOptions } from '../../utils/chartSetup'

export default function StudentDashboard() {
  const { data, loading, error, runPrediction } = useStudentDashboard()

  if (loading) return <DashboardLayout role="student" title="Overview"><LoadingState /></DashboardLayout>
  if (error || !data) {
    return (
      <DashboardLayout role="student" title="Overview">
        <div className="glass-card text-coral-400">{error || 'No data available'}</div>
      </DashboardLayout>
    )
  }

  const avgAttendance = data.attendance.length
    ? (data.attendance.reduce((s, a) => s + a.percentage, 0) / data.attendance.length).toFixed(1)
    : 'N/A'
  const avgMarks = data.marks.length
    ? (data.marks.reduce((s, m) => s + m.internal_marks, 0) / data.marks.length).toFixed(1)
    : 'N/A'
  const avgStudyHours = data.study_hours.length
    ? (data.study_hours.reduce((s, h) => s + h.hours_per_day, 0) / data.study_hours.length).toFixed(1)
    : 'N/A'

  const weakMarks = [...data.marks].sort((a, b) => a.internal_marks - b.internal_marks).slice(0, 5)

  const riskColor = {
    Low: 'bg-mint-500/10 text-mint-400 border-mint-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    High: 'bg-coral-500/10 text-coral-400 border-coral-500/20',
  }

  const attendanceChart = {
    labels: data.attendance.map((a) => a.month),
    datasets: [{
      label: 'Attendance %',
      data: data.attendance.map((a) => a.percentage),
      backgroundColor: 'rgba(124,139,255,0.55)',
      borderRadius: 8,
    }],
  }

  const radarChart = {
    labels: data.marks.map((m) => m.subject || 'Subject'),
    datasets: [{
      label: 'Internal Marks',
      data: data.marks.map((m) => m.internal_marks),
      backgroundColor: 'rgba(154,92,247,0.25)',
      borderColor: 'rgba(154,92,247,0.9)',
      pointBackgroundColor: 'rgba(154,92,247,1)',
    }],
  }

  return (
    <DashboardLayout role="student" title={`Hi, ${data.student.name.split(' ')[0]}`}>
      <Link to="/student/profile" className="glass-card flex items-center justify-between gap-4 !py-4 hover:bg-white/5 transition-all">
        <div>
          <p className="text-sm font-medium">
            {data.student.career_goal || data.student.skills || data.student.learning_style
              ? 'Your profile'
              : 'Your profile is incomplete'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.student.career_goal ? `Career goal: ${data.student.career_goal}` : 'Add your skills, career goal and learning style to get better AI recommendations.'}
          </p>
        </div>
        <span className="btn-primary !py-2 !px-4 text-xs shrink-0">Edit Profile <ArrowRight size={14} /></span>
      </Link>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={CalendarCheck} label="Avg Attendance" value={`${avgAttendance}%`} accent="indigo" delay={0} />
        <StatCard icon={BookOpenText} label="Avg Internal Marks" value={avgMarks} accent="violet" delay={0.05} />
        <StatCard icon={Timer} label="Study Hours / Day" value={avgStudyHours} accent="mint" delay={0.1} />
        <StatCard
          icon={ClipboardList}
          label="Risk Level"
          value={data.latest_prediction?.risk_level || 'N/A'}
          sublabel={data.latest_prediction?.weak_subject ? `Weak: ${data.latest_prediction.weak_subject}` : undefined}
          accent={data.latest_prediction?.risk_level === 'High' ? 'coral' : data.latest_prediction?.risk_level === 'Medium' ? 'amber' : 'mint'}
          delay={0.15}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass-card lg:col-span-1 flex flex-col items-center justify-center">
          <p className="section-label mb-2">AI Prediction</p>
          <GaugeMeter value={data.latest_prediction?.predicted_final_marks || 0} label="Predicted Final Marks" />
          {data.latest_prediction && (
            <span className={`pill mt-3 border ${riskColor[data.latest_prediction.risk_level]}`}>
              {data.latest_prediction.risk_level} risk
            </span>
          )}
          <button onClick={runPrediction} className="btn-primary !py-2.5 !px-5 text-sm mt-5">
            <RefreshCcw size={15} /> Refresh Prediction
          </button>
        </div>

        <div className="glass-card lg:col-span-2">
          <p className="section-label mb-4">Attendance Trend</p>
          <div className="h-64">
            <Bar data={attendanceChart} options={baseOptions} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass-card lg:col-span-2">
          <p className="section-label mb-4">Subject-wise Marks (Radar)</p>
          <div className="h-72">
            <Radar
              data={radarChart}
              options={{
                ...baseOptions,
                scales: {
                  r: {
                    angleLines: { color: 'rgba(255,255,255,0.08)' },
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    pointLabels: { color: '#CBD5E1', font: { size: 11 } },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-indigo-300" />
            <p className="section-label">AI Recommendations</p>
          </div>
          <div className="space-y-3">
            {data.recommendations.slice(0, 4).map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <span className="pill bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 mb-2 capitalize">{r.category.replace('_', ' ')}</span>
                <p className="text-sm text-slate-300 leading-relaxed">{r.message}</p>
              </div>
            ))}
            {data.recommendations.length === 0 && <p className="text-sm text-slate-400">No recommendations yet — run a prediction first.</p>}
          </div>
        </motion.div>
      </div>

      <Link to="/student/ai-agent">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-card flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-indigo-400/20"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow shrink-0">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <p className="font-display font-semibold">Ask your AI Agent</p>
              <p className="text-xs text-slate-400 mt-0.5">Get instant explanations, quizzes & study notes — tailored to your own data</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-indigo-300 shrink-0" />
        </motion.div>
      </Link>

      <div className="glass-card">
        <p className="section-label mb-4">Weakest Subjects</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {weakMarks.map((m, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-sm text-slate-300">{m.subject}</p>
              <p className="font-display text-2xl font-semibold mt-1">{m.internal_marks}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
