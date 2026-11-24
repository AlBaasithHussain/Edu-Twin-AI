import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarCheck, BookOpenText, ClipboardList, Brain,
  Users, BarChart3, AlertTriangle, FileDown, Bell, Building2, GraduationCap,
  Cpu, FileBarChart, Sparkles, HeartPulse, Bot, MessageCircle, Trophy, CalendarDays, UserPlus, UserCircle2,
} from 'lucide-react'

const NAV = {
  student: [
    { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/student/profile', label: 'My Profile', icon: UserCircle2 },
    { to: '/student/digital-twin', label: 'AI Digital Twin', icon: HeartPulse },
    { to: '/student/ai-agent', label: 'AI Agent', icon: Bot },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/academics', label: 'Marks & Quizzes', icon: BookOpenText },
    { to: '/student/predictions', label: 'AI Predictions', icon: Brain },
    { to: '/student/teacher', label: 'My Teacher', icon: GraduationCap },
    { to: '/student/chat', label: 'Chat with Teacher', icon: MessageCircle },
    { to: '/student/gamification', label: 'XP & Badges', icon: Trophy },
    { to: '/student/calendar', label: 'Calendar & Goals', icon: CalendarDays },
  ],
  teacher: [
    { to: '/teacher', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/teacher/requests', label: 'Student Requests', icon: UserPlus },
    { to: '/teacher/students', label: 'All Students', icon: Users },
    { to: '/teacher/chat', label: 'Student Chat', icon: MessageCircle },
    { to: '/teacher/import', label: 'Import Students', icon: Sparkles },
    { to: '/teacher/analytics', label: 'Performance Analytics', icon: BarChart3 },
    { to: '/teacher/weak-students', label: 'Weak Student Detection', icon: AlertTriangle },
    { to: '/teacher/reports', label: 'Export Reports', icon: FileDown },
  ],
  parent: [
    { to: '/parent', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/parent/progress', label: 'Progress & Marks', icon: BookOpenText },
    { to: '/parent/alerts', label: 'Alerts', icon: Bell },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/departments', label: 'Departments & Subjects', icon: Building2 },
    { to: '/admin/model', label: 'AI Model', icon: Cpu },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ],
}

export default function Sidebar({ role }) {
  const items = NAV[role] || []
  return (
    <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 h-screen sticky top-0 p-5">
      <div className="glass rounded-3xl h-full flex flex-col p-5">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold leading-none">Cortex Twin</p>
            <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{role} workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="glass-card !p-4 mt-4 text-center">
          <GraduationCap className="mx-auto text-indigo-300" size={22} />
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your AI Digital Twin updates predictions every time new data arrives.
          </p>
        </div>
      </div>
    </aside>
  )
}
