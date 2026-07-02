# SiteForge 核心引擎验证原型

> 这是一个可运行的原型，验证 SiteForge 最核心的差异化能力：**GEO 引擎 + SEO 引擎 + 结构解析**。

## 快速启动

```bash
cd /workspace/siteforge-prototype
npm install
node server.js
```

访问 `http://localhost:3000` 即可使用 Web 界面。

## 验证的功能

| # | 功能 | 验证内容 | API |
|---|------|---------|-----|
| ⭐ | **网站构建器** | **端到端：解析→编辑→SSG生成→预览，含 SEO/GEO 注入** | 多 API 组合 |
| ① | AI 结构解析 | 输入 URL → 生成页面结构 + 区块序列（mock） | `POST /api/parse` |
| ② | GEO 可引用性评分 | 6 维度评分（事实密度/结构化/引用/权威/完整/语义），总分 100 | `POST /api/geo/score` |
| ③ | AI 写作辅助 | 规则检测 + 优化提示 + GEO 写作模板 | `POST /api/geo/writing-tips` |
| ④ | llms.txt 生成 | 生成 llms.txt（简洁版）+ llms-full.txt（详细版） | `POST /api/geo/llms-txt` |
| ⑤ | AI 引用模拟测试 | BM25 检索 + 规则/LLM 引用概率判断 | `POST /api/geo/citation-test` |
| ⑥ | SEO 引擎 | sitemap.xml + robots.txt（含 AI 爬虫放行）+ Schema.org | `POST /api/seo/generate` |
| ⑥ | SEO 健康度检查 | 9 项检查 + 0-100 评分 + 自动修复标记 | `POST /api/seo/health-check` |
| ⑦ | LLM 适配层 | 千问/DeepSeek/智谱统一接口 + 用量统计 | `POST /api/llm/configure` |
| **⑧** | **静态站点生成（SSG）** | **多页面 + SEO/GEO 注入 + sitemap/robots/llms.txt 一次生成** | `POST /api/ssg/generate` |
| **⑧** | **区块渲染器** | **16 种区块类型 → 语义化 HTML** | `POST /api/blocks/render` |

## 技术栈

- Node.js + Express（后端 API）
- 原生 HTML/CSS/JS（前端，无构建步骤）
- 零外部依赖（除 Express）

## 文件结构

```
siteforge-prototype/
├── server.js                      # Express 服务入口
├── package.json
├── src/
│   ├── geo/
│   │   ├── citability-scorer.js   # 可引用性评分器（6 维度）
│   │   ├── llms-txt-generator.js  # llms.txt 生成器
│   │   ├── writing-assistant.js   # AI 写作辅助 + 模板
│   │   ├── citation-tester.js     # AI 引用模拟测试
│   │   └── llm-adapter.js         # LLM 适配层
│   ├── seo/
│   │   └── seo-engine.js          # SEO 引擎（sitemap/robots/schema/health）
│   ├── ssg/
│   │   ├── block-renderer.js      # 区块渲染器（16 种区块 → HTML）
│   │   └── site-generator.js      # 静态站点生成器（多页面 + SEO/GEO 注入）
│   └── parser/
│       └── structure-parser.js    # 结构解析（mock）
└── public/
    ├── index.html                 # Web 界面（8 个功能 Tab）
    ├── style.css
    └── app.js                     # 前端逻辑（含网站构建器）
```

## 验证结果

所有核心引擎已验证通过：

- ✅ **可引用性评分**：6 维度正确检测，权重基于 Princeton GEO 论文实证数据
- ✅ **llms.txt**：符合 Jeremy Howard 规范格式
- ✅ **robots.txt**：正确放行 9 个 AI 爬虫（GPTBot/ClaudeBot/PerplexityBot 等）
- ✅ **Schema.org**：正确生成 Organization/Article/Product/FAQPage schema
- ✅ **AI 引用模拟**：BM25 检索 + 规则判断正确运行
- ✅ **SEO 健康检查**：9 项检查正确识别问题
- ✅ **LLM 适配层**：支持千问/DeepSeek/智谱/OpenAI 统一接口
- ✅ **静态站点生成**：5 页面 + sitemap + robots + llms.txt 一次生成，28.7KB
- ✅ **区块渲染器**：16 种区块类型正确渲染为语义化 HTML
- ✅ **SEO/GEO 注入**：TDK + canonical + OG + Schema.org + AI 爬虫放行 全部注入
- ✅ **端到端链路**：解析 → 编辑 → 生成 → 预览 完整跑通
