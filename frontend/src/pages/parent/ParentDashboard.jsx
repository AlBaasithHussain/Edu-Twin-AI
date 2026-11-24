import React, { useEffect, useState } from 'react'
import { CalendarCheck, BookOpenText, Bell, ShieldCheck } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import StatCard from '../../components/StatCard'
import GaugeMeter from '../../components/GaugeMeter'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function ParentDashboard() {
  const [children, setChildren] = useState([])
  const [selected, setSelected] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/parent/children').then((res) => {
      setChildren(res.data)
      if (res.data.length) setSelected(res.data[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([
      api.get(`/api/students/${selected}/dashboard`),
      api.get(`/api/parent/child/${selected}/alerts`),
    ]).then(([d, a]) => {
      setDashboard(d.data)
      setAlerts(a.data)
    }).finally(() => setLoading(false))
  }, [selected])

  if (loading && !dashboard) return <DashboardLayout role="parent" title="Overview"><LoadingState /></DashboardLayout>

  if (!children.length) {
    return (
      <DashboardLayout role="parent" title="Overview">
        <div className="glass-card text-slate-400">No children are linked to this parent account yet.</div>
      </DashboardLayout>
    )
  }

  const avgAttendance = dashboard?.attendance.length
    ? (dashboard.attendance.reduce((s, a) => s + a.percentage, 0) / dashboard.attendance.length).toFixed(1)
    : 'N/A'
  const avgMarks = dashboard?.marks.length
    ? (dashboard.marks.reduce((s, m) => s + m.internal_marks, 0) / dashboard.marks.length).toFixed(1)
    : 'N/A'

  return (
    <DashboardLayout role="parent" title="Overview">
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => (
            <button
              key={c.id} onClick={() => setSelected(c.id)}
              className={`pill border ${selected === c.id ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30' : 'bg-white/5 text-slate-400 border-white/10'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {dashboard && (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard icon={CalendarCheck} label="Attendance" value={`${avgAttendance}%`} accent="indigo" />
            <StatCard icon={BookOpenText} label="Avg Marks" value={avgMarks} accent="violet" delay={0.05} />
            <StatCard
              icon={ShieldCheck}
              label="Risk Level"
              value={alerts?.latest_prediction?.risk_level || 'N/A'}
              accent={alerts?.latest_prediction?.risk_level === 'High' ? 'coral' : alerts?.latest_prediction?.risk_level === 'Medium' ? 'amber' : 'mint'}
              delay={0.1}
            />
            <StatCard icon={Bell} label="Active Alerts" value={alerts?.recommendations?.length || 0} accent="amber" delay={0.15} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="glass-card flex flex-col items-center justify-center">
              <p className="section-label mb-2">Predicted Final Marks</p>
              <GaugeMeter value={alerts?.latest_prediction?.predicted_final_marks || 0} />
            </div>

            <div className="glass-card lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={16} className="text-amber-400" />
                <p className="section-label">Recommendations for {dashboard.student.name.split(' ')[0]}</p>
              </div>
              <div className="space-y-3">
                {alerts?.recommendations.map((r, i) => (
                  <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <span className="pill bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 mb-2 capitalize">{r.category.replace('_', ' ')}</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{r.message}</p>
                  </div>
                ))}
                {alerts?.recommendations.length === 0 && <p className="text-sm text-slate-400">No active alerts.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
