import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const lastIdRef = useRef(0)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  // 初次拉历史
  async function loadAll() {
    try {
      const d = await api.listMessages()
      setMessages(d.messages)
      const last = d.messages[d.messages.length - 1]
      lastIdRef.current = last?.id || 0
      scrollToBottom()
    } catch (e) {
      setErr(e.message)
    }
  }

  // 轮询拉增量（每 2.5s），页面切到后台时暂停
  async function pollNew() {
    try {
      const d = await api.listMessages(lastIdRef.current)
      if (d.messages.length) {
        setMessages((prev) => [...prev, ...d.messages])
        const last = d.messages[d.messages.length - 1]
        lastIdRef.current = last?.id || lastIdRef.current
        scrollToBottom()
      }
    } catch { /* 静默，下次重试 */ }
  }

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  useEffect(() => {
    if (!user?.couple_id) return
    loadAll()
    pollRef.current = setInterval(pollNew, 2500)
    const onVis = () => {
      if (document.hidden) clearInterval(pollRef.current)
      else { pollNew(); pollRef.current = setInterval(pollNew, 2500) }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(pollRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [user])

  async function send(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    try {
      const d = await api.sendMessage(content)
      setMessages((prev) => [...prev, d.message])
      lastIdRef.current = d.message.id
      scrollToBottom()
    } catch (e) {
      setErr(e.message)
      setText(content)
    }
  }

  if (!user?.couple_id) {
    return (
      <div className="card center">
        <div style={{ fontSize: 48 }}>💬</div>
        <h2>还没配对哦</h2>
        <button className="btn-primary" onClick={() => nav('/pair')}>去配对</button>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="chat-head">💬 我们的悄悄话</div>
      <div className="chat-body">
        {messages.length === 0 && (
          <div className="chat-empty">还没有消息，跟 Ta 说点什么吧～</div>
        )}
        {messages.map((m) => {
          const mine = m.user_id === user.id
          return (
            <div key={m.id} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
              {!mine && <div className="msg-nick">{m.nickname}</div>}
              <div className="msg-bubble">{m.content}</div>
              <div className="msg-time">{m.created_at}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="chat-input-bar">
        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder="说点什么…" maxLength={500}
          // 回车发送（手机端可能换行，这里保留默认行为）
        />
        <button type="submit" className="btn-primary chat-send">发送</button>
      </form>
      {err && <div className="error chat-err">{err}</div>}
    </div>
  )
}
