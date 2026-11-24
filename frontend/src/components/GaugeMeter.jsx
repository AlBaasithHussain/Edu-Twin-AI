import React from 'react'
import { motion } from 'framer-motion'

// Semi-circular gauge, value 0-100
export default function GaugeMeter({ value = 0, label = 'Predicted Score', size = 220 }) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = 80
  const circumference = Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  let color = '#4ADE9C' // low risk / good
  if (clamped < 45) color = '#F14C4C'
  else if (clamped < 65) color = '#F59E0B'

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 1.7} viewBox="0 0 200 120">
        <path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="currentColor"
          className="text-white/10"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <motion.path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <text x="100" y="95" textAnchor="middle" className="fill-current" fontSize="34" fontWeight="700" fontFamily="Space Grotesk">
          {clamped.toFixed(0)}
        </text>
      </svg>
      <p className="section-label mt-1">{label}</p>
    </div>
  )
}
