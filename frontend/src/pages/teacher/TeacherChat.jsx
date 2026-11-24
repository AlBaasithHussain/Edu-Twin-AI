import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Circle, Users } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws')

export default function TeacherChat() {
  const [threads, setThreads] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  async function loadThreads() {
    const res = await api.get('/api/chat/threads')
    setThreads(res.data)
    setLoading(false)
    if (!activeId && res.data.length > 0) setActiveId(res.data[0].student_id)
  }

  useEffect(() => { loadThreads() }, [])

  useEffect(() => {
    if (activeId == null) return
    (async () => {
      const res = await api.get(`/api/chat/history/${activeId}`)
      setMessages(res.data)
    })()
  }, [activeId])

  useEffect(() => {
    const token = localStorage.getItem('twin_token')
    if (!token) return
    const ws = new WebSocket(`${WS_BASE_URL}/api/chat/ws?token=${token}`)
    wsRef.current = ws
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data)
      if (data.type === 'message' && data.sender_role === 'student') {
        if (data.student_id === activeId) {
          setMessages((prev) => [...prev, data])
        }
        loadThreads()
      }
    }
    return () => ws.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = input.trim()
    if (!content || activeId == null) return
    setInput('')
    const res = await api.post(`/api/chat/send/${activeId}`, { content })
    setMessages((prev) => [...prev, res.data])
  }

  if (loading) return <DashboardLayout role="teacher" title="Student Chat"><LoadingState label="Loading conversations…" /></DashboardLayout>

  const activeThread = threads.find((t) => t.student_id === activeId)

  return (
    <DashboardLayout role="teacher" title="Student Chat">
      <div className="glass-card !p-0 flex h-[75vh] overflow-hidden">
        <div className="w-64 shrink-0 border-r border-white/5 overflow-y-auto">
          <p className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2"><Users size={13} /> Your students</p>
          {threads.length === 0 && <p className="px-4 text-xs text-slate-500">No linked students yet.</p>}
          {threads.map((t) => (
            <button
              key={t.student_id}
              onClick={() => setActiveId(t.student_id)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                activeId === t.student_id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Circle size={7} className={t.online ? 'text-mint-400 fill-mint-400' : 'text-slate-600 fill-slate-600'} />
                  {t.student_name}
                </span>
                {t.unread_count > 0 && (
                  <span className="text-[10px] bg-coral-500 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">{t.unread_count}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">{t.last_message || 'No messages yet'}</p>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Select a student to start chatting</div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/5">
                <p className="font-display font-semibold">{activeThread.student_name}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
                {messages.map((m, idx) => (
                  <motion.div key={m.id || idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.sender_role === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.sender_role === 'teacher' ? 'bg-indigo-500/20 border border-indigo-400/20' : 'bg-white/5 border border-white/10'
                    }`}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-center gap-3 px-5 py-4 border-t border-white/5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Reply to student…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-400/40"
                />
                <button type="submit" disabled={!input.trim()} className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center disabled:opacity-40">
                  <Send size={17} className="text-white" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
