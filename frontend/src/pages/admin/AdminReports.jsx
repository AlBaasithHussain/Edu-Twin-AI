import React, { useEffect, useState } from 'react'
import { FileBarChart, FileDown } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import StatCard from '../../components/StatCard'
import api from '../../utils/api'
import { GraduationCap, Users, ShieldCheck, Building2, BookOpen } from 'lucide-react'

export default function AdminReports() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/reports/summary').then((res) => setSummary(res.data)).finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    const res = await api.get('/api/teacher/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'full_student_report.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  if (loading) return <DashboardLayout role="admin" title="Reports"><LoadingState /></DashboardLayout>

  return (
    <DashboardLayout role="admin" title="Reports">
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <StatCard icon={GraduationCap} label="Students" value={summary.total_students} accent="indigo" />
        <StatCard icon={Users} label="Teachers" value={summary.total_teachers} accent="violet" delay={0.05} />
        <StatCard icon={ShieldCheck} label="Parents" value={summary.total_parents} accent="mint" delay={0.1} />
        <StatCard icon={Building2} label="Departments" value={summary.total_departments} accent="amber" delay={0.15} />
        <StatCard icon={BookOpen} label="Subjects" value={summary.total_subjects} accent="coral" delay={0.2} />
      </div>

      <div className="glass-card max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <FileBarChart size={18} className="text-indigo-300" />
          <p className="section-label">System-wide report</p>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-5">
          Export a CSV covering every student's attendance, marks, AI risk level and predicted
          final marks across the institution.
        </p>
        <button onClick={handleExport} className="btn-primary"><FileDown size={16} /> Download CSV</button>
      </div>
    </DashboardLayout>
  )
}
