import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Star, Award, Zap } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

export default function StudentGamification() {
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [statsRes, boardRes, meRes] = await Promise.all([
        api.get('/api/gamification/me'),
        api.get('/api/gamification/leaderboard'),
        api.get('/api/students/me'),
      ])
      setStats(statsRes.data)
      setLeaderboard(boardRes.data)
      setMe(meRes.data)
      setLoading(false)
    })()
  }, [])

  if (loading) return <DashboardLayout role="student" title="Gamification"><LoadingState label="Tallying your XP…" /></DashboardLayout>
  if (!stats) return <DashboardLayout role="student" title="Gamification"><div className="glass-card text-coral-400">Couldn't load your stats.</div></DashboardLayout>

  const progressPct = Math.min(100, (stats.xp_into_level / stats.xp_for_next_level) * 100)

  return (
    <DashboardLayout role="student" title="Gamification">
      <div className="grid sm:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Level</p>
              <p className="font-display text-4xl font-semibold mt-1">{stats.level}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-400/0 flex items-center justify-center">
              <Trophy size={26} className="text-amber-400" />
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{stats.xp_into_level} XP</span>
              <span>{stats.xp_for_next_level} XP to level {stats.level + 1}</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-400 mt-3">Total XP earned: <span className="text-white font-semibold">{stats.total_xp}</span></p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-coral-500/20 to-coral-500/0 flex items-center justify-center mb-2">
            <Flame size={26} className="text-coral-400" />
          </div>
          <p className="font-display text-3xl font-semibold">{stats.current_streak}</p>
          <p className="text-xs text-slate-400 mt-1">day streak</p>
          <p className="text-[11px] text-slate-500 mt-2">Best: {stats.longest_streak} days</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card">
          <p className="section-label mb-4 flex items-center gap-2"><Award size={15} /> Badges Earned</p>
          {stats.badges.length === 0 ? (
            <p className="text-sm text-slate-400">No badges yet — chat with your AI Agent, hit study streaks, or complete goals to earn your first one.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.badges.map((b) => (
                <span key={b} className="text-xs px-3 py-1.5 rounded-full border border-amber-400/30 text-amber-300 bg-amber-400/5 flex items-center gap-1.5">
                  <Star size={12} /> {b}
                </span>
              ))}
            </div>
          )}

          <p className="section-label mb-3 mt-6 flex items-center gap-2"><Zap size={15} /> Recent XP Activity</p>
          <div className="space-y-2">
            {stats.recent_events.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
            {stats.recent_events.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white/5">
                <span className="text-slate-300">{e.reason}</span>
                <span className="text-mint-400 font-semibold">+{e.points} XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <p className="section-label mb-4 flex items-center gap-2"><Trophy size={15} /> Class Leaderboard</p>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-400">Choose a teacher to join a class leaderboard.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((row, i) => (
                <div
                  key={row.student_id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
                    me && row.student_id === me.id ? 'bg-indigo-500/15 border border-indigo-400/30' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${i < 3 ? 'text-amber-400' : 'text-slate-500'}`}>#{i + 1}</span>
                    <span className="text-sm">{row.name}{me && row.student_id === me.id ? ' (You)' : ''}</span>
                  </div>
                  <span className="text-xs text-slate-400">Lvl {row.level} · {row.total_xp} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
