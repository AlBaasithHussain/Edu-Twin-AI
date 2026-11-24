import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, GraduationCap, Circle } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import LoadingState from '../../components/LoadingState'
import api from '../../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws')

export default function StudentChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [teacherOnline, setTeacherOnline] = useState(false)
  const [teacherTyping, setTeacherTyping] = useState(false)
  const [noTeacher, setNoTeacher] = useState(false)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimeout = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/chat/history')
        setMessages(res.data)
      } catch (err) {
        if (err?.response?.status === 400) setNoTeacher(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('twin_token')
    if (!token || noTeacher) return
    const ws = new WebSocket(`${WS_BASE_URL}/api/chat/ws?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data)
      if (data.type === 'message' && data.sender_role === 'teacher') {
        setMessages((prev) => [...prev, data])
        setTeacherTyping(false)
      } else if (data.type === 'typing') {
        setTeacherTyping(true)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setTeacherTyping(false), 2500)
      }
    }
    return () => ws.close()
  }, [noTeacher])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, teacherTyping])

  async function send() {
    const content = input.trim()
    if (!content) return
    setInput('')
    const res = await api.post('/api/chat/send', { content })
    setMessages((prev) => [...prev, res.data])
  }

  function onTyping() {
    // Best-effort typing relay — teacher_id resolved server-side from the student's link.
  }

  if (loading) return <DashboardLayout role="student" title="Chat with Teacher"><LoadingState label="Connecting…" /></DashboardLayout>

  if (noTeacher) {
    return (
      <DashboardLayout role="student" title="Chat with Teacher">
        <div className="glass-card text-center py-16">
          <GraduationCap size={32} className="mx-auto text-slate-500" />
          <p className="mt-3 text-sm text-slate-400">You don't have a linked teacher yet. Choose one from the "My Teacher" page and wait for them to accept your request.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student" title="Chat with Teacher">
      <div className="glass-card !p-0 flex flex-col h-[75vh] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-mint-500/20 to-mint-500/0 flex items-center justify-center relative">
            <GraduationCap size={19} className="text-mint-400" />
            <Circle size={9} className={`absolute -bottom-0.5 -right-0.5 ${teacherOnline ? 'text-mint-400 fill-mint-400' : 'text-slate-600 fill-slate-600'}`} />
          </div>
          <div>
            <p className="font-display font-semibold leading-none">Your Teacher</p>
            <p className="text-[11px] text-slate-400 mt-1">{teacherTyping ? 'typing…' : 'Direct messages'}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-slate-400 text-center mt-10">No messages yet — say hello to your teacher!</p>
          )}
          {messages.map((m, idx) => (
            <motion.div key={m.id || idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.sender_role === 'student' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                m.sender_role === 'student' ? 'bg-indigo-500/20 border border-indigo-400/20' : 'bg-white/5 border border-white/10'
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
            onChange={(e) => { setInput(e.target.value); onTyping() }}
            placeholder="Message your teacher…"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-400/40"
          />
          <button type="submit" disabled={!input.trim()} className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center disabled:opacity-40">
            <Send size={17} className="text-white" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
