import React from 'react'
import { motion } from 'framer-motion'

const accentMap = {
  indigo: 'from-indigo-500/20 to-indigo-500/0 text-indigo-300',
  violet: 'from-violet-500/20 to-violet-500/0 text-violet-300',
  mint: 'from-mint-500/20 to-mint-500/0 text-mint-400',
  amber: 'from-amber-500/20 to-amber-500/0 text-amber-400',
  coral: 'from-coral-500/20 to-coral-500/0 text-coral-400',
}

export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'indigo', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card relative overflow-hidden"
    >
      <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${accentMap[accent]} blur-xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="section-label">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
          {sublabel && <p className="mt-1 text-sm text-slate-400">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={`rounded-2xl p-3 bg-gradient-to-br ${accentMap[accent]}`}>
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
