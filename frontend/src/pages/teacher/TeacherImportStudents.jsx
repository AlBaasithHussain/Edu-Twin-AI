import React, { useState } from 'react'
import { Upload, CheckCircle2, AlertTriangle, Download } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../utils/api'

export default function TeacherImportStudents() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const downloadTemplate = () => {
    const csv = 'roll_number,name,email,password\nCS2024101,Jane Doe,jane.doe@example.com,student123\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'student_import_template.csv'
    link.click()
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/api/teacher/import-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Import failed. Check your CSV format.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="teacher" title="Import Students">
      <div className="glass-card max-w-xl">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center mb-4">
          <Upload size={20} className="text-indigo-300" />
        </div>
        <h2 className="font-display text-xl font-semibold">Bulk-add students to your class</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Upload a CSV with columns <code className="text-indigo-300">roll_number, name, email</code> (password optional,
          defaults to <code className="text-indigo-300">student123</code>). Existing students get linked to you; new
          ones get an account created. This never touches attendance, marks, or predictions — you'll only be able to
          view those, not edit them.
        </p>

        <button onClick={downloadTemplate} className="btn-ghost !py-2 !px-4 text-xs mt-4">
          <Download size={14} /> Download CSV template
        </button>

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          <label className="block">
            <div className="rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-400/40 transition-all p-6 text-center cursor-pointer">
              <Upload size={22} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-300">{file ? file.name : 'Click to choose a CSV file'}</p>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </label>

          {error && <p className="text-sm text-coral-400 bg-coral-500/10 border border-coral-500/20 rounded-xl px-3 py-2">{error}</p>}

          <button type="submit" disabled={!file || loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Importing…' : 'Import Students'}
          </button>
        </form>

        {result && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-mint-400 text-sm">
              <CheckCircle2 size={16} />
              {result.created} new account{result.created !== 1 ? 's' : ''} created, {result.linked_existing} existing student{result.linked_existing !== 1 ? 's' : ''} linked to you.
            </div>
            {result.skipped.length > 0 && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
                  <AlertTriangle size={15} /> {result.skipped.length} row{result.skipped.length !== 1 ? 's' : ''} skipped
                </div>
                <ul className="text-xs text-slate-400 space-y-1 max-h-32 overflow-y-auto">
                  {result.skipped.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
