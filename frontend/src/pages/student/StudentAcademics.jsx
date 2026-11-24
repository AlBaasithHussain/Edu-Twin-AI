import React, { useEffect, useState } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import { useStudentDashboard } from '../../hooks/useStudentDashboard'
import { baseOptions } from '../../utils/chartSetup'
import api from '../../utils/api'

export default function StudentAcademics() {
  const { data, loading, error, refetch } = useStudentDashboard()
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ subject_id: '', internal_marks: '', final_marks: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ subject_id: '', internal_marks: '', final_marks: '' })
  const [status, setStatus] = useState(null)

  useEffect(() => {
    api.get('/api/students/subjects').then((res) => setSubjects(res.data)).catch(() => {})
  }, [])

  if (loading) return <DashboardLayout role="student" title="Marks & Quizzes"><LoadingState /></DashboardLayout>
  if (error || !data) return <DashboardLayout role="student" title="Marks & Quizzes"><div className="glass-card text-coral-400">{error}</div></DashboardLayout>

  const flash = (type, message) => {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 2500)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.subject_id || form.internal_marks === '') return
    try {
      await api.post('/api/students/me/marks', {
        subject_id: Number(form.subject_id),
        internal_marks: Number(form.internal_marks),
        final_marks: form.final_marks === '' ? null : Number(form.final_marks),
      })
      setForm({ subject_id: '', internal_marks: '', final_marks: '' })
      flash('success', 'Marks added.')
      refetch()
    } catch (err) {
      flash('error', err?.response?.data?.detail || 'Could not add marks.')
    }
  }

  const startEdit = (m) => {
    setEditingId(m.id)
    setEditForm({ subject_id: m.subject_id || '', internal_marks: m.internal_marks, final_marks: m.final_marks ?? '' })
  }

  const handleUpdate = async (id) => {
    try {
      await api.put(`/api/students/me/marks/${id}`, {
        subject_id: Number(editForm.subject_id),
        internal_marks: Number(editForm.internal_marks),
        final_marks: editForm.final_marks === '' ? null : Number(editForm.final_marks),
      })
      setEditingId(null)
      flash('success', 'Marks updated.')
      refetch()
    } catch (err) {
      flash('error', err?.response?.data?.detail || 'Could not update marks.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/students/me/marks/${id}`)
      flash('success', 'Marks removed.')
      refetch()
    } catch (err) {
      flash('error', err?.response?.data?.detail || 'Could not delete marks.')
    }
  }

  const marksChart = {
    labels: data.marks.map((m) => m.subject),
    datasets: [{ label: 'Internal Marks', data: data.marks.map((m) => m.internal_marks), backgroundColor: 'rgba(154,92,247,0.6)', borderRadius: 8 }],
  }

  const onTime = data.assignments.filter((a) => a.submitted_on_time === 1).length
  const late = data.assignments.length - onTime
  const pieChart = {
    labels: ['On time', 'Late'],
    datasets: [{ data: [onTime, late], backgroundColor: ['#4ADE9C', '#F14C4C'], borderWidth: 0 }],
  }

  return (
    <DashboardLayout role="student" title="Marks & Quizzes">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass-card lg:col-span-2">
          <p className="section-label mb-4">Internal Marks by Subject</p>
          <div className="h-64"><Bar data={marksChart} options={baseOptions} /></div>
        </div>
        <div className="glass-card">
          <p className="section-label mb-4">Assignment Submissions</p>
          <div className="h-64"><Pie data={pieChart} options={{ ...baseOptions, scales: undefined }} /></div>
        </div>
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">Log Marks</p>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-3">
          <select className="input-field" value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}>
            <option value="">Subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="input-field" type="number" min="0" max="100" step="0.1" placeholder="Internal Marks" value={form.internal_marks} onChange={(e) => setForm((f) => ({ ...f, internal_marks: e.target.value }))} />
          <input className="input-field" type="number" min="0" max="100" step="0.1" placeholder="Final Marks (optional)" value={form.final_marks} onChange={(e) => setForm((f) => ({ ...f, final_marks: e.target.value }))} />
          <button type="submit" className="btn-primary !py-2.5 text-sm justify-center"><Plus size={15} /> Add</button>
        </form>
        {status && <p className={`text-sm mt-3 ${status.type === 'success' ? 'text-mint-400' : 'text-coral-400'}`}>{status.message}</p>}
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">Marks by Subject</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Internal</th>
                <th className="py-2 pr-4">Final</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.marks.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  {editingId === m.id ? (
                    <>
                      <td className="py-2.5 pr-4">
                        <select className="input-field !py-1.5" value={editForm.subject_id} onChange={(e) => setEditForm((f) => ({ ...f, subject_id: e.target.value }))}>
                          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 pr-4">
                        <input className="input-field !py-1.5" type="number" min="0" max="100" step="0.1" value={editForm.internal_marks} onChange={(e) => setEditForm((f) => ({ ...f, internal_marks: e.target.value }))} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <input className="input-field !py-1.5" type="number" min="0" max="100" step="0.1" value={editForm.final_marks} onChange={(e) => setEditForm((f) => ({ ...f, final_marks: e.target.value }))} />
                      </td>
                      <td className="py-2.5 text-right space-x-2">
                        <button onClick={() => handleUpdate(m.id)} className="text-mint-400 hover:text-mint-300"><Save size={15} /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white"><X size={15} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 pr-4 text-slate-300">{m.subject}</td>
                      <td className="py-2.5 pr-4 font-medium">{m.internal_marks}</td>
                      <td className="py-2.5 pr-4">{m.final_marks ?? <span className="text-slate-500">—</span>}</td>
                      <td className="py-2.5 text-right space-x-3">
                        <button onClick={() => startEdit(m)} className="text-slate-400 hover:text-white"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-coral-400"><Trash2 size={14} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {data.marks.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-400">No marks logged yet — add your first record above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card">
          <p className="section-label mb-4">Quiz Scores</p>
          <div className="space-y-3">
            {data.quizzes.map((q, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-3">
                <span className="text-sm text-slate-300">{q.subject}</span>
                <span className="font-display font-semibold">{q.score}/{q.max_score}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card">
          <p className="section-label mb-4">Assignments</p>
          <div className="space-y-3">
            {data.assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-3">
                <div>
                  <p className="text-sm text-slate-300">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.subject}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold">{a.score}</p>
                  <span className={`text-[11px] ${a.submitted_on_time ? 'text-mint-400' : 'text-coral-400'}`}>
                    {a.submitted_on_time ? 'On time' : 'Late'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

