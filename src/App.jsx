import React from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Pairing from './pages/Pairing'
import Home from './pages/Home'
import NewInvitation from './pages/NewInvitation'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">加载中…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function TopBar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  if (!user) return null
  return (
    <header className="topbar">
      <Link to="/home" className="logo">💕 约会</Link>
      <nav className="nav">
        <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>首页</Link>
        <Link to="/new" className={location.pathname === '/new' ? 'active' : ''}>发起邀请</Link>
        {!user.couple_id && <Link to="/pair">配对</Link>}
      </nav>
      <div className="user-box">
        <span className="nickname">{user.nickname}</span>
        <button onClick={logout} className="btn-ghost">退出</button>
      </div>
    </header>
  )
}

export default function App() {
  const { user } = useAuth()
  return (
    <div className="app">
      {user && <TopBar />}
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pair" element={<RequireAuth><Pairing /></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/new" element={<RequireAuth><NewInvitation /></RequireAuth>} />
          <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  )
}
