import React, { useEffect, useState } from 'react'
import { Search, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function TeacherStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.get('/api/teacher/students').then((res) => setStudents(res.data)).finally(() => setLoading(false))
  }, [])

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) || s.roll_number.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <DashboardLayout role="teacher" title="All Students">
      <div className="glass-card">
        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or roll number" className="input-field pl-11"
          />
        </div>

        {loading ? <LoadingState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="py-2 pr-4">Roll No.</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Semester</th>
                  <th className="py-2">Digital Twin</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="py-2.5 pr-4 font-medium">{s.roll_number}</td>
                    <td className="py-2.5 pr-4">{s.name}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{s.email}</td>
                    <td className="py-2.5 pr-4">{s.semester}</td>
                    <td className="py-2.5">
                      <Link to={`/teacher/students/${s.id}`} className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 text-xs font-medium">
                        View <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-slate-400 py-8">No students found.</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
