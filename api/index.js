/** Vercel Serverless 入口：所有 /api/* 请求都路由到这里，由 Express 处理
 *  不用 serverless-http（它在 Vercel 上会挂住），直接把 req/res 交给 Express app
 *  Express 4 的 app 本身就能作为 (req, res) 处理器调用 */
let app, init, initialized = false

async function loadModules() {
  if (app) return
  console.log('[api] 加载模块...')
  app = require('../server/app.js')
  const db = require('../server/db.js')
  init = db.init
  console.log('[api] 模块加载完成 hasDb=', !!process.env.DATABASE_URL)
}

// Express 4 的 app(req,res) 是同步调用但路由处理异步，用 res finish 事件等完成
function handleWithExpress(req, res) {
  return new Promise((resolve) => {
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    res.on('finish', finish)
    res.on('close', finish)
    try {
      app(req, res)
    } catch (e) {
      console.error('[api] app 异常:', e.message)
      if (!done) {
        done = true
        if (!res.headersSent) res.status(500).json({ error: '处理异常', detail: e.message })
        resolve()
      }
    }
  })
}

module.exports = async (req, res) => {
  console.log('[api] 请求:', req.method, req.url)
  if (req.url.startsWith('/api/health')) {
    return res.status(200).json({ ok: true, hasDb: !!process.env.DATABASE_URL, hasJwt: !!process.env.JWT_SECRET })
  }
  if (req.url.startsWith('/api/dbtest')) {
    try {
      await loadModules()
      const { pool } = require('../server/db.js')
      const t = Date.now()
      const r = await pool.query('SELECT 1 as test')
      return res.json({ ok: true, time: (Date.now() - t) + 'ms', rows: r.rows })
    } catch (e) {
      return res.status(500).json({ error: e.message, code: e.code, host: e.host })
    }
  }
  try {
    await loadModules()
  } catch (e) {
    console.error('[api] loadModules 失败:', e.message)
    return res.status(500).json({ error: '模块加载失败', detail: e.message })
  }
  if (!initialized) {
    try { await init() } catch (e) { console.error('[api] init:', e.message) }
    initialized = true
  }
  return handleWithExpress(req, res)
}
