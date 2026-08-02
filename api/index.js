/** Vercel Serverless 入口：所有 /api/* 请求都路由到这里，由 Express 处理
 *  lazy require：模块在第一次非 health 请求时加载，方便定位 require 阶段挂住的问题 */
let serverless, app, init, initialized = false

async function loadModules() {
  if (serverless) return
  console.log('[api] 开始加载模块...')
  serverless = require('serverless-http')
  console.log('[api] loaded serverless-http')
  app = require('../server/app.js')
  console.log('[api] loaded app')
  const db = require('../server/db.js')
  init = db.init
  console.log('[api] loaded db, isRemote=', !!process.env.DATABASE_URL, 'hasJwt=', !!process.env.JWT_SECRET)
}

module.exports = async (req, res) => {
  console.log('[api] 请求:', req.method, req.url)
  // health 直接返回，不加载任何模块，测试 function 启动是否正常
  if (req.url.startsWith('/api/health')) {
    return res.status(200).json({ ok: true, direct: true, hasDb: !!process.env.DATABASE_URL, hasJwt: !!process.env.JWT_SECRET })
  }
  if (req.url.startsWith('/api/dbtest')) {
    try {
      await loadModules()
      const { pool } = require('../server/db.js')
      const t = Date.now()
      const r = await Promise.race([
        pool.query('SELECT 1 as test'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('query 超时 8s')), 8000))
      ])
      return res.json({ ok: true, time: (Date.now() - t) + 'ms', rows: r.rows })
    } catch (e) {
      return res.status(500).json({ error: e.message, code: e.code, errno: e.errno, host: e.host, stack: e.stack ? e.stack.split('\n').slice(0,5) : null })
    }
  }
  if (req.url.startsWith('/api/inittest')) {
    try {
      await loadModules()
      const t = Date.now()
      await init()
      return res.json({ ok: true, time: (Date.now() - t) + 'ms' })
    } catch (e) {
      return res.status(500).json({ error: e.message, code: e.code, stack: e.stack ? e.stack.split('\n').slice(0,5) : null })
    }
  }
  if (req.url.startsWith('/api/exprtest')) {
    try {
      await loadModules()
      if (!initialized) { try { await init() } catch(e){ console.error('[api] init:', e.message) }; initialized = true }
      const handler = serverless(app)
      return handler(req, res)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
  try {
    await loadModules()
  } catch (e) {
    console.error('[api] loadModules 失败:', e.message, '\n', e.stack)
    return res.status(500).json({ error: '模块加载失败', detail: e.message, stack: e.stack })
  }
  if (!initialized) {
    try {
      await init()
    } catch (e) {
      console.error('[api] init 失败:', e.message)
    }
    initialized = true
  }
  const handler = serverless(app)
  return handler(req, res)
}
