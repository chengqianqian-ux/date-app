const express = require('express')
const path = require('path')
const fs = require('fs')
const { init } = require('./db')
const authRoutes = require('./routes/auth')
const coupleRoutes = require('./routes/couples')
const invitationRoutes = require('./routes/invitations')

const app = express()
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/couples', coupleRoutes)
app.use('/api/invitations', invitationRoutes)

// 生产模式：托管 Vite 打包的前端静态文件
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA fallback：所有非 /api 请求返回 index.html
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: '服务器错误' })
})

const PORT = process.env.PORT || 3001

async function start() {
  await init()
  app.listen(PORT, () => {
    console.log(`[server] 约会 app 已启动: http://localhost:${PORT}`)
  })
}

start().catch((e) => {
  console.error('启动失败:', e)
  process.exit(1)
})
