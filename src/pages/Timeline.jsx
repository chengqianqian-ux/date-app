import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const TYPE_EMOJI = {
  '吃饭': '🍜', '看电影': '🎬', '散步': '🚶', '旅行': '✈️', '咖啡': '☕', '其他': '🎀',
}
const MOOD_EMOJI = {
  happy: '😊', excited: '🥳', sweet: '🥰', calm: '😌', tired: '😴', rainy: '🌧️',
}
const MOOD_LABEL = {
  happy: '开心', excited: '兴奋', sweet: '甜蜜', calm: '平静', tired: '有点累', rainy: '小确丧',
}

function fmtDate(t) {
  if (!t) return ''
  return String(t).replace('T', ' ').slice(0, 16)
}

export default function Timeline() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  // 编辑小记的状态
  const [editing, setEditing] = useState(null)
  const [diaryText, setDiaryText] = useState('')

  async function load() {
    try {
      const d = await api.timeline()
      setItems(d.items)
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => { load() }, [])

  async function saveDiary(id) {
    if (!diaryText.trim()) { setErr('写点什么吧'); return }
    try {
      await api.writeDiary(id, diaryText)
      setEditing(null)
      setDiaryText('')
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  if (!user?.couple_id) {
    return (
      <div className="card center">
        <div style={{ fontSize: 48 }}>📖</div>
        <h2>还没配对哦</h2>
        <button className="btn-primary" onClick={() => nav('/pair')}>去配对</button>
      </div>
    )
  }

  return (
    <div className="timeline-page">
      <h1 className="tl-title">📖 我们的回忆</h1>
      <p className="subtitle">一共 {items.length} 次赴约</p>

      {err && <div className="error">{err}</div>}

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🌱</div>
          <p>还没有完成的约会</p>
          <p className="hint">接受邀请后打卡完成，就会出现在这里啦</p>
        </div>
      ) : (
        <div className="tl-list">
          {items.map((it, idx) => (
            <div key={it.id} className="tl-item">
              <div className="tl-dot">{TYPE_EMOJI[it.type] || '🎀'}</div>
              <div className="tl-card">
                <div className="tl-head">
                  <span className="tl-no">第 {items.length - idx} 次</span>
                  <span className="tl-date">{fmtDate(it.responded_at) || fmtDate(it.meet_time)}</span>
                </div>
                <div className="tl-event">{it.title}</div>
                <div className="tl-meta">
                  {it.from_nickname} → {it.to_nickname}
                  {it.location && ` · 📍 ${it.location}`}
                  {it.mood && <> · {MOOD_EMOJI[it.mood] || '✨'} {MOOD_LABEL[it.mood] || it.mood}</>}
                </div>
                {it.meet_time && <div className="tl-time">📅 {fmtDate(it.meet_time)}</div>}

                <div className="tl-diary">
                  {editing === it.id ? (
                    <div className="diary-edit">
                      <textarea value={diaryText} onChange={(e) => setDiaryText(e.target.value)}
                        placeholder="写下这一天的感受…" rows={3} autoFocus />
                      <div className="diary-actions">
                        <button className="btn-primary" onClick={() => saveDiary(it.id)}>保存</button>
                        <button className="btn-ghost" onClick={() => { setEditing(null); setDiaryText('') }}>取消</button>
                      </div>
                    </div>
                  ) : it.diary ? (
                    <div className="diary-text">📝 {it.diary}
                      <button className="link-btn" onClick={() => { setEditing(it.id); setDiaryText(it.diary) }}>编辑</button>
                    </div>
                  ) : (
                    <button className="link-btn diary-add" onClick={() => { setEditing(it.id); setDiaryText('') }}>
                      ✏️ 写今日小记
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
