const express = require('express')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')
const { signToken, authRequired } = require('../auth')

const router = express.Router()

// 注册
router.post('/register', async (req, res) => {
  const { username, password, nickname } = req.body
  if (!username || !password || !nickname) {
    return res.status(400).json({ error: '用户名、密码、昵称都不能为空' })
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度 2-20' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' })
  }
  try {
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (exists.rows.length) return res.status(400).json({ error: '用户名已被占用' })

    const hash = bcrypt.hashSync(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, nickname)
       VALUES ($1, $2, $3)
       RETURNING id, username, nickname, couple_id`,
      [username, hash, nickname]
    )
    const user = rows[0]
    const token = signToken(user)
    res.json({ token, user })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '注册失败' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' })
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (rows.length === 0) return res.status(400).json({ error: '用户名或密码错误' })
    const row = rows[0]
    if (!bcrypt.compareSync(password, row.password_hash)) {
      return res.status(400).json({ error: '用户名或密码错误' })
    }
    const user = { id: row.id, username: row.username, nickname: row.nickname, couple_id: row.couple_id }
    const token = signToken(user)
    res.json({ token, user })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '登录失败' })
  }
})

// 当前用户（附带注册时间，用于个人中心展示）
router.get('/me', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, nickname, couple_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    if (rows.length === 0) return res.status(401).json({ error: '用户不存在' })
    res.json({ user: rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '查询失败' })
  }
})

// 修改密码（验证旧密码后写入新密码）
router.post('/change-password', authRequired, async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请输入旧密码和新密码' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少 6 位' })
  }
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    if (rows.length === 0) return res.status(401).json({ error: '用户不存在' })
    if (!bcrypt.compareSync(oldPassword, rows[0].password_hash)) {
      return res.status(400).json({ error: '旧密码不正确' })
    }
    const newHash = bcrypt.hashSync(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '修改失败' })
  }
})

module.exports = router
