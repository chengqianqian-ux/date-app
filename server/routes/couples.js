const express = require('express')
const crypto = require('crypto')
const { pool } = require('../db')
const { authRequired } = require('../auth')

const router = express.Router()

function genCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6)
}

// 生成配对码
router.post('/code', authRequired, async (req, res) => {
  if (req.user.couple_id) {
    return res.status(400).json({ error: '你已经配对过了' })
  }
  try {
    let code
    for (let i = 0; i < 10; i++) {
      code = genCode()
      const r = await pool.query('SELECT id FROM couples WHERE pair_code = $1', [code])
      if (r.rows.length === 0) break
    }
    const { rows } = await pool.query(
      'INSERT INTO couples (pair_code) VALUES ($1) RETURNING id', [code]
    )
    const coupleId = rows[0].id
    await pool.query('UPDATE users SET couple_id = $1 WHERE id = $2', [coupleId, req.user.id])
    const u = await pool.query(
      'SELECT id, username, nickname, couple_id FROM users WHERE id = $1', [req.user.id]
    )
    res.json({ pair_code: code, user: u.rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '生成配对码失败' })
  }
})

// 用配对码绑定
router.post('/pair', authRequired, async (req, res) => {
  const { pair_code } = req.body
  if (!pair_code) return res.status(400).json({ error: '请输入配对码' })
  if (req.user.couple_id) return res.status(400).json({ error: '你已经配对过了' })

  try {
    const c = await pool.query('SELECT * FROM couples WHERE pair_code = $1', [pair_code.toUpperCase()])
    if (c.rows.length === 0) return res.status(400).json({ error: '配对码不存在' })
    const couple = c.rows[0]

    const m = await pool.query('SELECT id FROM users WHERE couple_id = $1', [couple.id])
    if (m.rows.length >= 2) return res.status(400).json({ error: '这个配对码已经绑定了两个人' })
    if (m.rows.length === 1 && m.rows[0].id === req.user.id) {
      return res.status(400).json({ error: '不能和自己配对' })
    }

    await pool.query('UPDATE users SET couple_id = $1 WHERE id = $2', [couple.id, req.user.id])
    const u = await pool.query(
      'SELECT id, username, nickname, couple_id FROM users WHERE id = $1', [req.user.id]
    )
    const p = await pool.query(
      'SELECT id, username, nickname FROM users WHERE couple_id = $1 AND id != $2',
      [couple.id, req.user.id]
    )
    res.json({ user: u.rows[0], partner: p.rows[0] || null })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '配对失败' })
  }
})

// 获取另一半
router.get('/partner', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.json({ partner: null })
  try {
    const { rows } = await pool.query(
      'SELECT id, username, nickname FROM users WHERE couple_id = $1 AND id != $2',
      [req.user.couple_id, req.user.id]
    )
    res.json({ partner: rows[0] || null })
  } catch (e) {
    res.status(500).json({ error: '查询失败' })
  }
})

module.exports = router
