import React, { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

const roleColor = {
  student: 'bg-indigo-500/10 text-indigo-300 border-indigo-400/20',
  teacher: 'bg-violet-500/10 text-violet-300 border-violet-400/20',
  parent: 'bg-mint-500/10 text-mint-400 border-mint-500/20',
  admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/api/admin/users').then((res) => setUsers(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    await api.delete(`/api/admin/users/${id}`)
    load()
  }

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter)

  return (
    <DashboardLayout role="admin" title="Manage Users">
      <div className="glass-card">
        <div className="flex gap-2 flex-wrap mb-5">
          {['all', 'student', 'teacher', 'parent', 'admin'].map((r) => (
            <button
              key={r} onClick={() => setFilter(r)}
              className={`pill border capitalize ${filter === r ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30' : 'bg-white/5 text-slate-400 border-white/10'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {loading ? <LoadingState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-4">{u.name}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{u.email}</td>
                    <td className="py-2.5 pr-4"><span className={`pill border capitalize ${roleColor[u.role]}`}>{u.role}</span></td>
                    <td className="py-2.5">
                      <button onClick={() => handleDelete(u.id)} className="text-coral-400 hover:text-coral-300">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
