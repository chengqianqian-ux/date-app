/** 纯 Express app，不启动服务器（serverless 和本地开发共用） */
const express = require('express')
const path = require('path')
const fs = require('fs')
const authRoutes = require('./routes/auth')
const coupleRoutes = require('./routes/couples')
const invitationRoutes = require('./routes/invitations')

const app = express()
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/couples', coupleRoutes)
app.use('/api/invitations', invitationRoutes)

// 生产模式：托管 Vite 打包的静态文件（仅在本地开发时，Vercel 会自动处理前端）
const distDir = path.join(__dirname, '..', 'dist')
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: '服务器错误' })
})

module.exports = app
