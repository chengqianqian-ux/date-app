/** Vercel Serverless 入口：所有 /api/* 请求都路由到这里，由 Express 处理 */
const serverless = require('serverless-http')
console.log('[api] loaded serverless-http')
const app = require('../server/app.js')
console.log('[api] loaded app')
const { init } = require('../server/db.js')
console.log('[api] loaded db, isRemote=', !!process.env.DATABASE_URL, 'hasJwt=', !!process.env.JWT_SECRET)

// 懒加载建表（避免冷启动时每次都建表，但首次冷启动会建）
let initialized = false
async function ensureInit() {
  if (!initialized) {
    console.log('[api] 开始建表...')
    try {
      await Promise.race([
        init(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('init 超时 8s')), 8000)),
      ])
    } catch (e) {
      console.error('[api] init 失败:', e.message)
    }
    initialized = true
  }
}

// 包一层，确保数据库表已建好
const handler = serverless(app)
module.exports = async (req, res) => {
  console.log('[api] 请求:', req.method, req.url)
  // health 直接返回，绕过 serverless-http，测试 function 是否启动
  if (req.url.startsWith('/api/health')) {
    return res.status(200).json({ ok: true, direct: true, hasDb: !!process.env.DATABASE_URL, hasJwt: !!process.env.JWT_SECRET })
  }
  await ensureInit()
  return handler(req, res)
}
