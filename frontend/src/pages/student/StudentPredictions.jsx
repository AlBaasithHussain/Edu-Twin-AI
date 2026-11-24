import React from 'react'
import { RefreshCcw, Brain } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import GaugeMeter from '../../components/GaugeMeter'
import { useStudentDashboard } from '../../hooks/useStudentDashboard'

const riskColor = {
  Low: 'bg-mint-500/10 text-mint-400 border-mint-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  High: 'bg-coral-500/10 text-coral-400 border-coral-500/20',
}

export default function StudentPredictions() {
  const { data, loading, error, runPrediction } = useStudentDashboard()

  if (loading) return <DashboardLayout role="student" title="AI Predictions"><LoadingState /></DashboardLayout>
  if (error || !data) return <DashboardLayout role="student" title="AI Predictions"><div className="glass-card text-coral-400">{error}</div></DashboardLayout>

  const p = data.latest_prediction

  return (
    <DashboardLayout role="student" title="AI Predictions">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card flex flex-col items-center justify-center">
          <p className="section-label mb-2">Predicted Final Marks</p>
          <GaugeMeter value={p?.predicted_final_marks || 0} />
          {p && <span className={`pill mt-3 border ${riskColor[p.risk_level]}`}>{p.risk_level} risk</span>}
          {p?.weak_subject && <p className="text-sm text-slate-400 mt-3">Weakest subject: <span className="text-slate-200">{p.weak_subject}</span></p>}
          <button onClick={runPrediction} className="btn-primary !py-2.5 !px-5 text-sm mt-5">
            <RefreshCcw size={15} /> Run new prediction
          </button>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-indigo-300" />
            <p className="section-label">How this was calculated</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            A Random Forest regression model trained on attendance, internal marks, assignment
            scores, quiz performance and study hours estimates your likely final marks. Risk level
            combines the predicted score with your attendance percentage.
          </p>
          <div className="mt-5 space-y-3">
            {['Attendance %', 'Internal Marks', 'Assignment Score', 'Quiz Score', 'Study Hours / Day'].map((label) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200 font-medium">factored in</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">Recommendations from this prediction</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.recommendations.map((r, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <span className="pill bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 mb-2 capitalize">{r.category.replace('_', ' ')}</span>
              <p className="text-sm text-slate-300 leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
