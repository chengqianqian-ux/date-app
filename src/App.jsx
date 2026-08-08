import React from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Pairing from './pages/Pairing'
import Home from './pages/Home'
import NewInvitation from './pages/NewInvitation'
import Profile from './pages/Profile'
import Wishlist from './pages/Wishlist'
import Chat from './pages/Chat'
import Timeline from './pages/Timeline'

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
  const navs = user.couple_id
    ? [
        { to: '/home', label: '首页' },
        { to: '/new', label: '发起' },
        { to: '/wishlist', label: '心愿单' },
        { to: '/chat', label: '聊天' },
        { to: '/timeline', label: '回忆' },
      ]
    : [
        { to: '/home', label: '首页' },
        { to: '/new', label: '发起' },
        { to: '/pair', label: '配对' },
      ]
  return (
    <header className="topbar">
      <div className="topbar-top">
        <Link to="/home" className="logo">💕 约会</Link>
        <div className="user-box">
          <Link to="/profile" className={location.pathname === '/profile' ? 'active nickname' : 'nickname'}>我的</Link>
          <button onClick={logout} className="btn-ghost">退出</button>
        </div>
      </div>
      <nav className="nav">
        {navs.map((n) => (
          <Link key={n.to} to={n.to} className={location.pathname === n.to ? 'active' : ''}>
            {n.label}
          </Link>
        ))}
      </nav>
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
          <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="/timeline" element={<RequireAuth><Timeline /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  )
}
