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

// 当前用户
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
