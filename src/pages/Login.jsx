import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const REMEMBER_KEY = 'date_app_remember'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()

  // 进登录页时，从本地读取上次记住的账号密码（默认勾选"记住我"）
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null') } catch { return null }
  })()

  const [username, setUsername] = useState(saved?.username || '')
  const [password, setPassword] = useState(saved?.password || '')
  const [remember, setRemember] = useState(!!saved)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const d = await api.login(username, password)
      // 登录成功后再记住账号密码，避免记住错的
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }))
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }
      login(d.token, d.user)
      nav('/home')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1>💕 欢迎回来</h1>
      <p className="subtitle">登录你的约会小天地</p>
      <form onSubmit={submit}>
        <input value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名" autoComplete="username" />
        <input value={password} onChange={(e) => setPassword(e.target.value)}
          type="password" placeholder="密码" autoComplete="current-password" />
        <label className="remember-box">
          <input type="checkbox" checked={remember}
            onChange={(e) => setRemember(e.target.checked)} />
          <span>记住账号密码</span>
        </label>
        {err && <div className="error">{err}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
      </form>
      <p className="switch">还没账号？<Link to="/register">去注册</Link></p>
    </div>
  )
}
