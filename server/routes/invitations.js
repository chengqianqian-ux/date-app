const express = require('express')
const { pool } = require('../db')
const { authRequired } = require('../auth')

const router = express.Router()

// 列表：收到的 + 发出的
router.get('/', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.json({ received: [], sent: [] })
  try {
    const received = await pool.query(`
      SELECT i.*, u.nickname AS from_nickname
      FROM invitations i JOIN users u ON u.id = i.from_user_id
      WHERE i.to_user_id = $1 ORDER BY i.created_at DESC
    `, [req.user.id])
    const sent = await pool.query(`
      SELECT i.*, u.nickname AS to_nickname
      FROM invitations i JOIN users u ON u.id = i.to_user_id
      WHERE i.from_user_id = $1 ORDER BY i.created_at DESC
    `, [req.user.id])
    res.json({ received: received.rows, sent: sent.rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '查询失败' })
  }
})

// 创建
router.post('/', authRequired, async (req, res) => {
  if (!req.user.couple_id) return res.status(400).json({ error: '请先完成配对' })
  const { title, type, meet_time, location, note } = req.body
  if (!title || !type) return res.status(400).json({ error: '标题和类型必填' })

  try {
    const p = await pool.query(
      'SELECT id FROM users WHERE couple_id = $1 AND id != $2',
      [req.user.couple_id, req.user.id]
    )
    if (p.rows.length === 0) return res.status(400).json({ error: '另一半未绑定' })
    const partnerId = p.rows[0].id

    const { rows } = await pool.query(`
      INSERT INTO invitations (couple_id, from_user_id, to_user_id, title, type, meet_time, location, note)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.couple_id, req.user.id, partnerId, title, type, meet_time || null, location || null, note || null])

    res.json({ invitation: rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '创建失败' })
  }
})

// 响应：accept / reject
router.post('/:id/respond', authRequired, async (req, res) => {
  const { action } = req.body
  try {
    const r = await pool.query('SELECT * FROM invitations WHERE id = $1', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: '邀请不存在' })
    const inv = r.rows[0]
    if (inv.to_user_id !== req.user.id) return res.status(403).json({ error: '只能响应发给自己的邀请' })
    if (inv.status !== 'pending') return res.status(400).json({ error: '该邀请已处理' })

    const status = action === 'accept' ? 'accepted' : 'rejected'
    const upd = await pool.query(
      `UPDATE invitations SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, inv.id]
    )
    res.json({ invitation: upd.rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '操作失败' })
  }
})

// 取消
router.post('/:id/cancel', authRequired, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM invitations WHERE id = $1', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: '邀请不存在' })
    const inv = r.rows[0]
    if (inv.from_user_id !== req.user.id) return res.status(403).json({ error: '只能取消自己发出的邀请' })
    if (inv.status !== 'pending') return res.status(400).json({ error: '该邀请已处理，无法取消' })

    const upd = await pool.query(
      `UPDATE invitations SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [inv.id]
    )
    res.json({ invitation: upd.rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '操作失败' })
  }
})

module.exports = router
