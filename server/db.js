const { Pool } = require('pg')

// Render/生产通过 DATABASE_URL 连接 Postgres；本地开发可设 DATABASE_URL 指向本地或远程 pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/dateapp',
  // 生产环境强制 SSL；本地连接无需
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render')
    ? { rejectUnauthorized: false }
    : (process.env.PGSSL === '1' ? { rejectUnauthorized: false } : false),
})

// pg 客户端一次只执行一条语句，分别建表
const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    couple_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS couples (
    id SERIAL PRIMARY KEY,
    pair_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    couple_id INTEGER NOT NULL,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    meet_time TEXT,
    location TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ
  )`,
]

async function init() {
  for (const sql of TABLES) {
    await pool.query(sql)
  }
  console.log('[db] 表已就绪')
}

module.exports = { pool, init }
