# 简历项目描述 · 约会邀请 Web App

> 以下提供"简历段落版"和"面试口述版"两版，按需取用。

---

## 一、简历段落版（直接贴简历，约 200 字）

**约会邀请 Web App** — 个人全栈项目 ｜ React + Node.js + PostgreSQL ｜ [haoyidechengzi.xyz](https://haoyidechengzi.xyz) ｜ [GitHub 源码](https://github.com/chengqianqian-ux/date-app)

面向情侣的约会邀请与心愿管理应用。前端使用 React 18 + Vite + React Router，后端基于 Node.js + Express 构建 RESTful API，数据持久化采用 PostgreSQL（Supabase），JWT 实现鉴权。支持情侣配对、约会邀请发送与状态流转（待回复/接受/婉拒/完成打卡）、约会心愿单、纪念日倒计时等功能。项目已部署至 Vercel Serverless，绑定自有域名并配置 HTTPS，国内可直接访问。技术上采用"一套 Express 代码同时服务本地开发与 Serverless"的架构，通过 `vercel.json` 的 rewrite 规则统一 API 入口；数据库使用幂等迁移脚本（`CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`）实现增量字段的安全升级。

---

## 二、面试口述版（被问到"介绍一下这个项目"时用，约 1 分钟）

"这是我独立开发的一个情侣约会邀请 Web 应用，从需求设计、前后端开发到部署上线全流程自己做。

**功能上**，用户注册登录后可以通过 6 位配对码和另一半绑定，然后互相发送约会邀请——选类型、时间、地点、留言，对方可以接受、婉拒，赴约后还能打卡完成。另外还有约会心愿单、纪念日倒计时、邀请红点提醒这些功能。

**技术上**，前端是 React 18 加 Vite，后端是 Node.js 加 Express，数据库用 PostgreSQL。鉴权用 JWT，密码用 bcrypt 加密。部署在 Vercel 的 Serverless 上，绑了自己的域名加 HTTPS。

这个项目我觉得比较有亮点的地方有两个：一是架构上，我让同一套 Express 代码既能本地跑、又能跑在 Vercel Serverless 上，通过一个 rewrite 规则把所有 `/api` 请求统一转给一个入口函数，再转发给 Express app，这样不用维护两套后端代码；二是数据库迁移用幂等 SQL，新加字段时用 `ALTER TABLE ADD COLUMN IF NOT EXISTS`，保证线上已经部署的数据库能安全升级，不会因为重复建表报错。"

---

## 三、面试可能被追问的点（提前准备）

| 追问 | 准备要点 |
|---|---|
| 为什么选 Vercel Serverless 而不是传统服务器？ | 免运维、自动扩缩、免费额度够用；前端静态资源走 CDN，API 走 Serverless，冷启动可接受 |
| JWT 鉴权怎么做的？token 存哪？ | 登录签发 7 天 JWT，前端存 localStorage，每次请求带 `Authorization: Bearer`；中间件解析 token 后回查数据库确保用户有效 |
| 密码安全？ | bcrypt 哈希存储，不存明文；改密码时验证旧密码再更新 |
| 一套代码怎么同时跑本地和 Serverless？ | `server/app.js` 导出纯 Express app；本地 `server/index.js` 调 `app.listen`；线上 `api/index.js` 把 `(req,res)` 转发给同一个 app |
| 数据库表结构？ | 4 张表：users / couples / invitations / wishlists，通过 couple_id 关联，invitations 有状态机 |
| 时区问题怎么处理？ | 纪念日是 DATE 类型，pg 驱动默认返回 UTC 时间戳会差一天，用 `to_char` 在 SQL 层格式化成 YYYY-MM-DD 规避 |
| 怎么保证部署不破坏已有数据？ | 建表全用 `IF NOT EXISTS`，增量字段用 `ALTER TABLE ADD COLUMN IF NOT EXISTS`，幂等可重复执行 |
| 这个项目最难的地方？ | 部署阶段：vercel.app 域名被墙、Supabase 直连不通需用 pooler、Vercel 账号被误封走申诉——都是实际工程问题，逐个排查解决 |
