import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const TYPE_EMOJI = {
  '吃饭': '🍜', '看电影': '🎬', '散步': '🚶', '旅行': '✈️', '咖啡': '☕', '其他': '🎀',
}

const MOOD_EMOJI = {
  happy: '😊', excited: '🥳', sweet: '🥰', calm: '😌', tired: '😴', rainy: '🌧️',
}

const STATUS_LABEL = {
  pending: '待回复', accepted: '已接受', rejected: '已拒绝', cancelled: '已取消', completed: '已完成',
}

function fmtTime(t) {
  if (!t) return '时间待定'
  return t.replace('T', ' ').slice(0, 16)
}

// 计算距今还有几天（负数=已过去）
function daysUntil(t) {
  if (!t) return null
  const target = new Date(t.replace(' ', 'T'))
  if (isNaN(target)) return null
  const now = new Date()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

// 在一起第几天
function daysTogether(anniversary) {
  if (!anniversary) return null
  const start = new Date(anniversary)
  if (isNaN(start)) return null
  return Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)) + 1
}

// 距下次生日还有几天（按月日算，忽略年份）
function daysToNextBirthday(dateStr) {
  if (!dateStr) return null
  const now = new Date()
  const m = parseInt(dateStr.slice(5, 7), 10) - 1
  const d = parseInt(dateStr.slice(8, 10), 10)
  if (isNaN(m) || isNaN(d)) return null
  let next = new Date(now.getFullYear(), m, d)
  if (next < now) next = new Date(now.getFullYear() + 1, m, d)
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24))
}

function InvitationCard({ inv, received, onAction, onMoodChange }) {
  const canComplete = inv.status === 'accepted'
  return (
    <div className={`inv-card status-${inv.status}`}>
      <div className="inv-head">
        <span className="inv-emoji">{TYPE_EMOJI[inv.type] || '🎀'}</span>
        <div className="inv-title-wrap">
          <div className="inv-title">{inv.title}</div>
          <div className="inv-meta">
            {received ? `来自 ${inv.from_nickname}` : `发给 ${inv.to_nickname}`}
            {' · '}{inv.type}
          </div>
        </div>
        <span className={`status-badge ${inv.status}`}>{STATUS_LABEL[inv.status]}</span>
      </div>
      <div className="inv-body">
        <div>📅 {fmtTime(inv.meet_time)}</div>
        {inv.location && <div>📍 {inv.location}</div>}
        {inv.note && <div className="inv-note">💬 {inv.note}</div>}
      </div>
      {received && inv.status === 'pending' && (
        <div className="inv-actions">
          <button className="btn-accept" onClick={() => onAction(inv.id, 'accept')}>接受 💖</button>
          <button className="btn-reject" onClick={() => onAction(inv.id, 'reject')}>婉拒</button>
        </div>
      )}
      {!received && inv.status === 'pending' && (
        <div className="inv-actions">
          <button className="btn-ghost" onClick={() => onAction(inv.id, 'cancel')}>取消邀请</button>
        </div>
      )}
      {canComplete && (
        <div className="inv-actions complete-row">
          <span className="complete-label">心情：</span>
          {['happy', 'sweet', 'excited', 'calm', 'tired'].map((m) => (
            <button key={m} type="button" className={`mood-chip ${inv._mood === m ? 'active' : ''}`}
              onClick={() => onMoodChange(inv.id, m)}>
              {MOOD_EMOJI[m]}
            </button>
          ))}
          <button className="btn-complete" onClick={() => onAction(inv.id, 'complete')}>✓ 打卡完成</button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('received')
  const [data, setData] = useState({ received: [], sent: [], completedCount: 0 })
  const [anniversary, setAnniversary] = useState(null)
  const [quote, setQuote] = useState('')
  const [birthdays, setBirthdays] = useState({ mine: null, partner: null })
  const [err, setErr] = useState('')
  // 临时保存用户在卡片上选的心情（inv.id -> mood），未提交前不持久化
  const [moodMap, setMoodMap] = useState({})

  async function load() {
    try {
      const [d, a, q, b] = await Promise.all([
        api.listInvitations(), api.getAnniversary(), api.getQuote(), api.getBirthdays(),
      ])
      setData(d)
      setAnniversary(a.anniversary)
      setQuote(q.quote)
      setBirthdays(b)
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => { load() }, [])

  function onMoodChange(invId, mood) {
    setMoodMap((prev) => ({ ...prev, [invId]: mood }))
  }

  async function onAction(id, action) {
    setErr('')
    try {
      if (action === 'cancel') await api.cancel(id)
      else if (action === 'complete') await api.complete(id, moodMap[id])
      else await api.respond(id, action)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  if (!user?.couple_id) {
    return (
      <div className="card center">
        <div style={{ fontSize: 48 }}>💌</div>
        <h2>还没配对哦</h2>
        <p>先和另一半绑定，才能发送约会邀请</p>
        <button className="btn-primary" onClick={() => nav('/pair')}>去配对</button>
      </div>
    )
  }

  const list = tab === 'received' ? data.received : data.sent
  const pendingReceived = data.received.filter((i) => i.status === 'pending').length

  // 找下一个即将到来的已接受约会
  const upcoming = [...data.received, ...data.sent]
    .filter((i) => i.status === 'accepted' && daysUntil(i.meet_time) !== null && daysUntil(i.meet_time) >= 0)
    .sort((a, b) => daysUntil(a.meet_time) - daysUntil(b.meet_time))[0]
  const upDays = upcoming ? daysUntil(upcoming.meet_time) : null

  const together = daysTogether(anniversary)

  // 距下一个生日还有几天（mine / partner 中较早且未过的）
  const nextBirthday = [birthdays.mine, birthdays.partner]
    .filter(Boolean)
    .map((d) => ({ d, days: daysToNextBirthday(d) }))
    .filter((x) => x.days !== null)
    .sort((a, b) => a.days - b.days)[0]

  return (
    <div className="home">
      {/* 每日情话 */}
      {quote && <div className="quote-bar">💌 {quote}</div>}

      {/* 纪念日 + 倒计时横幅 */}
      <div className="banner">
        {together ? (
          <div className="banner-row">💞 在一起第 <b>{together}</b> 天</div>
        ) : (
          <button className="banner-set" onClick={() => nav('/profile')}>设置在一起的日子 →</button>
        )}
        {nextBirthday && (
          <div className="banner-row">
            {nextBirthday.days === 0
              ? '🎂 今天是生日！'
              : `🎂 距下次生日还有 ${nextBirthday.days} 天`}
          </div>
        )}
        {upDays !== null && (
          <div className="banner-row">
            {upDays === 0
              ? `🎉 今天有约会：${upcoming.title}`
              : `⏰ 距「${upcoming.title}」还有 ${upDays} 天`}
          </div>
        )}
        {data.completedCount > 0 && (
          <div className="banner-row banner-soft">
            🌸 我们已经一起赴约 {data.completedCount} 次啦
            <button className="banner-link" onClick={() => nav('/timeline')}>看回忆 →</button>
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={tab === 'received' ? 'active' : ''} onClick={() => setTab('received')}>
          收到的 ({data.received.length})
          {pendingReceived > 0 && <span className="red-dot">{pendingReceived}</span>}
        </button>
        <button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>
          发出的 ({data.sent.length})
        </button>
      </div>

      {err && <div className="error">{err}</div>}

      {list.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🌷</div>
          <p>{tab === 'received' ? '还没有收到邀请' : '还没有发出邀请'}</p>
          <Link to="/new" className="btn-primary">发起一个约会</Link>
        </div>
      ) : (
        <div className="inv-list">
          {list.map((inv) => (
            <InvitationCard key={inv.id} inv={{ ...inv, _mood: moodMap[inv.id] }}
              received={tab === 'received'} onAction={onAction} onMoodChange={onMoodChange} />
          ))}
        </div>
      )}
    </div>
  )
}
