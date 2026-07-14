import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const TYPE_EMOJI = {
  '吃饭': '🍜', '看电影': '🎬', '散步': '🚶', '旅行': '✈️', '咖啡': '☕', '其他': '🎀',
}

const STATUS_LABEL = {
  pending: '待回复', accepted: '已接受', rejected: '已拒绝', cancelled: '已取消',
}

function fmtTime(t) {
  if (!t) return '时间待定'
  return t.replace('T', ' ').slice(0, 16)
}

function InvitationCard({ inv, received, onAction }) {
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
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('received')
  const [data, setData] = useState({ received: [], sent: [] })
  const [err, setErr] = useState('')

  async function load() {
    try {
      const d = await api.listInvitations()
      setData(d)
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => { load() }, [])

  async function onAction(id, action) {
    setErr('')
    try {
      if (action === 'cancel') await api.cancel(id)
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

  return (
    <div className="home">
      <div className="tabs">
        <button className={tab === 'received' ? 'active' : ''} onClick={() => setTab('received')}>
          收到的 ({data.received.length})
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
            <InvitationCard key={inv.id} inv={inv} received={tab === 'received'} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  )
}
