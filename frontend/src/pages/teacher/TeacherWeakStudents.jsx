import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function TeacherWeakStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/teacher/weak-students').then((res) => setStudents(res.data)).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="teacher" title="Weak Student Detection">
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle size={18} className="text-coral-400" />
          <p className="section-label">High-Risk Students (AI Flagged)</p>
        </div>

        {loading ? <LoadingState /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <div key={s.student_id} className="rounded-2xl bg-coral-500/[0.06] border border-coral-500/20 p-4">
                <p className="font-display font-semibold">{s.name}</p>
                <p className="text-xs text-slate-400 mb-3">{s.roll_number}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Predicted Marks</span>
                  <span className="font-semibold text-coral-400">{s.predicted_final_marks}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-400">Weak Subject</span>
                  <span className="text-slate-200">{s.weak_subject || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && students.length === 0 && (
          <p className="text-center text-slate-400 py-8">No high-risk students detected right now.</p>
        )}
      </div>
    </DashboardLayout>
  )
}
