import React, { useEffect, useState } from 'react'
import { Users, GraduationCap, ShieldCheck, Building2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import StatCard from '../../components/StatCard'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/reports/summary').then((res) => setSummary(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout role="admin" title="System Overview"><LoadingState /></DashboardLayout>

  return (
    <DashboardLayout role="admin" title="System Overview">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={GraduationCap} label="Total Students" value={summary.total_students} accent="indigo" />
        <StatCard icon={Users} label="Total Teachers" value={summary.total_teachers} accent="violet" delay={0.05} />
        <StatCard icon={ShieldCheck} label="Total Parents" value={summary.total_parents} accent="mint" delay={0.1} />
        <StatCard icon={Building2} label="Departments" value={summary.total_departments} accent="amber" delay={0.15} />
      </div>

      <div className="glass-card">
        <p className="section-label mb-3">System snapshot</p>
        <p className="text-sm text-slate-400 leading-relaxed">
          {summary.total_subjects} subjects are configured across {summary.total_departments} departments,
          serving {summary.total_students} students. Use the sidebar to manage users, departments, the AI model,
          and generate reports.
        </p>
      </div>
    </DashboardLayout>
  )
}
