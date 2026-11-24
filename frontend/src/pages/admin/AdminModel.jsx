import React, { useEffect, useState } from 'react'
import { Cpu, RefreshCcw, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import StatCard from '../../components/StatCard'
import api from '../../utils/api'

export default function AdminModel() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retraining, setRetraining] = useState(false)
  const [message, setMessage] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/api/admin/ai-model/metrics').then((res) => setMetrics(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const retrain = async () => {
    setRetraining(true)
    setMessage('')
    try {
      const res = await api.post('/api/admin/ai-model/retrain')
      setMetrics(res.data.metrics)
      setMessage('Model retrained successfully.')
    } finally {
      setRetraining(false)
    }
  }

  if (loading) return <DashboardLayout role="admin" title="AI Model"><LoadingState /></DashboardLayout>

  return (
    <DashboardLayout role="admin" title="AI Model">
      <div className="glass-card max-w-xl">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center mb-4">
          <Cpu size={20} className="text-indigo-300" />
        </div>
        <h2 className="font-display text-xl font-semibold">Random Forest Regressor</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Predicts final marks from attendance, internal marks, assignment scores, quiz scores
          and study hours. Retraining regenerates the model on the current synthetic dataset.
        </p>
        <button onClick={retrain} disabled={retraining} className="btn-primary mt-6 disabled:opacity-60">
          <RefreshCcw size={16} className={retraining ? 'animate-spin' : ''} /> {retraining ? 'Retraining…' : 'Retrain Model'}
        </button>
        {message && (
          <p className="flex items-center gap-2 text-sm text-mint-400 mt-4">
            <CheckCircle2 size={15} /> {message}
          </p>
        )}
      </div>

      {metrics && !metrics.detail && (
        <div className="grid sm:grid-cols-3 gap-5">
          <StatCard label="MAE" value={metrics.mae} sublabel="Mean Absolute Error" accent="indigo" />
          <StatCard label="RMSE" value={metrics.rmse} sublabel="Root Mean Squared Error" accent="violet" delay={0.05} />
          <StatCard label="R² Score" value={metrics.r2_score} sublabel="Variance explained" accent="mint" delay={0.1} />
        </div>
      )}
      {metrics?.detail && <div className="glass-card text-slate-400">{metrics.detail}</div>}
    </DashboardLayout>
  )
}
