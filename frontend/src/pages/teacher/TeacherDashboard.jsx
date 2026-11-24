import React, { useEffect, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Users, CalendarCheck, BookOpenText, AlertTriangle } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import StatCard from '../../components/StatCard'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'
import { baseOptions } from '../../utils/chartSetup'

export default function TeacherDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/teacher/analytics').then((res) => setAnalytics(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout role="teacher" title="Class Overview"><LoadingState /></DashboardLayout>
  if (!analytics) return <DashboardLayout role="teacher" title="Class Overview"><div className="glass-card text-coral-400">Failed to load analytics</div></DashboardLayout>

  const riskCounts = analytics.students_at_risk.reduce(
    (acc, s) => { acc[s.risk_level] = (acc[s.risk_level] || 0) + 1; return acc },
    { Medium: 0, High: 0 }
  )
  const safeCount = Math.max(analytics.total_students - analytics.at_risk_count, 0)

  const doughnut = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{ data: [safeCount, riskCounts.Medium, riskCounts.High], backgroundColor: ['#4ADE9C', '#FBBF5C', '#F14C4C'], borderWidth: 0 }],
  }

  const topRisk = [...analytics.students_at_risk].sort((a, b) => a.predicted_final_marks - b.predicted_final_marks).slice(0, 8)
  const barChart = {
    labels: topRisk.map((s) => s.name.split(' ')[0]),
    datasets: [{ label: 'Predicted Final Marks', data: topRisk.map((s) => s.predicted_final_marks), backgroundColor: 'rgba(241,76,76,0.55)', borderRadius: 8 }],
  }

  return (
    <DashboardLayout role="teacher" title="Class Overview">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Total Students" value={analytics.total_students} accent="indigo" />
        <StatCard icon={CalendarCheck} label="Avg Attendance" value={`${analytics.average_attendance}%`} accent="violet" delay={0.05} />
        <StatCard icon={BookOpenText} label="Avg Marks" value={analytics.average_marks} accent="mint" delay={0.1} />
        <StatCard icon={AlertTriangle} label="At-Risk Students" value={analytics.at_risk_count} accent="coral" delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass-card lg:col-span-2">
          <p className="section-label mb-4">Lowest Predicted Scores</p>
          <div className="h-72"><Bar data={barChart} options={baseOptions} /></div>
        </div>
        <div className="glass-card">
          <p className="section-label mb-4">Risk Distribution</p>
          <div className="h-72"><Doughnut data={doughnut} options={{ ...baseOptions, scales: undefined }} /></div>
        </div>
      </div>
    </DashboardLayout>
  )
}
