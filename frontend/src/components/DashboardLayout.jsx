import React from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayout({ role, title, children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 min-w-0">
        <Navbar title={title} />
        <main className="p-5 space-y-6">{children}</main>
      </div>
    </div>
  )
}
