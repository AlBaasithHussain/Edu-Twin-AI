import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, Trash2, User as UserIcon, Loader2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../utils/api'

function formatContent(text) {
  // Lightweight markdown-ish rendering: **bold**, bullet lines, numbered lines.
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
      chunk.startsWith('**') && chunk.endsWith('**')
        ? <strong key={j} className="text-white font-semibold">{chunk.slice(2, -2)}</strong>
        : <React.Fragment key={j}>{chunk}</React.Fragment>
    )
    return (
      <p key={i} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
        {parts}
      </p>
    )
  })
}

export default function StudentAIAgent() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/agent/history')
        setMessages(res.data)
      } finally {
        setLoadingHistory(false)
      }
    })()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function send(text) {
    const message = (text ?? input).trim()
    if (!message || sending) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message, created_at: new Date().toISOString() }])
    setSending(true)
    try {
      const res = await api.post('/api/agent/chat', { message })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply, created_at: res.data.created_at }])
      setSuggestions(res.data.suggestions || [])
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Sorry, something went wrong reaching the AI Agent. Please try again.",
        created_at: new Date().toISOString(),
      }])
    } finally {
      setSending(false)
    }
  }

  async function clearChat() {
    await api.delete('/api/agent/history')
    setMessages([])
    setSuggestions([])
  }

  const starterPrompts = [
    "I don't understand Binary Search",
    'Generate a quiz on my weakest subject',
    'Prepare me for tomorrow\'s exam',
    'Explain in Tamil',
  ]

  return (
    <DashboardLayout role="student" title="AI Agent">
      <div className="glass-card !p-0 flex flex-col h-[75vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <p className="font-display font-semibold leading-none">AI Agent</p>
              <p className="text-[11px] text-slate-400 mt-1">Your personal tutor — grounded in your real academic data</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-coral-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5"
          >
            <Trash2 size={14} /> Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="animate-spin text-indigo-400" size={24} />
              <p className="mt-3 text-sm">Loading your conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/0 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-violet-300" />
              </div>
              <p className="font-display text-lg font-semibold">Ask me anything about your studies</p>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                I know your attendance, marks, weak & strong subjects, and predicted risk level —
                ask me to explain a topic, generate notes, build a quiz, or plan your revision.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-6 w-full max-w-md">
                {starterPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs text-left px-3 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-indigo-400/40 hover:bg-white/5 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${
                    m.role === 'user' ? 'bg-white/10' : 'bg-gradient-to-br from-indigo-500 to-violet-500'
                  }`}>
                    {m.role === 'user' ? <UserIcon size={15} className="text-slate-300" /> : <Bot size={15} className="text-white" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === 'user'
                      ? 'bg-indigo-500/15 border border-indigo-400/20 text-slate-100'
                      : 'bg-white/5 border border-white/10 text-slate-200'
                  }`}>
                    {formatContent(m.content)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {sending && (
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Bot size={15} className="text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !sending && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-indigo-400/20 text-indigo-200 hover:bg-indigo-500/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send() }}
          className="flex items-center gap-3 px-5 py-4 border-t border-white/5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI Agent anything… e.g. 'Teach me DBMS'"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400/40"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow disabled:opacity-40 transition-opacity"
          >
            <Send size={17} className="text-white" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
