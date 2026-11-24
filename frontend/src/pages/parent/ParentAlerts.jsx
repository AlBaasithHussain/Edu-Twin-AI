import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function ParentAlerts() {
  const [children, setChildren] = useState([])
  const [selected, setSelected] = useState(null)
  const [alerts, setAlerts] = useState(null)
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
    api.get(`/api/parent/child/${selected}/alerts`).then((res) => setAlerts(res.data)).finally(() => setLoading(false))
  }, [selected])

  if (loading) return <DashboardLayout role="parent" title="Alerts"><LoadingState /></DashboardLayout>

  return (
    <DashboardLayout role="parent" title="Alerts">
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
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-amber-400" />
          <p className="section-label">Recommendations & Alerts</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {alerts?.recommendations.map((r, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <span className="pill bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2 capitalize">{r.category.replace('_', ' ')}</span>
              <p className="text-sm text-slate-300 leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>
        {alerts?.recommendations.length === 0 && <p className="text-center text-slate-400 py-8">No alerts right now — everything looks on track.</p>}
      </div>
    </DashboardLayout>
  )
}
