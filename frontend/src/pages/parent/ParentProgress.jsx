import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'
import { baseOptions } from '../../utils/chartSetup'

export default function ParentProgress() {
  const [children, setChildren] = useState([])
  const [selected, setSelected] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/parent/children').then((res) => {
      setChildren(res.data)
      if (res.data.length) setSelected(res.data[0].id)
      else setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    api.get(`/api/students/${selected}/dashboard`).then((res) => setDashboard(res.data)).finally(() => setLoading(false))
  }, [selected])

  if (loading) return <DashboardLayout role="parent" title="Progress & Marks"><LoadingState /></DashboardLayout>
  if (!dashboard) return <DashboardLayout role="parent" title="Progress & Marks"><div className="glass-card text-slate-400">No data available.</div></DashboardLayout>

  const marksChart = {
    labels: dashboard.marks.map((m) => m.subject),
    datasets: [{ label: 'Internal Marks', data: dashboard.marks.map((m) => m.internal_marks), backgroundColor: 'rgba(124,139,255,0.55)', borderRadius: 8 }],
  }
  const attendanceChart = {
    labels: dashboard.attendance.map((a) => a.month),
    datasets: [{ label: 'Attendance %', data: dashboard.attendance.map((a) => a.percentage), backgroundColor: 'rgba(154,92,247,0.55)', borderRadius: 8 }],
  }

  return (
    <DashboardLayout role="parent" title="Progress & Marks">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card">
          <p className="section-label mb-4">Marks by Subject</p>
          <div className="h-64"><Bar data={marksChart} options={baseOptions} /></div>
        </div>
        <div className="glass-card">
          <p className="section-label mb-4">Attendance by Month</p>
          <div className="h-64"><Bar data={attendanceChart} options={baseOptions} /></div>
        </div>
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">Assignment History</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.assignments.map((a, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2.5 pr-4">{a.title}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{a.subject}</td>
                  <td className="py-2.5 pr-4">{a.score}</td>
                  <td className="py-2.5">
                    <span className={a.submitted_on_time ? 'text-mint-400' : 'text-coral-400'}>
                      {a.submitted_on_time ? 'On time' : 'Late'}
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
