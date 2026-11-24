import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/StudentProfile'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentAcademics from './pages/student/StudentAcademics'
import StudentPredictions from './pages/student/StudentPredictions'
import StudentTeacher from './pages/student/StudentTeacher'
import StudentDigitalTwin from './pages/student/StudentDigitalTwin'
import StudentAIAgent from './pages/student/StudentAIAgent'
import StudentChat from './pages/student/StudentChat'
import StudentGamification from './pages/student/StudentGamification'
import StudentCalendar from './pages/student/StudentCalendar'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherStudentDetail from './pages/teacher/TeacherStudentDetail'
import TeacherImportStudents from './pages/teacher/TeacherImportStudents'
import TeacherAnalytics from './pages/teacher/TeacherAnalytics'
import TeacherWeakStudents from './pages/teacher/TeacherWeakStudents'
import TeacherReports from './pages/teacher/TeacherReports'
import TeacherChat from './pages/teacher/TeacherChat'
import TeacherRequests from './pages/teacher/TeacherRequests'

import ParentDashboard from './pages/parent/ParentDashboard'
import ParentProgress from './pages/parent/ParentProgress'
import ParentAlerts from './pages/parent/ParentAlerts'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDepartments from './pages/admin/AdminDepartments'
import AdminModel from './pages/admin/AdminModel'
import AdminReports from './pages/admin/AdminReports'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
      <Route path="/student/academics" element={<ProtectedRoute allowedRoles={['student']}><StudentAcademics /></ProtectedRoute>} />
      <Route path="/student/predictions" element={<ProtectedRoute allowedRoles={['student']}><StudentPredictions /></ProtectedRoute>} />
      <Route path="/student/teacher" element={<ProtectedRoute allowedRoles={['student']}><StudentTeacher /></ProtectedRoute>} />
      <Route path="/student/digital-twin" element={<ProtectedRoute allowedRoles={['student']}><StudentDigitalTwin /></ProtectedRoute>} />
      <Route path="/student/ai-agent" element={<ProtectedRoute allowedRoles={['student']}><StudentAIAgent /></ProtectedRoute>} />
      <Route path="/student/chat" element={<ProtectedRoute allowedRoles={['student']}><StudentChat /></ProtectedRoute>} />
      <Route path="/student/gamification" element={<ProtectedRoute allowedRoles={['student']}><StudentGamification /></ProtectedRoute>} />
      <Route path="/student/calendar" element={<ProtectedRoute allowedRoles={['student']}><StudentCalendar /></ProtectedRoute>} />

      {/* Teacher */}
      <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudents /></ProtectedRoute>} />
      <Route path="/teacher/students/:studentId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudentDetail /></ProtectedRoute>} />
      <Route path="/teacher/import" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherImportStudents /></ProtectedRoute>} />
      <Route path="/teacher/analytics" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAnalytics /></ProtectedRoute>} />
      <Route path="/teacher/weak-students" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherWeakStudents /></ProtectedRoute>} />
      <Route path="/teacher/reports" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherReports /></ProtectedRoute>} />
      <Route path="/teacher/chat" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherChat /></ProtectedRoute>} />
      <Route path="/teacher/requests" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherRequests /></ProtectedRoute>} />

      {/* Parent */}
      <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent/progress" element={<ProtectedRoute allowedRoles={['parent']}><ParentProgress /></ProtectedRoute>} />
      <Route path="/parent/alerts" element={<ProtectedRoute allowedRoles={['parent']}><ParentAlerts /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><AdminDepartments /></ProtectedRoute>} />
      <Route path="/admin/model" element={<ProtectedRoute allowedRoles={['admin']}><AdminModel /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
