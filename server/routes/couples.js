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

// 获取纪念日（在一起的日子）—— 用 to_char 直接返回 YYYY-MM-DD，避开时区偏移
router.get('/anniversary', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.json({ anniversary: null })
  try {
    const { rows } = await pool.query(
      `SELECT to_char(anniversary, 'YYYY-MM-DD') AS anniversary FROM couples WHERE id = $1`,
      [req.user.couple_id]
    )
    res.json({ anniversary: rows[0]?.anniversary || null })
  } catch (e) {
    res.status(500).json({ error: '查询失败' })
  }
})

// 设置纪念日（任一方都能设）
router.post('/anniversary', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.status(400).json({ error: '请先完成配对' })
  const { anniversary } = req.body
  if (!anniversary) return res.status(400).json({ error: '请选择日期' })
  try {
    await pool.query('UPDATE couples SET anniversary = $1 WHERE id = $2',
      [anniversary, req.user.couple_id])
    res.json({ anniversary })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '保存失败' })
  }
})

// 获取双方生日（mine = 我的，partner = 对方的，YYYY-MM-DD）
router.get('/birthdays', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.json({ mine: null, partner: null })
  try {
    const members = await pool.query(
      'SELECT id FROM users WHERE couple_id = $1 ORDER BY id ASC', [req.user.couple_id]
    )
    const c = (await pool.query(
      `SELECT to_char(birthday_a,'YYYY-MM-DD') AS ba,
              to_char(birthday_b,'YYYY-MM-DD') AS bb FROM couples WHERE id = $1`,
      [req.user.couple_id]
    )).rows[0] || {}
    const firstId = members.rows[0]?.id
    const mineCol = firstId === req.user.id ? c.ba : c.bb
    const partnerCol = firstId === req.user.id ? c.bb : c.ba
    res.json({ mine: mineCol || null, partner: partnerCol || null })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '查询失败' })
  }
})

// 设置我的生日
router.post('/birthday', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.status(400).json({ error: '请先完成配对' })
  const { birthday } = req.body
  if (!birthday) return res.status(400).json({ error: '请选择日期' })
  try {
    const members = await pool.query(
      'SELECT id FROM users WHERE couple_id = $1 ORDER BY id ASC', [req.user.couple_id]
    )
    const col = members.rows[0]?.id === req.user.id ? 'birthday_a' : 'birthday_b'
    await pool.query(`UPDATE couples SET ${col} = $1 WHERE id = $2`,
      [birthday, req.user.couple_id])
    res.json({ birthday })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '保存失败' })
  }
})

// 每日情话（服务端内置池，按日期固定取一条，同一天两人看到一样的）
const LOVE_QUOTES = [
  '今天也是喜欢你的一天 💕', '愿有岁月可回首，且以深情共白头',
  '你是我所有的不知所措，也是我所有的理所应当', '想和你一起，把日子过成诗',
  '世间万物，唯有你是我疲惫生活的英雄梦想', '往后余生，风雪是你，平淡也是你',
  '你笑起来真像好天气', '我见青山多妩媚，料青山见我应如是',
  '愿你迷路一生，还是走到我身旁', '春风十里，不如你',
  '我想和你一起生活，在某个小镇，共享无尽的黄昏', '你是我的半截诗，不讲究韵脚',
  '所爱隔山海，山海皆可平', '我贪恋的人间烟火，不偏不倚恰好是你',
  '你是我绕过山河错落，才找到的人间烟火',
]
router.get('/quote', authRequired, async (req, res) => {
  // 按一年中的第几天取，保证当天稳定
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const q = LOVE_QUOTES[dayOfYear % LOVE_QUOTES.length]
  res.json({ quote: q })
})

module.exports = router
