import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import StatCard from '../../components/StatCard'
import api from '../../utils/api'
import { baseOptions } from '../../utils/chartSetup'
import { CalendarCheck, BookOpenText, Users, TrendingUp } from 'lucide-react'

export default function TeacherAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/teacher/analytics').then((res) => setAnalytics(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout role="teacher" title="Performance Analytics"><LoadingState /></DashboardLayout>
  if (!analytics) return <DashboardLayout role="teacher" title="Performance Analytics"><div className="glass-card text-coral-400">Failed to load analytics</div></DashboardLayout>

  const riskLevels = ['Low', 'Medium', 'High']
  const counts = riskLevels.map((lvl) =>
    lvl === 'Low'
      ? Math.max(analytics.total_students - analytics.at_risk_count, 0)
      : analytics.students_at_risk.filter((s) => s.risk_level === lvl).length
  )

  const chart = {
    labels: riskLevels,
    datasets: [{
      label: 'Students',
      data: counts,
      backgroundColor: ['#4ADE9C', '#FBBF5C', '#F14C4C'],
      borderRadius: 8,
    }],
  }

  return (
    <DashboardLayout role="teacher" title="Performance Analytics">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Total Students" value={analytics.total_students} accent="indigo" />
        <StatCard icon={CalendarCheck} label="Avg Attendance" value={`${analytics.average_attendance}%`} accent="violet" delay={0.05} />
        <StatCard icon={BookOpenText} label="Avg Marks" value={analytics.average_marks} accent="mint" delay={0.1} />
        <StatCard icon={TrendingUp} label="On Track" value={Math.max(analytics.total_students - analytics.at_risk_count, 0)} accent="mint" delay={0.15} />
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">Class Risk Breakdown</p>
        <div className="h-72"><Bar data={chart} options={baseOptions} /></div>
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">All Flagged Students</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="py-2 pr-4">Roll No.</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Weak Subject</th>
                <th className="py-2 pr-4">Predicted Marks</th>
                <th className="py-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {analytics.students_at_risk.map((s) => (
                <tr key={s.student_id} className="border-b border-white/5">
                  <td className="py-2.5 pr-4 font-medium">{s.roll_number}</td>
                  <td className="py-2.5 pr-4">{s.name}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{s.weak_subject || '—'}</td>
                  <td className="py-2.5 pr-4">{s.predicted_final_marks}</td>
                  <td className="py-2.5">
                    <span className={`pill border ${s.risk_level === 'High' ? 'bg-coral-500/10 text-coral-400 border-coral-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {s.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
