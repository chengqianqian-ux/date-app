const { Pool } = require('pg')

// DATABASE_URL 由部署平台注入（Supabase / Railway / Render）
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/dateapp'

// 远程数据库（含 DATABASE_URL）一律启用 SSL，本地开发不启用
const isRemote = !!process.env.DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
})

// 建表（pg 客户端一次执行一条语句）
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
