/** 本地开发入口：启动 Express + 初始化数据库 */
const app = require('./app')
const { init } = require('./db')

const PORT = process.env.PORT || 3001

async function start() {
  await init()
  app.listen(PORT, () => {
    console.log(`[server] 约会 app 已启动: http://localhost:${PORT}`)
  })
}

start().catch((e) => {
  console.error('启动失败:', e.message)
  process.exit(1)
})
