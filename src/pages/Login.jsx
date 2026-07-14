import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const d = await api.login(username, password)
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
        {err && <div className="error">{err}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
      </form>
      <p className="switch">还没账号？<Link to="/register">去注册</Link></p>
    </div>
  )
}
