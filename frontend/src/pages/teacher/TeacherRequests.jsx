import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Check, X } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function TeacherRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    const res = await api.get('/api/teacher/requests')
    setRequests(res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function respond(id, action) {
    setBusyId(id)
    try {
      await api.post(`/api/teacher/requests/${id}/${action}`)
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <DashboardLayout role="teacher" title="Student Requests"><LoadingState label="Checking for requests…" /></DashboardLayout>

  return (
    <DashboardLayout role="teacher" title="Student Requests">
      <div className="glass-card">
        <p className="section-label mb-4 flex items-center gap-2"><UserPlus size={15} /> Pending Requests</p>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-400">No pending requests right now — students who choose you as their teacher will show up here.</p>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {requests.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div>
                    <p className="text-sm font-medium">{r.student_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Requested {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => respond(r.id, 'accept')}
                      className="h-9 w-9 rounded-xl bg-mint-500/15 border border-mint-500/30 flex items-center justify-center hover:bg-mint-500/25 disabled:opacity-40"
                    >
                      <Check size={16} className="text-mint-400" />
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => respond(r.id, 'reject')}
                      className="h-9 w-9 rounded-xl bg-coral-500/15 border border-coral-500/30 flex items-center justify-center hover:bg-coral-500/25 disabled:opacity-40"
                    >
                      <X size={16} className="text-coral-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
