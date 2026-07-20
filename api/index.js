/** Vercel Serverless 入口：所有 /api/* 请求都路由到这里，由 Express 处理 */
const serverless = require('serverless-http')
const app = require('../server/app.js')
const { init } = require('../server/db.js')

// 懒加载建表（避免冷启动时每次都建表，但首次冷启动会建）
let initialized = false
async function ensureInit() {
  if (!initialized) {
    try {
      await init()
    } catch (e) {
      console.error('[db] init 失败:', e.message)
    }
    initialized = true
  }
}

// 包一层，确保数据库表已建好
const handler = serverless(app)
module.exports = async (req, res) => {
  await ensureInit()
  return handler(req, res)
}
