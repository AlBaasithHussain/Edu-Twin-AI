import { useCallback, useEffect, useState } from 'react'
import api from '../utils/api'

export function useStudentDashboard() {
  const [studentId, setStudentId] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const me = await api.get('/api/students/me')
      const id = me.data.id
      setStudentId(id)
      const dash = await api.get(`/api/students/${id}/dashboard`)
      setData(dash.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const runPrediction = useCallback(async () => {
    if (!studentId) return
    await api.post(`/api/predictions/run/${studentId}`)
    await fetchAll()
  }, [studentId, fetchAll])

  return { data, loading, error, refetch: fetchAll, runPrediction }
}
