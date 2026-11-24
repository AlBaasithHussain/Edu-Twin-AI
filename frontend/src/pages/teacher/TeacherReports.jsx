import React, { useState } from 'react'
import { FileDown, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../utils/api'

export default function TeacherReports() {
  const [downloaded, setDownloaded] = useState(false)

  const handleExport = async () => {
    const res = await api.get('/api/teacher/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'student_report.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    setDownloaded(true)
  }

  return (
    <DashboardLayout role="teacher" title="Export Reports">
      <div className="glass-card max-w-lg">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center mb-4">
          <FileDown size={20} className="text-indigo-300" />
        </div>
        <h2 className="font-display text-xl font-semibold">Class performance report</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Download a CSV with every student's roll number, attendance average, marks average,
          AI risk level and predicted final marks — ready for spreadsheets or a staff meeting.
        </p>
        <button onClick={handleExport} className="btn-primary mt-6">
          <FileDown size={16} /> Download CSV
        </button>
        {downloaded && (
          <p className="flex items-center gap-2 text-sm text-mint-400 mt-4">
            <CheckCircle2 size={15} /> Report downloaded
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
