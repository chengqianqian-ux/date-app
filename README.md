# 💕 约会 · 两个人的小天地

情侣约会邀请 Web App —— 男女朋友配对后可以互相发送约会邀请，对方可接受/婉拒/取消。

## 技术栈
- 前端：React 18 + Vite + React Router
- 后端：Node.js + Express + JWT
- 数据库：PostgreSQL（本地开发可改用 Docker 起的 pg）

---

## 🚀 部署到 Render（让别人都能访问）

部署后你会得到一个固定的 `https://你的应用名.onrender.com` 链接，任何人打开都能注册使用。

### 准备：把代码推到 GitHub
1. 在 GitHub 新建一个空仓库（如 `date-app`）
2. 本地初始化并推送：
   ```bash
   cd date-app
   git init
   git add .
   git commit -m "init: 约会 app"
   git branch -M main
   git remote add origin https://github.com/你的用户名/date-app.git
   git push -u origin main
   ```

### 在 Render 上部署（二选一）

**方式 A：用蓝图文件（推荐，一键）**

`render.yaml` 已经写好。在 Render 仪表盘：
1. 点 **New +** → **Blueprint**
2. 选你的 GitHub 仓库
3. Render 会自动识别 `render.yaml`，创建一个 Postgres 数据库 + 一个 Web 服务
4. 点 **Apply**，等构建完成（首次约 2-3 分钟）

**方式 B：手动创建**

1. **创建数据库**：New + → PostgreSQL → plan 选 free → 记下生成的 `Internal Database URL`
2. **创建 Web 服务**：New + → Web Service → 选你的仓库
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - 环境变量（Environment 标签页添加）：
     | Key | Value |
     |---|---|
     | `DATABASE_URL` | （粘贴上一步 Postgres 的 Internal Connection String）|
     | `JWT_SECRET` | 随便一串长字符，或点 Generate 生成 |
     | `NODE_ENV` | `production` |
3. 部署完成后，Render 给你一个 `https://xxx.onrender.com` 链接 —— 这就是发给别人用的链接！

### 验证部署成功
```bash
curl https://你的应用名.onrender.com/api/health
# 返回 {"ok":true} 即成功
```
然后浏览器打开链接，注册两个账号走完配对 + 发邀请流程。

### 注意事项
- Render 免费版服务 15 分钟无请求会休眠，首次唤醒约 30-50 秒（会显示加载），日常使用无影响
- 免费版 Postgres 90 天后到期，到期前会邮件提醒；长期用建议升级 starter（$5/月）
- 数据存在 Postgres，服务重启不会丢

---

## 💻 本地开发

### 方式 1：用 Docker 起 Postgres（推荐，装了 Docker Desktop 用这个）
```bash
docker compose up -d          # 起本地 postgres
cp .env.example .env          # 生成环境变量
npm install
npm run dev                   # 同时起前端 5173 + 后端 3001
```
浏览器打开 http://localhost:5173

### 方式 2：直接连 Render 的 Postgres（不用本地装数据库）
在项目根目录建 `.env`，`DATABASE_URL` 填 Render Postgres 的**外部连接串**（External Database URL）：
```
DATABASE_URL=postgres://user:pass@xxx.render.com/dbname
PGSSL=1
JWT_SECRET=local-dev-secret
```
然后 `npm run dev`，本地代码改的是云端数据库（开发期可接受）。

---

## 体验流程
1. 浏览器开两个窗口（一个普通 + 一个无痕），分别注册账号 A、B
2. A 在「配对」页生成 6 位配对码，把码告诉 B
3. B 在「配对」页输入码 → 绑定成功
4. A 在「发起邀请」发送约会（标题/类型/时间/地点/留言）
5. B 在「收到的」列表看到 → 接受/婉拒
6. A 在「发出的」列表看到状态变化；pending 状态下 A 可取消

## API 概览
- `POST /api/auth/register` `POST /api/auth/login` `GET /api/auth/me`
- `POST /api/couples/code` `POST /api/couples/pair` `GET /api/couples/partner`
- `GET /api/invitations` `POST /api/invitations` `POST /api/invitations/:id/respond` `POST /api/invitations/:id/cancel`
