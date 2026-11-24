import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingState({ label = 'Loading your twin…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <Loader2 className="animate-spin text-indigo-400" size={28} />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  )
}
