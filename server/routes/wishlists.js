const express = require('express')
const { pool } = require('../db')
const { authRequired } = require('../auth')

const router = express.Router()

// 列表：这对情侣的心愿单
router.get('/', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.json({ items: [] })
  try {
    const { rows } = await pool.query(`
      SELECT w.*, u.nickname AS from_nickname
      FROM wishlists w JOIN users u ON u.id = w.user_id
      WHERE w.couple_id = $1
      ORDER BY w.done ASC, w.created_at DESC
    `, [req.user.couple_id])
    res.json({ items: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '查询失败' })
  }
})

// 新增心愿
router.post('/', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.status(400).json({ error: '请先完成配对' })
  const { title, type, location, note } = req.body
  if (!title) return res.status(400).json({ error: '标题必填' })
  try {
    const { rows } = await pool.query(`
      INSERT INTO wishlists (couple_id, user_id, title, type, location, note)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [req.user.couple_id, req.user.id, title, type || null, location || null, note || null])
    res.json({ item: rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '添加失败' })
  }
})

// 删除心愿
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM wishlists WHERE id = $1', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: '心愿不存在' })
    if (r.rows[0].couple_id !== req.user.couple_id) return res.status(403).json({ error: '无权操作' })
    await pool.query('DELETE FROM wishlists WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '删除失败' })
  }
})

// 标记完成/未完成
router.post('/:id/toggle', authRequired, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM wishlists WHERE id = $1', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: '心愿不存在' })
    if (r.rows[0].couple_id !== req.user.couple_id) return res.status(403).json({ error: '无权操作' })
    const upd = await pool.query(
      'UPDATE wishlists SET done = NOT done WHERE id = $1 RETURNING *', [req.params.id]
    )
    res.json({ item: upd.rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '操作失败' })
  }
})

module.exports = router
