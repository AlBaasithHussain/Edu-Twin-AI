import React from 'react'
import { Moon, Sun, LogOut, Menu } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'

export default function Navbar({ title, onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 px-5 pt-5">
      <div className="glass rounded-3xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden text-slate-300">
            <Menu size={20} />
          </button>
          <div>
            <p className="text-xs text-slate-400">Welcome back</p>
            <h1 className="font-display font-semibold text-lg">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="h-10 w-10 rounded-2xl glass flex items-center justify-center hover:border-indigo-400/40"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 pr-1 py-1 rounded-2xl glass">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="pr-2">
              <p className="text-xs font-semibold leading-none">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login') }}
            className="h-10 w-10 rounded-2xl glass flex items-center justify-center hover:border-coral-400/40 hover:text-coral-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
