import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import { useStudentDashboard } from '../../hooks/useStudentDashboard'
import { baseOptions } from '../../utils/chartSetup'
import api from '../../utils/api'

export default function StudentAttendance() {
  const { data, loading, error, refetch } = useStudentDashboard()
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ subject_id: '', month: '', percentage: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ subject_id: '', month: '', percentage: '' })
  const [status, setStatus] = useState(null)

  useEffect(() => {
    api.get('/api/students/subjects').then((res) => setSubjects(res.data)).catch(() => {})
  }, [])

  if (loading) return <DashboardLayout role="student" title="Attendance"><LoadingState /></DashboardLayout>
  if (error || !data) return <DashboardLayout role="student" title="Attendance"><div className="glass-card text-coral-400">{error}</div></DashboardLayout>

  const flash = (type, message) => {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 2500)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.subject_id || !form.month || form.percentage === '') return
    try {
      await api.post('/api/students/me/attendance', {
        subject_id: Number(form.subject_id), month: form.month, percentage: Number(form.percentage),
      })
      setForm({ subject_id: '', month: '', percentage: '' })
      flash('success', 'Attendance added.')
      refetch()
    } catch (err) {
      flash('error', err?.response?.data?.detail || 'Could not add attendance.')
    }
  }

  const startEdit = (a) => {
    setEditingId(a.id)
    setEditForm({ subject_id: a.subject_id || '', month: a.month, percentage: a.percentage })
  }

  const handleUpdate = async (id) => {
    try {
      await api.put(`/api/students/me/attendance/${id}`, {
        subject_id: Number(editForm.subject_id), month: editForm.month, percentage: Number(editForm.percentage),
      })
      setEditingId(null)
      flash('success', 'Attendance updated.')
      refetch()
    } catch (err) {
      flash('error', err?.response?.data?.detail || 'Could not update attendance.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/students/me/attendance/${id}`)
      flash('success', 'Attendance removed.')
      refetch()
    } catch (err) {
      flash('error', err?.response?.data?.detail || 'Could not delete attendance.')
    }
  }

  const chart = {
    labels: data.attendance.map((a) => a.month),
    datasets: [{
      label: 'Attendance %',
      data: data.attendance.map((a) => a.percentage),
      borderColor: '#7C8BFF',
      backgroundColor: 'rgba(124,139,255,0.15)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#7C8BFF',
    }],
  }

  return (
    <DashboardLayout role="student" title="Attendance">
      <div className="glass-card">
        <p className="section-label mb-4">Monthly Attendance</p>
        <div className="h-72">
          <Line data={chart} options={{ ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, min: 0, max: 100 } } }} />
        </div>
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">Log Attendance</p>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-3">
          <select className="input-field" value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}>
            <option value="">Subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="input-field" placeholder="Month (e.g. June)" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
          <input className="input-field" type="number" min="0" max="100" step="0.1" placeholder="Percentage" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} />
          <button type="submit" className="btn-primary !py-2.5 text-sm justify-center"><Plus size={15} /> Add</button>
        </form>
        {status && <p className={`text-sm mt-3 ${status.type === 'success' ? 'text-mint-400' : 'text-coral-400'}`}>{status.message}</p>}
      </div>

      <div className="glass-card">
        <p className="section-label mb-4">Attendance by Subject</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Percentage</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.attendance.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  {editingId === a.id ? (
                    <>
                      <td className="py-2.5 pr-4">
                        <input className="input-field !py-1.5" value={editForm.month} onChange={(e) => setEditForm((f) => ({ ...f, month: e.target.value }))} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <select className="input-field !py-1.5" value={editForm.subject_id} onChange={(e) => setEditForm((f) => ({ ...f, subject_id: e.target.value }))}>
                          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 pr-4">
                        <input className="input-field !py-1.5" type="number" min="0" max="100" step="0.1" value={editForm.percentage} onChange={(e) => setEditForm((f) => ({ ...f, percentage: e.target.value }))} />
                      </td>
                      <td className="py-2.5 text-right space-x-2">
                        <button onClick={() => handleUpdate(a.id)} className="text-mint-400 hover:text-mint-300"><Save size={15} /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white"><X size={15} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 pr-4">{a.month}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{a.subject}</td>
                      <td className="py-2.5 pr-4">
                        <span className={a.percentage < 75 ? 'text-coral-400 font-medium' : 'text-mint-400 font-medium'}>
                          {a.percentage}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-3">
                        <button onClick={() => startEdit(a)} className="text-slate-400 hover:text-white"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-coral-400"><Trash2 size={14} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {data.attendance.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-400">No attendance logged yet — add your first record above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

