# SiteForge 项目开发总览

> 本文档汇总 SiteForge 企业官网搭建系统的全部交付物，包括产品文档、技术设计、可运行原型、正式开发代码。

## 项目定位

**本地部署的企业官网搭建系统**，核心差异化：AI 结构复刻 + SEO 搜索引擎优化 + GEO 生成式引擎优化（AI 搜索排名）。

---

## 交付物总览

### 一、产品文档（5 份）

| 文档 | 路径 | 内容 |
|------|------|------|
| PRD v2.0 | `/workspace/企业官网搭建系统-PRD.md` | 产品定义、9 大模块功能需求、用户画像、指标体系、合规边界 |
| 技术架构 v1.0 | `/workspace/企业官网搭建系统-技术架构方案.md` | 整体架构、技术选型、9 大子系统设计、5 个阻塞项决策 |
| 任务拆解 v1.0 | `/workspace/企业官网搭建系统-MVP开发任务拆解.md` | 42 个工程任务卡、8 个 Sprint 排期 |
| GEO 专项设计 v1.0 | `/workspace/企业官网搭建系统-GEO引擎专项设计.md` | 6 维度评分算法、llms.txt 模板、Prompt 工程 |
| 商业模式与定价 v1.0 | `/workspace/企业官网搭建系统-商业模式与定价.md` | 三版定价、License features、财务模型 |

### 二、可运行原型（产品 UI + 引擎验证）

| 交付物 | 路径 | 内容 |
|--------|------|------|
| 产品 UI 原型 | `/workspace/siteforge-prototype/` | 21 页高保真可交互 UI（明暗双主题）+ 7 个真实 API |
| 启动方式 | `cd /workspace/siteforge-prototype && node server.js` | 访问 http://localhost:3000 |

### 三、正式开发代码（4 个模块，74 个源文件，8485 行代码）

#### 模块一：后端架构（`/workspace/siteforge/backend/`）

| 内容 | 文件 |
|------|------|
| NestJS 骨架 | `src/main.ts`、`src/app.module.ts` |
| Prisma Schema | `prisma/schema.prisma`（14 张表，JSONB 字段，外键关系） |
| JWT 认证 | `src/auth/`（登录/注册/守卫/策略） |
| License 授权 | `src/license/`（机器码生成 + RSA 签名验证） |
| 站点 CRUD | `src/sites/` |
| 全局过滤器 | `src/common/filters/all-exceptions.filter.ts` |
| Zod 校验管道 | `src/common/pipes/zod-validation.pipe.ts` |
| Docker 部署 | `docker-compose.yml`、`Dockerfile`、`.env.example` |
| Nginx 配置 | `nginx/nginx.conf`、`nginx/conf.d/siteforge.conf` |
| 运维脚本 | `scripts/backup.sh`、`scripts/verify.sh` |

#### 模块二：SSG 引擎（`/workspace/siteforge/ssg/`）

| 内容 | 文件 |
|------|------|
| 区块 Schema（共享） | `src/shared/block-schema.ts`（Zod discriminatedUnion，16 种区块） |
| Astro 区块组件 | `src/components/blocks/`（16 个 `.astro` 组件） |
| 区块渲染器 | `src/components/BlockRenderer.astro`、`src/lib/block-renderer.ts` |
| 站点布局 | `src/layouts/SiteLayout.astro`（SEO/GEO 标签注入） |
| 内容集合 | `src/content/config.ts`（products/cases/posts/pages） |
| 站点生成器 | `src/lib/site-generator.ts`（generateSite CLI） |
| SEO 引擎 | `src/lib/seo-engine.ts`（sitemap/robots/Schema） |
| llms.txt 生成器 | `src/lib/llms-txt-generator.ts` |
| 全局样式 | `src/styles/global.css` |

#### 模块三：GEO 引擎（`/workspace/siteforge/geo/`）

| 内容 | 文件 |
|------|------|
| 类型定义 | `src/types.ts` |
| 可引用性评分器 | `src/citability-scorer.ts`（6 维度，Princeton 论文权重） |
| llms.txt 生成器 | `src/llms-txt-generator.ts`（简洁版 + 详细版） |
| AI 写作辅助 | `src/writing-assistant.ts`（8 条检测规则 + 3 个模板） |
| LLM 适配层 | `src/llm-adapter.ts`（千问/DeepSeek/智谱统一接口 + 降级） |
| AI 引用模拟 | `src/citation-tester.ts`（BM25 检索 + 规则/LLM 版模拟） |
| 权威信号 | `src/authority-signals.ts`（Meta 标签 + JSON-LD Schema） |
| 统一导出 | `src/index.ts` |

#### 模块四：SEO 引擎（`/workspace/siteforge/seo/`）

| 内容 | 文件 |
|------|------|
| 类型定义 | `src/types.ts`（含 AI_CRAWLER_WHITELIST） |
| sitemap 生成 | `src/sitemap-generator.ts` |
| robots.txt 生成 | `src/robots-generator.ts`（GEO 关键：9 个 AI 爬虫放行） |
| Schema.org 生成 | `src/schema-generator.ts`（7 种 Schema 类型） |
| URL slug | `src/slug-generator.ts` |
| TDK 自动生成 | `src/tdk-generator.ts` |
| Open Graph | `src/og-generator.ts` |
| 健康度检查 | `src/health-checker.ts`（12 项检查，0-100 评分） |
| 统一导出 | `src/index.ts` |

---

## 模块间依赖关系

```
backend (NestJS)
  ├── imports → @siteforge/geo (GEO 引擎)
  ├── imports → @siteforge/seo (SEO 引擎)
  └── calls → ssg (Astro 构建，通过构建队列)

ssg (Astro)
  ├── imports → shared/block-schema.ts (区块 Schema，前后端共享)
  └── outputs → 静态 HTML + sitemap + robots + llms.txt

geo (独立模块)
  └── exports → scoreCitability / LLMAdapter / generateLlmsTxt / simulateCitation

seo (独立模块)
  └── exports → generateSitemap / generateRobotsTxt / generateSchema / runHealthCheck
```

---

## 启动方式

### 原型（可交互 UI + 引擎 API）

```bash
cd /workspace/siteforge-prototype
npm install
node server.js
# 访问 http://localhost:3000
```

### 后端（NestJS API）

```bash
cd /workspace/siteforge/backend
cp .env.example .env
npx prisma migrate dev --name init
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

### SSG 构建测试

```bash
cd /workspace/siteforge/ssg
npm install
npx astro build    # 构建静态站点
# 或用 CLI 生成器
npx tsx src/lib/site-generator.ts
```

### Docker 部署

```bash
cd /workspace/siteforge/backend
docker compose up -d
bash scripts/verify.sh
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 API | NestJS + TypeScript + Prisma + PostgreSQL + Redis |
| SSG | Astro + TypeScript + Zod |
| GEO 引擎 | TypeScript + Zod（规则引擎 + 第三方 LLM API） |
| SEO 引擎 | TypeScript + Zod |
| 部署 | Docker Compose + Nginx |
| 前端 UI | React + shadcn/ui + Tailwind（计划中） |

---

## 项目完成度

| 里程碑 | 状态 | 说明 |
|--------|------|------|
| 产品文档 | ✅ 完成 | 5 份文档，全链路闭环 |
| 可运行原型 | ✅ 完成 | 21 页 UI + 7 个真实 API |
| 后端骨架 | ✅ 完成 | NestJS + Prisma(14表) + Auth + License + Docker |
| SSG 引擎 | ✅ 完成 | Astro + 16 种区块组件 + 站点生成器 |
| GEO 引擎 | ✅ 完成 | 评分 + llms.txt + LLM 适配 + 引用模拟 |
| SEO 引擎 | ✅ 完成 | sitemap/robots/Schema + 12 项健康检查 |
| 前端开发 | 📋 计划中 | React + TypeScript + shadcn/ui |
| 集成测试 | 📋 计划中 | 端到端链路验证 |
| 种子客户部署 | 📋 计划中 | 10 家客户验证 |
