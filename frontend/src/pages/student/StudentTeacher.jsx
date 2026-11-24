import React, { useEffect, useState } from 'react'
import { Users, CheckCircle2, GraduationCap } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function StudentTeacher() {
  const [teachers, setTeachers] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interest, setInterest] = useState('')
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    const [t, me] = await Promise.all([
      api.get('/api/students/teachers/available'),
      api.get('/api/students/me'),
    ])
    setTeachers(t.data)
    setProfile(me.data)
    setInterest(me.data.subject_interest || '')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const chooseTeacher = async (teacherId) => {
    await api.post(`/api/students/me/choose-teacher/${teacherId}`)
    load()
  }

  const saveInterest = async (e) => {
    e.preventDefault()
    await api.put('/api/students/me', { subject_interest: interest })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <DashboardLayout role="student" title="My Teacher"><LoadingState /></DashboardLayout>

  return (
    <DashboardLayout role="student" title="My Teacher">
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-5">
          <Users size={18} className="text-indigo-300" />
          <p className="section-label">Choose your teacher</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => {
            const isMine = profile?.teacher_id === t.id
            return (
              <div key={t.id} className={`rounded-2xl border p-4 ${isMine ? 'bg-indigo-500/10 border-indigo-400/30' : 'bg-white/5 border-white/10'}`}>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center mb-3">
                  <GraduationCap size={18} className="text-indigo-300" />
                </div>
                <p className="font-display font-semibold">{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.department || 'General'}</p>
                <p className="text-xs text-slate-500 mt-1">{t.student_count} student{t.student_count !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => chooseTeacher(t.id)}
                  disabled={isMine}
                  className={`w-full mt-3 text-xs font-semibold rounded-xl py-2 transition-all ${
                    isMine ? 'bg-mint-500/15 text-mint-400 cursor-default' : 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25'
                  }`}
                >
                  {isMine ? <span className="flex items-center justify-center gap-1.5"><CheckCircle2 size={13} /> Your teacher</span> : 'Choose this teacher'}
                </button>
              </div>
            )
          })}
        </div>
        {teachers.length === 0 && <p className="text-center text-slate-400 py-6">No teachers available yet.</p>}
      </div>

      <div className="glass-card max-w-lg">
        <p className="section-label mb-3">Subject interest</p>
        <p className="text-sm text-slate-400 mb-4">
          Tell us what you're most interested in — this feeds into your recommendations. Only you can edit this;
          your teacher can see it but not change it.
        </p>
        <form onSubmit={saveInterest} className="flex gap-2">
          <input
            value={interest} onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. Machine Learning, Web Development"
            className="input-field"
          />
          <button type="submit" className="btn-primary !px-5">Save</button>
        </form>
        {saved && <p className="text-sm text-mint-400 mt-2">Saved!</p>}
      </div>
    </DashboardLayout>
  )
}
