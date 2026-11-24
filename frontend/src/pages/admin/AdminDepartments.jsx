import React, { useEffect, useState } from 'react'
import { Plus, Building2, BookOpen } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deptName, setDeptName] = useState('')
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', department_id: '' })

  const load = async () => {
    setLoading(true)
    const [d, s] = await Promise.all([api.get('/api/admin/departments'), api.get('/api/admin/subjects')])
    setDepartments(d.data)
    setSubjects(s.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addDepartment = async (e) => {
    e.preventDefault()
    if (!deptName.trim()) return
    await api.post('/api/admin/departments', { name: deptName })
    setDeptName('')
    load()
  }

  const addSubject = async (e) => {
    e.preventDefault()
    if (!subjectForm.name || !subjectForm.code || !subjectForm.department_id) return
    await api.post('/api/admin/subjects', { ...subjectForm, department_id: Number(subjectForm.department_id) })
    setSubjectForm({ name: '', code: '', department_id: '' })
    load()
  }

  if (loading) return <DashboardLayout role="admin" title="Departments & Subjects"><LoadingState /></DashboardLayout>

  return (
    <DashboardLayout role="admin" title="Departments & Subjects">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-indigo-300" />
            <p className="section-label">Departments</p>
          </div>
          <form onSubmit={addDepartment} className="flex gap-2 mb-4">
            <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="Department name" className="input-field" />
            <button type="submit" className="btn-primary !px-4"><Plus size={16} /></button>
          </form>
          <div className="space-y-2">
            {departments.map((d) => (
              <div key={d.id} className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm">{d.name}</div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-violet-300" />
            <p className="section-label">Subjects</p>
          </div>
          <form onSubmit={addSubject} className="space-y-2 mb-4">
            <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject name" className="input-field" />
            <div className="flex gap-2">
              <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="Code (e.g. CS401)" className="input-field" />
              <select
                value={subjectForm.department_id}
                onChange={(e) => setSubjectForm({ ...subjectForm, department_id: e.target.value })}
                className="input-field"
              >
                <option value="">Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full"><Plus size={16} /> Add Subject</button>
          </form>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm">
                <span>{s.name}</span>
                <span className="text-slate-400 text-xs">{s.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
