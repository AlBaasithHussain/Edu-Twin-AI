import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, ArrowRight, GraduationCap, Users, ShieldCheck, Cpu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'teacher', label: 'Teacher', icon: Users },
  { id: 'parent', label: 'Parent', icon: ShieldCheck },
  { id: 'admin', label: 'Admin', icon: Cpu },
]

const DEMO_CREDS = {
  student: { email: 'student1@demo.com', password: 'student123' },
  teacher: { email: 'teacher@demo.com', password: 'teacher123' },
  parent: { email: 'parent@demo.com', password: 'parent123' },
  admin: { email: 'admin@demo.com', password: 'admin123' },
}

export default function Login() {
  const [params] = useSearchParams()
  const [role, setRole] = useState(params.get('role') || 'student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const fillDemo = () => {
    setEmail(DEMO_CREDS[role].email)
    setPassword(DEMO_CREDS[role].password)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userData = await login(email, password, role)
      navigate(`/${userData.role}`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display font-semibold text-lg">Cortex Twin</span>
        </Link>

        <div className="glass-card">
          <h1 className="font-display text-2xl font-semibold text-center">Welcome back</h1>
          <p className="text-sm text-slate-400 text-center mt-1">Sign in to view your digital twin</p>

          <div className="grid grid-cols-4 gap-2 mt-6">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-medium transition-all ${
                  role === r.id
                    ? 'bg-gradient-to-br from-indigo-500/25 to-violet-500/15 border border-indigo-400/40 text-white'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <r.icon size={17} />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" className="input-field pl-11"
              />
            </div>

            {error && <p className="text-sm text-coral-400 bg-coral-500/10 border border-coral-500/20 rounded-xl px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} />
            </button>
          </form>

          <button onClick={fillDemo} className="text-xs text-indigo-300 hover:text-indigo-200 w-full text-center mt-4">
            Fill demo {role} credentials
          </button>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account? <Link to="/register" className="text-indigo-300 hover:text-indigo-200 font-medium">Create one</Link>
        </p>
      </motion.div>
    </div>
  )
}
