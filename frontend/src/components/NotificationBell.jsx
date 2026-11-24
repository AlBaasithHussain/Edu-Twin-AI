import React, { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, AlertTriangle, BookOpenText, ClipboardList, CalendarDays, Timer } from 'lucide-react'
import api from '../utils/api'

const categoryIcon = {
  attendance: CalendarDays,
  marks: BookOpenText,
  assignment: ClipboardList,
  exam: AlertTriangle,
  study: Timer,
  system: Bell,
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef(null)

  async function load() {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count'),
      ])
      setNotifications(listRes.data)
      setUnreadCount(countRes.data.count)
    } catch {
      // silently ignore — notifications are non-critical
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function markAllRead() {
    await api.post('/api/notifications/mark-all-read')
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-10 w-10 rounded-2xl glass flex items-center justify-center hover:border-indigo-400/40"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-coral-500 text-[10px] font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass rounded-2xl shadow-glass z-50 p-2">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-6 text-center">You're all caught up.</p>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => {
                const Icon = categoryIcon[n.category] || Bell
                return (
                  <div
                    key={n.id}
                    className={`flex gap-2.5 px-3 py-2.5 rounded-xl ${n.is_read ? 'opacity-60' : 'bg-white/5'}`}
                  >
                    <Icon size={15} className="text-indigo-300 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium leading-snug">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
