const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('./db')

const SECRET = process.env.JWT_SECRET || 'date-app-dev-secret-change-me'

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' })
}

// 鉴权中间件（异步）
async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: '未登录' })
    const payload = jwt.verify(token, SECRET)
    const { rows } = await pool.query(
      'SELECT id, username, nickname, couple_id FROM users WHERE id = $1', [payload.id]
    )
    if (rows.length === 0) return res.status(401).json({ error: '用户不存在' })
    req.user = rows[0]
    next()
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' })
  }
}

module.exports = { bcrypt, signToken, authRequired, SECRET }
