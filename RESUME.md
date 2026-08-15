# 简历项目描述 · 双人日记 Twin Diary

> 面向情侣的约会与心愿管理 Web App。多档写法按简历格子大小取用。

---

## 一、两点亮点版（推荐，简历格子用）

**双人日记（Twin Diary）** — AI Coding 全栈个人项目 ｜ React 18 · Node.js · Express · PostgreSQL · Vercel
在线：haoyidechengzi.xyz ｜ 源码：github.com/chengqianqian-ux/date-app

- **以 AI 结对编程完成 0→1 全栈交付**：React 18 + Vite 前端（9 个页面），Express 提供 20+ RESTful API，PostgreSQL 持久化，JWT + bcrypt 鉴权；独立完成需求设计、前后端开发、数据库建模与部署上线
- **独立解决 Serverless 架构适配与部署工程问题**：一套 Express 代码经 Vercel rewrite 同时服务本地与线上；数据库用幂等迁移脚本实现增量字段安全升级；聊天室用轮询+增量接口实现准实时（Serverless 不支持 WebSocket）；排查并解决 vercel.app 域名被墙、Supabase pooler 连接、账号封禁等问题，最终绑定自有域名稳定上线

---

## 二、四点亮点版（如有项目详情块）

**双人日记（Twin Diary）** — AI Coding 全栈个人项目
技术栈：React 18 · Vite · Node.js · Express · PostgreSQL · JWT · Vercel Serverless
链接：haoyidechengzi.xyz ｜ github.com/chengqianqian-ux/date-app

- **以 AI 结对编程完成 0→1 全栈交付**：独立完成需求设计、前后端、数据库建模与部署上线；前端 React 18 + Vite（9 个页面），后端 Express 提供 20+ RESTful API，PostgreSQL 持久化，JWT + bcrypt 鉴权加密
- **一套代码同时服务本地与 Serverless**：通过 Vercel rewrite 统一 API 入口，同一份 Express 既能本地 `app.listen` 又能跑在 Serverless 函数上，避免维护两套后端
- **数据库幂等迁移保证安全升级**：建表用 `IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`，增量字段在线上已部署库上重复执行不报错、不丢数据
- **聊天室准实时 + 独立排查部署问题**：因 Serverless 不支持 WebSocket，用 2.5s 轮询+增量接口实现准实时；并独立解决域名被墙（绑自有域名）、Supabase 直连不通（切 pooler）、账号误封（走申诉）等问题

---

## 三、面试口述版（被问"介绍一下这个项目"用，约 1 分钟）

"这个项目叫双人日记，是我以 AI 结对编程方式，从 0 到 1 独立交付的全栈应用。

功能上是个情侣 app：配对后能互相发约会邀请、对方接受婉拒、完成打卡选心情、心愿单、聊天室、回忆时间线，还有纪念日倒计时、每日情话、生日提醒这些。

技术上前端 React 18 加 Vite，后端 Node.js 加 Express，数据库 PostgreSQL，鉴权 JWT，密码 bcrypt。部署在 Vercel Serverless，绑了自己的域名加 HTTPS。

我觉得有几个亮点：一是架构上，我让同一套 Express 代码既能本地跑、又能跑在 Serverless 上，通过一个 rewrite 把所有 API 请求统一转发给同一个 app，不用维护两套后端；二是数据库迁移用幂等 SQL，新加字段用 IF NOT EXISTS，线上已部署的库能安全升级；三是聊天室，因为 Vercel Serverless 不支持 WebSocket 长连接，我用轮询加增量接口实现了准实时——情侣 app 消息量小，没必要为 WebSocket 额外搭服务器，这是按场景选技术不是为用而用。

部署过程也踩了些坑，vercel.app 域名被墙、Supabase 直连不通要改 pooler、账号被误封走申诉，都是我自己定位根因再解决的。"

---

## 四、面试可能被追问的点（提前准备）

| 追问 | 准备要点 |
|---|---|
| AI 具体怎么帮你的？ | 我定架构和需求、AI 写实现和查文档；陌生技术（JWT/bcrypt/pg pooler/Vercel rewrite）AI 帮我快速上手；不是代写是结对 |
| 为什么选 Vercel Serverless？ | 免运维、自动扩缩、免费额度够；前端走 CDN，API 走 Serverless |
| JWT 鉴权怎么做的？token 存哪？ | 登录签发 7 天 JWT 存 localStorage，请求带 Bearer；中间件解析后回查 DB 确保用户有效 |
| 密码安全？ | bcrypt 哈希，不明文存储，故只能重置不能找回 |
| 一套代码怎么双跑？ | app.js 导出纯 Express；本地 index.js 调 app.listen；线上 api/index.js 把 (req,res) 转发给同一 app |
| 数据库表结构？ | 5 张表：users/couples/invitations/wishlists/messages，couple_id 关联；invitations 有状态机+心情+小记 |
| 聊天为什么不用 WebSocket？ | Vercel Serverless 限时+不支持长连接；轮询 2.5s+增量接口足够，零额外服务；按场景选技术 |
| 时区问题？ | DATE 字段用 to_char 在 SQL 层格式化 YYYY-MM-DD，规避 pg 返回 UTC 时间戳差一天 |
| 项目最难的地方？ | 部署排坑：域名被墙、Supabase 连接、账号封禁——真实工程问题逐个解决 |
| 数据存哪/代码在哪？ | 代码在 GitHub 开源；部署在 Vercel；数据在 Supabase PostgreSQL（东京），通过 pooler 连接串访问 |
