import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', nickname: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm({ ...form, [k]: v }) }

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const d = await api.register(form.username, form.password, form.nickname)
      login(d.token, d.user)
      nav('/pair')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1>✨ 创建账号</h1>
      <p className="subtitle">加入两个人的小世界</p>
      <form onSubmit={submit}>
        <input value={form.nickname} onChange={(e) => set('nickname', e.target.value)}
          placeholder="你的昵称" />
        <input value={form.username} onChange={(e) => set('username', e.target.value)}
          placeholder="用户名（登录用）" autoComplete="username" />
        <input value={form.password} onChange={(e) => set('password', e.target.value)}
          type="password" placeholder="密码（至少6位）" autoComplete="new-password" />
        {err && <div className="error">{err}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '创建中…' : '注册'}
        </button>
      </form>
      <p className="switch">已有账号？<Link to="/login">去登录</Link></p>
    </div>
  )
}
