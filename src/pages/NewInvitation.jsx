import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const TYPES = ['吃饭', '看电影', '散步', '咖啡', '旅行', '其他']
const TYPE_EMOJI = { '吃饭': '🍜', '看电影': '🎬', '散步': '🚶', '咖啡': '☕', '旅行': '✈️', '其他': '🎀' }

// 留言可快速插入的可爱表情
const STICKERS = ['💕', '💖', '😘', '🥰', '🌹', '🍫', '✨', '🥳', '答应我嘛', '想见你', '等你哦']

export default function NewInvitation() {
  const { user } = useAuth()
  const nav = useNavigate()
  const location = useLocation()

  // 从心愿单一键选用：带过来预填表单
  const fromWish = location.state?.fromWishlist

  const [form, setForm] = useState({
    title: fromWish?.title || '',
    type: fromWish?.type || '吃饭',
    meet_time: '',
    location: fromWish?.location || '',
    note: fromWish?.note || '',
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm({ ...form, [k]: v }) }

  function addSticker(s) {
    set('note', (form.note ? form.note + ' ' : '') + s)
  }

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (!form.title.trim()) { setErr('给约会起个标题吧'); return }
    setLoading(true)
    try {
      await api.createInvitation({
        ...form,
        meet_time: form.meet_time || null,
      })
      nav('/home')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user?.couple_id) {
    return (
      <div className="card center">
        <h2>还没配对哦</h2>
        <button className="btn-primary" onClick={() => nav('/pair')}>去配对</button>
      </div>
    )
  }

  return (
    <div className="new-inv">
      <h1>💌 发起约会邀请</h1>
      {fromWish && <div className="success">从心愿单选用：{fromWish.title}</div>}
      <form onSubmit={submit} className="form">
        <label>标题</label>
        <input value={form.title} onChange={(e) => set('title', e.target.value)}
          placeholder="例：周末一起吃火锅" />

        <label>类型</label>
        <div className="type-picker">
          {TYPES.map((t) => (
            <button type="button" key={t}
              className={`type-chip ${form.type === t ? 'active' : ''}`}
              onClick={() => set('type', t)}>
              {TYPE_EMOJI[t]} {t}
            </button>
          ))}
        </div>

        <label>时间</label>
        <input type="datetime-local" value={form.meet_time}
          onChange={(e) => set('meet_time', e.target.value)} />

        <label>地点</label>
        <input value={form.location} onChange={(e) => set('location', e.target.value)}
          placeholder="例：海底捞 朝阳大悦城店" />

        <label>想说的话</label>
        <textarea value={form.note} onChange={(e) => set('note', e.target.value)}
          placeholder="留个言吧～" rows={3} />
        <div className="sticker-picker">
          {STICKERS.map((s) => (
            <button type="button" key={s} className="sticker"
              onClick={() => addSticker(s)}>{s}</button>
          ))}
        </div>

        {err && <div className="error">{err}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '发送中…' : '发送邀请 💕'}
        </button>
      </form>
    </div>
  )
}
