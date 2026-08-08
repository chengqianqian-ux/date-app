const express = require('express')
const { pool } = require('../db')
const { authRequired } = require('../auth')

const router = express.Router()

// 拉取消息：afterId 之后的增量（用于轮询拿新消息），不传则拉最近 50 条
router.get('/', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.json({ messages: [] })
  const afterId = parseInt(req.query.after, 10) || 0
  try {
    const { rows } = await pool.query(`
      SELECT m.id, m.user_id, u.nickname AS nickname, m.content,
             to_char(m.created_at, 'YYYY-MM-DD HH24:MI') AS created_at
      FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.couple_id = $1 AND m.id > $2
      ORDER BY m.id ASC
      LIMIT 100
    `, [req.user.couple_id, afterId])
    res.json({ messages: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '查询失败' })
  }
})

// 发送消息
router.post('/', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.status(400).json({ error: '请先完成配对' })
  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ error: '内容不能为空' })
  if (content.length > 500) return res.status(400).json({ error: '消息太长啦（500 字以内）' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (couple_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING id, content,
         to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at`,
      [req.user.couple_id, req.user.id, content.trim()]
    )
    res.json({
      message: { ...rows[0], user_id: req.user.id, nickname: req.user.nickname },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '发送失败' })
  }
})

module.exports = router
