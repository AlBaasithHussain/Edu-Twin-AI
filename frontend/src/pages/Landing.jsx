import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, Brain, Gauge, Users, ShieldCheck, TrendingUp, ArrowRight,
  CalendarCheck, BookOpenText, Timer,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'A living model of every learner',
    body: 'Attendance, marks, assignments, quizzes and study hours continuously update a per-student model that mirrors how they actually learn.',
  },
  {
    icon: Gauge,
    title: 'Final-marks prediction, explained',
    body: 'A Random Forest model forecasts final marks and risk level, and shows exactly which signals moved the needle.',
  },
  {
    icon: TrendingUp,
    title: 'Recommendations, not just scores',
    body: 'Rule-based coaching turns weak attendance, low marks or late assignments into a specific next action.',
  },
  {
    icon: Users,
    title: 'One twin, four vantage points',
    body: 'Students, teachers, parents and admins each see the same underlying twin, shaped for what they need to decide.',
  },
]

const ROLES = [
  { role: 'student', label: 'Student', desc: 'Track your own twin', icon: BookOpenText },
  { role: 'teacher', label: 'Teacher', desc: 'Spot risk across a class', icon: Users },
  { role: 'parent', label: 'Parent', desc: 'Follow your child’s progress', icon: ShieldCheck },
  { role: 'admin', label: 'Admin', desc: 'Run the whole system', icon: Sparkles },
]

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display font-semibold text-lg">Cortex Twin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost !px-5 !py-2.5 text-sm">Log in</Link>
          <Link to="/register" className="btn-primary !px-5 !py-2.5 text-sm">Get started <ArrowRight size={15} /></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="pill bg-indigo-500/10 text-indigo-300 border border-indigo-400/20">
            <Sparkles size={13} /> AI Digital Twin for Learning
          </span>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-6">
            Every student has a
            <span className="gradient-text"> digital twin </span>
            of how they learn.
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl">
            Cortex Twin fuses attendance, marks, assignments, quizzes and study habits into one
            living model per student — predicting outcomes before report cards do, and
            recommending exactly what to change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Create your twin <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-ghost">Sign in to an existing account</Link>
          </div>
          <div className="mt-10 flex items-center gap-8 text-sm text-slate-400">
            <div><p className="font-display text-2xl text-white font-semibold">100+</p>students modeled</div>
            <div><p className="font-display text-2xl text-white font-semibold">5</p>live signal streams</div>
            <div><p className="font-display text-2xl text-white font-semibold">4</p>role-based views</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="glass-card relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="section-label">Live Twin Snapshot</p>
                <p className="font-display text-xl font-semibold mt-1">Ariah Chen · Sem 4</p>
              </div>
              <span className="pill bg-mint-500/10 text-mint-400 border border-mint-500/20">Low risk</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Attendance', value: '88%', icon: CalendarCheck },
                { label: 'Avg Marks', value: '76', icon: BookOpenText },
                { label: 'Study/day', value: '2.4h', icon: Timer },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                  <s.icon size={16} className="text-indigo-300 mb-2" />
                  <p className="font-display font-semibold">{s.value}</p>
                  <p className="text-[11px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center py-4">
              <svg width="180" height="105" viewBox="0 0 200 120">
                <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinecap="round" />
                <motion.path
                  d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#4ADE9C" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={Math.PI * 80}
                  initial={{ strokeDashoffset: Math.PI * 80 }}
                  animate={{ strokeDashoffset: Math.PI * 80 * 0.18 }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                />
                <text x="100" y="95" textAnchor="middle" fill="white" fontSize="30" fontWeight="700" fontFamily="Space Grotesk">82</text>
              </svg>
            </div>
            <p className="text-center text-xs text-slate-400 -mt-2">Predicted final marks</p>
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="glass-card absolute -bottom-8 -left-8 !p-4 w-52 hidden sm:block"
          >
            <p className="text-xs text-slate-400">AI Recommendation</p>
            <p className="text-sm mt-1">Increase study time by 30 min/day to reach 85+.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="section-label text-center">What the twin does</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center mt-3 max-w-2xl mx-auto">
          One model, shaped for how each person needs to act on it.
        </h2>
        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass-card"
            >
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-indigo-300" />
              </div>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="section-label text-center">Built for every stakeholder</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center mt-3">Pick your view</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {ROLES.map((r) => (
            <Link key={r.role} to={`/login?role=${r.role}`} className="glass-card text-center group">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <r.icon size={22} className="text-indigo-300" />
              </div>
              <p className="font-display font-semibold">{r.label}</p>
              <p className="text-xs text-slate-400 mt-1">{r.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
        <p>© {new Date().getFullYear()} Cortex Twin. Built for academic performance prediction.</p>
        <p>Demo project — not affiliated with any institution.</p>
      </footer>
    </div>
  )
}
