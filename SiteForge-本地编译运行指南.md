# SiteForge 本地编译运行指南

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.0 | 推荐 22.x |
| npm | ≥ 9.0 | 随 Node 安装 |
| PostgreSQL | ≥ 14 | 后端数据库（可选，原型不需要） |
| Redis | ≥ 7 | 后端缓存（可选，原型不需要） |

## 快速启动（一键脚本）

```bash
# 启动原型（UI + API，零配置）
./start.sh prototype

# 启动前端（React 开发服务器）
./start.sh frontend

# 启动全部
./start.sh all
```

## 项目结构

```
/workspace/
├── start.sh                          # 一键启动脚本
├── siteforge-prototype/              # 原型（UI + API，零配置可跑）
│   ├── server.js                     # Express 服务入口
│   ├── package.json
│   ├── src/
│   │   ├── geo/                      # GEO 引擎（评分/llms.txt/引用模拟/LLM适配）
│   │   ├── seo/                      # SEO 引擎（sitemap/robots/Schema/健康检查）
│   │   ├── ssg/                      # 静态站点生成（区块渲染器/站点生成器）
│   │   └── parser/                   # AI 结构解析
│   └── public/                       # Web 界面（21 页可交互）
│       ├── index.html
│       ├── style.css
│       └── app.js
├── siteforge/                        # 正式开发代码
│   ├── backend/                      # 后端（NestJS + Prisma + Docker）
│   ├── ssg/                          # SSG 引擎（Astro + 16 种区块组件）
│   ├── geo/                          # GEO 引擎（独立 TypeScript 模块）
│   ├── seo/                          # SEO 引擎（独立 TypeScript 模块）
│   └── frontend/                     # 前端（React + Vite + Tailwind）
└── 文档/
    ├── 企业官网搭建系统-PRD.md
    ├── 企业官网搭建系统-技术架构方案.md
    ├── 企业官网搭建系统-MVP开发任务拆解.md
    ├── 企业官网搭建系统-GEO引擎专项设计.md
    ├── 企业官网搭建系统-商业模式与定价.md
    ├── SiteForge-项目开发总览.md
    ├── SiteForge-测试报告.md
    ├── SiteForge-用户手册.md
    └── SiteForge-本地编译运行指南.md（本文档）
```

---

## 一、原型启动（最快体验，零配置）

原型包含完整的 Web UI（21 页）和 8 个真实 API，无需数据库。

```bash
cd siteforge-prototype
npm install
node server.js
```

访问 http://localhost:3000 即可看到完整产品界面。

### 原型 API 列表

| API | 方法 | 用途 |
|-----|------|------|
| /api/parse | POST | AI 结构解析 |
| /api/geo/score | POST | GEO 可引用性评分 |
| /api/geo/llms-txt | POST | llms.txt 生成 |
| /api/geo/citation-test | POST | AI 引用模拟 |
| /api/seo/generate | POST | SEO 文件生成 |
| /api/seo/health-check | POST | SEO 健康度检查 |
| /api/ssg/generate | POST | 静态站点生成 |
| /api/ssg/preview-page | POST | 页面预览 |

---

## 二、前端启动（React 开发模式）

```bash
cd siteforge/frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 前端构建

```bash
npm run build     # 生产构建 → dist/
npm run preview   # 预览构建产物
```

### 前端技术栈

- React 18 + TypeScript
- Vite 5（构建工具）
- Tailwind CSS（样式）
- Zustand（状态管理）
- React Router v6（路由）
- ECharts（图表）
- Lucide React（图标）

---

## 三、后端启动（NestJS API）

### 3.1 安装依赖

```bash
cd siteforge/backend
npm install
```

### 3.2 配置环境

```bash
cp .env.example .env
# 编辑 .env，填入以下配置：
# - DOMAIN: 你的域名
# - POSTGRES_PASSWORD: 数据库密码
# - JWT_SECRET: JWT 密钥
# - LICENSE_KEY: License Key
```

### 3.3 初始化数据库

```bash
# 需要 PostgreSQL 运行中
npx prisma migrate dev --name init
npx prisma db seed
```

### 3.4 启动

```bash
npm run start:dev    # 开发模式（热重载）
# 或
npm run start        # 生产模式
```

访问 http://localhost:3000，Swagger 文档 http://localhost:3000/api/docs

### 后端技术栈

- NestJS 10 + TypeScript
- Prisma ORM（PostgreSQL）
- JWT 认证（passport-jwt）
- Zod 校验
- Docker Compose 部署

---

## 四、SSG 引擎启动（Astro）

```bash
cd siteforge/ssg
npm install

# 构建静态站点
npx astro build

# 或用 CLI 生成器
npx tsx src/lib/site-generator.ts

# 开发模式预览
npx astro dev
```

---

## 五、GEO / SEO 独立模块编译

```bash
# GEO 引擎
cd siteforge/geo
npm install
npx tsc --noEmit    # 类型检查

# SEO 引擎
cd siteforge/seo
npm install
npx tsc --noEmit    # 类型检查
```

---

## 六、Docker 部署（后端完整环境）

```bash
cd siteforge/backend
docker compose up -d        # 启动全部服务（nginx + app + postgres + redis）
bash scripts/verify.sh      # 部署自检
```

### Docker 服务

| 服务 | 端口 | 说明 |
|------|------|------|
| nginx | 80/443 | 反向代理 + 静态托管 |
| app | 3000 | NestJS API |
| postgres | 5432 | 数据库 |
| redis | 6379 | 缓存 |

---

## 七、常见问题

### Q: node 启动报错 "Cannot find module genie-safe-delete.cjs"
A: 环境变量 NODE_OPTIONS 冲突，执行 `export NODE_OPTIONS=""` 后重试。

### Q: 前端页面空白
A: 检查浏览器控制台，确认 Vite 服务在运行（http://localhost:5173）。

### Q: 后端 prisma migrate 报错
A: 确认 PostgreSQL 已启动，.env 中数据库密码正确。

### Q: 原型 API 返回 404
A: 确认原型服务在运行（`curl http://localhost:3000/api/llm/status`）。
