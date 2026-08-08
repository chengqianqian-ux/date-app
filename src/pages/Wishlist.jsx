import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const TYPES = ['吃饭', '看电影', '散步', '咖啡', '旅行', '其他']
const TYPE_EMOJI = { '吃饭': '🍜', '看电影': '🎬', '散步': '🚶', '咖啡': '☕', '旅行': '✈️', '其他': '🎀' }

export default function Wishlist() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ title: '', type: '吃饭', location: '', note: '' })

  async function load() {
    try {
      const d = await api.listWishlist()
      setItems(d.items)
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => { load() }, [])

  function set(k, v) { setForm({ ...form, [k]: v }) }

  async function add(e) {
    e.preventDefault()
    setErr('')
    if (!form.title.trim()) { setErr('想做什么呢？'); return }
    try {
      await api.addWishlist(form)
      setForm({ title: '', type: '吃饭', location: '', note: '' })
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  async function del(id) {
    try {
      await api.deleteWishlist(id)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  async function toggle(id) {
    try {
      await api.toggleWishlist(id)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  // 用这个心愿发起邀请
  function useForInvite(item) {
    nav('/new', { state: { fromWishlist: item } })
  }

  if (!user?.couple_id) {
    return (
      <div className="card center">
        <div style={{ fontSize: 48 }}>📝</div>
        <h2>还没配对哦</h2>
        <button className="btn-primary" onClick={() => nav('/pair')}>去配对</button>
      </div>
    )
  }

  return (
    <div className="wishlist">
      <h1>📝 约会心愿单</h1>
      <p className="subtitle">把想一起做的事记下来，发邀请时一键选用</p>

      <form onSubmit={add} className="form">
        <label>想做点什么</label>
        <input value={form.title} onChange={(e) => set('title', e.target.value)}
          placeholder="例：去试那家新开的日料" />

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

        <label>地点（选填）</label>
        <input value={form.location} onChange={(e) => set('location', e.target.value)}
          placeholder="例：XXX 餐厅" />

        <label>备注（选填）</label>
        <input value={form.note} onChange={(e) => set('note', e.target.value)}
          placeholder="留个言吧～" />

        {err && <div className="error">{err}</div>}
        <button type="submit" className="btn-primary">添加心愿 ✨</button>
      </form>

      <div className="wish-list">
        {items.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji">🌱</div>
            <p>心愿单还是空的，加一个吧</p>
          </div>
        ) : (
          items.map((it) => (
            <div key={it.id} className={`wish-card ${it.done ? 'done' : ''}`}>
              <div className="wish-head">
                <span className="inv-emoji">{TYPE_EMOJI[it.type] || '🎀'}</span>
                <div className="wish-title-wrap">
                  <div className="wish-title">{it.title}</div>
                  <div className="inv-meta">
                    {it.from_nickname} 添加{it.location ? ` · 📍 ${it.location}` : ''}
                  </div>
                  {it.note && <div className="inv-note">💬 {it.note}</div>}
                </div>
              </div>
              <div className="wish-actions">
                {!it.done && (
                  <button className="btn-use" onClick={() => useForInvite(it)}>发邀请</button>
                )}
                <button className="btn-ghost" onClick={() => toggle(it.id)}>
                  {it.done ? '↩ 撤销' : '✓ 完成'}
                </button>
                <button className="btn-del" onClick={() => del(it)}>删除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
