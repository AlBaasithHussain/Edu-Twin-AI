import React, { useEffect, useState } from 'react'
import { UserCircle2, Pencil, Save, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

const LEARNING_STYLES = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic']

const emptyForm = {
  subject_interest: '',
  skills: '',
  career_goal: '',
  learning_style: '',
}

export default function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message }

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/students/me')
      setProfile(res.data)
      const isBlank = !res.data.subject_interest && !res.data.skills && !res.data.career_goal && !res.data.learning_style
      setForm({
        subject_interest: res.data.subject_interest || '',
        skills: res.data.skills || '',
        career_goal: res.data.career_goal || '',
        learning_style: res.data.learning_style || '',
      })
      // A brand-new student with nothing filled in yet goes straight into edit mode.
      setEditing(isBlank)
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.detail || 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCancel = () => {
    setForm({
      subject_interest: profile.subject_interest || '',
      skills: profile.skills || '',
      career_goal: profile.career_goal || '',
      learning_style: profile.learning_style || '',
    })
    setEditing(false)
    setStatus(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const res = await api.put('/api/students/me', form)
      setProfile(res.data)
      setEditing(false)
      setStatus({ type: 'success', message: 'Profile saved.' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.detail || 'Could not save your profile. Please try again.' })
    } finally {
      setSaving(false)
      setTimeout(() => setStatus(null), 3000)
    }
  }

  if (loading) return <DashboardLayout role="student" title="My Profile"><LoadingState /></DashboardLayout>
  if (!profile) {
    return (
      <DashboardLayout role="student" title="My Profile">
        <div className="glass-card text-coral-400">{status?.message || 'No profile found'}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student" title="My Profile">
      <div className="glass-card max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center">
              <UserCircle2 size={24} className="text-indigo-300" />
            </div>
            <div>
              <p className="font-display font-semibold text-lg">{profile.name}</p>
              <p className="text-xs text-slate-400">{profile.roll_number} · {profile.department || 'No department set'} · Semester {profile.semester}</p>
            </div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-primary !py-2 !px-4 text-xs shrink-0">
              <Pencil size={14} /> Edit Profile
            </button>
          )}
        </div>

        {/* Read-only academic identity — comes from admin/teacher records, not self-editable */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Register Number</p>
            <p className="text-sm font-medium">{profile.roll_number}</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Email</p>
            <p className="text-sm font-medium truncate">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5 block">Career Goal</label>
            {editing ? (
              <input
                className="input-field"
                placeholder="e.g. Backend Developer, Data Scientist"
                value={form.career_goal}
                onChange={handleChange('career_goal')}
              />
            ) : (
              <p className="text-sm text-slate-300">{profile.career_goal || <span className="text-slate-500">Not set</span>}</p>
            )}
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5 block">Interested Subjects</label>
            {editing ? (
              <input
                className="input-field"
                placeholder="e.g. Machine Learning, Web Development"
                value={form.subject_interest}
                onChange={handleChange('subject_interest')}
              />
            ) : (
              <p className="text-sm text-slate-300">{profile.subject_interest || <span className="text-slate-500">Not set</span>}</p>
            )}
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5 block">Skills</label>
            {editing ? (
              <input
                className="input-field"
                placeholder="e.g. Python, Figma, Public Speaking"
                value={form.skills}
                onChange={handleChange('skills')}
              />
            ) : (
              <p className="text-sm text-slate-300">{profile.skills || <span className="text-slate-500">Not set</span>}</p>
            )}
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5 block">Learning Style</label>
            {editing ? (
              <select className="input-field" value={form.learning_style} onChange={handleChange('learning_style')}>
                <option value="">Select a style</option>
                {LEARNING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <p className="text-sm text-slate-300">{profile.learning_style || <span className="text-slate-500">Not set</span>}</p>
            )}
          </div>

          {editing && (
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary !py-2.5 !px-5 text-sm">
                <Save size={15} /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={handleCancel} disabled={saving} className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 px-3">
                <X size={15} /> Cancel
              </button>
            </div>
          )}
        </form>

        {status && (
          <p className={`text-sm mt-4 flex items-center gap-1.5 ${status.type === 'success' ? 'text-mint-400' : 'text-coral-400'}`}>
            {status.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {status.message}
          </p>
        )}

        <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-white/10">
          This app runs in self-tracked mode: you log your own attendance and marks on the
          Attendance and Marks &amp; Quizzes pages, and weak/strong subjects are computed
          automatically from what you enter there. The fields above are your own
          preferences — nothing here is entered by a teacher or admin.
        </p>
      </div>
    </DashboardLayout>
  )
}
