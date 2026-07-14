import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Pairing() {
  const { user, updateUser } = useAuth()
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [myCode, setMyCode] = useState(null)
  const [partner, setPartner] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.partner().then((d) => setPartner(d.partner)).catch(() => {})
  }, [user])

  async function genCode() {
    setErr('')
    try {
      const d = await api.genPairCode()
      setMyCode(d.pair_code)
      updateUser(d.user)
    } catch (e) {
      setErr(e.message)
    }
  }

  async function pair() {
    setErr('')
    setLoading(true)
    try {
      const d = await api.pair(code)
      updateUser(d.user)
      setPartner(d.partner)
      setTimeout(() => nav('/home'), 800)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // 已配对
  if (user?.couple_id && partner) {
    return (
      <div className="card">
        <div className="paired-heart">💞</div>
        <h2>配对成功！</h2>
        <p>你和 <b>{partner.nickname}</b> 已经绑定啦</p>
        <button className="btn-primary" onClick={() => nav('/home')}>去看看</button>
      </div>
    )
  }

  return (
    <div className="pairing">
      <h1>💑 配对另一半</h1>
      <p className="subtitle">和 Ta 绑定后，就能互相发送约会邀请啦</p>

      <div className="card">
        <h3>方式一：我生成配对码</h3>
        <p className="hint">生成后把码告诉 Ta，让 Ta 在 Ta 的账号里输入</p>
        {myCode ? (
          <div className="code-box">
            <div className="code">{myCode}</div>
            <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(myCode) }}>复制</button>
          </div>
        ) : (
          <button className="btn-primary" onClick={genCode}>生成配对码</button>
        )}
      </div>

      <div className="card">
        <h3>方式二：输入 Ta 的配对码</h3>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="6 位配对码"
          maxLength={6}
          className="code-input"
        />
        <button className="btn-primary" onClick={pair} disabled={loading || code.length !== 6}>
          {loading ? '绑定中…' : '绑定'}
        </button>
        {err && <div className="error">{err}</div>}
      </div>
    </div>
  )
}
