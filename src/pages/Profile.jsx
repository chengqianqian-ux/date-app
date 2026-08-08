import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

function fmtDate(t) {
  if (!t) return '—'
  // created_at 是 ISO 字符串，截到分钟
  return String(t).replace('T', ' ').slice(0, 16)
}

export default function Profile() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  // 纪念日
  const [anniversary, setAnniversary] = useState('')
  const [anniMsg, setAnniMsg] = useState('')
  // 我的生日
  const [birthday, setBirthday] = useState('')
  const [bdMsg, setBdMsg] = useState('')

  useEffect(() => {
    if (user?.couple_id) {
      api.getAnniversary()
        .then((d) => setAnniversary(d.anniversary ? String(d.anniversary).slice(0, 10) : ''))
        .catch(() => {})
      api.getBirthdays()
        .then((d) => setBirthday(d.mine ? String(d.mine).slice(0, 10) : ''))
        .catch(() => {})
    }
  }, [user])

  function set(k, v) { setPwd({ ...pwd, [k]: v }); setOk('') }

  async function saveAnniversary() {
    setAnniMsg('')
    if (!anniversary) { setAnniMsg('请选择日期'); return }
    try {
      await api.setAnniversary(anniversary)
      setAnniMsg('已保存 💕')
    } catch (e) {
      setAnniMsg(e.message)
    }
  }

  async function saveBirthday() {
    setBdMsg('')
    if (!birthday) { setBdMsg('请选择日期'); return }
    try {
      await api.setBirthday(birthday)
      setBdMsg('已保存 🎂')
    } catch (e) {
      setBdMsg(e.message)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setErr(''); setOk('')
    if (!pwd.oldPassword || !pwd.newPassword) { setErr('请填写旧密码和新密码'); return }
    if (pwd.newPassword.length < 6) { setErr('新密码至少 6 位'); return }
    if (pwd.newPassword !== pwd.confirm) { setErr('两次输入的新密码不一致'); return }
    setLoading(true)
    try {
      await api.changePassword(pwd.oldPassword, pwd.newPassword)
      setOk('密码修改成功 ✨')
      setPwd({ oldPassword: '', newPassword: '', confirm: '' })
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="profile">
      <div className="avatar">💕</div>
      <h1 className="profile-name">{user.nickname}</h1>

      <div className="info-card">
        <div className="info-row">
          <span className="info-label">用户名</span>
          <span className="info-value">{user.username}</span>
        </div>
        <div className="info-row">
          <span className="info-label">昵称</span>
          <span className="info-value">{user.nickname}</span>
        </div>
        <div className="info-row">
          <span className="info-label">配对状态</span>
          <span className="info-value">
            {user.couple_id ? '已配对 💑' : '未配对'}
            {!user.couple_id && (
              <button className="link-btn" onClick={() => nav('/pair')}>去配对</button>
            )}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">注册时间</span>
          <span className="info-value">{fmtDate(user.created_at)}</span>
        </div>
      </div>

      {user.couple_id && (
        <>
          <h2 className="section-title">💞 在一起的日子</h2>
          <div className="form anni-form">
            <label>你们在一起的纪念日（首页会显示在一起第几天）</label>
            <input type="date" value={anniversary}
              onChange={(e) => setAnniversary(e.target.value)} />
            {anniMsg && <div className="success">{anniMsg}</div>}
            <button type="button" className="btn-primary" onClick={saveAnniversary}>保存纪念日</button>
          </div>

          <h2 className="section-title">🎂 我的生日</h2>
          <div className="form anni-form">
            <label>设置你的生日（首页会显示距下次生日还有几天）</label>
            <input type="date" value={birthday}
              onChange={(e) => setBirthday(e.target.value)} />
            {bdMsg && <div className="success">{bdMsg}</div>}
            <button type="button" className="btn-primary" onClick={saveBirthday}>保存生日</button>
          </div>
        </>
      )}

      <h2 className="section-title">🔒 修改密码</h2>
      <form onSubmit={changePassword} className="form">
        <label>旧密码</label>
        <input type="password" value={pwd.oldPassword}
          onChange={(e) => set('oldPassword', e.target.value)} placeholder="输入当前密码" />

        <label>新密码</label>
        <input type="password" value={pwd.newPassword}
          onChange={(e) => set('newPassword', e.target.value)} placeholder="至少 6 位" />

        <label>确认新密码</label>
        <input type="password" value={pwd.confirm}
          onChange={(e) => set('confirm', e.target.value)} placeholder="再输入一次新密码" />

        {err && <div className="error">{err}</div>}
        {ok && <div className="success">{ok}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '修改中…' : '修改密码'}
        </button>
      </form>

      <button className="btn-ghost logout-btn" onClick={logout}>退出登录</button>
    </div>
  )
}
