// @ts-check
import { defineConfig } from 'astro/config'

// SiteForge SSG 配置
// 静态输出，零 JS by default，SEO/GEO 友好
export default defineConfig({
  // 纯静态 HTML 输出，部署到 Nginx 静态目录
  output: 'static',
  // 关闭 Astro DevToolbar 在生产环境的痕迹
  devToolbar: { enabled: false },
  // 构建产物目录（可被 site-generator.ts 在生成时改写）
  outDir: './dist',
  // 默认站点 URL，构建 sitemap/robots 时使用（运行时也可被 siteData 覆盖）
  site: 'https://example.com',
  // Markdown 渲染配置（GEO 友好：保留语义化 HTML）
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  // 静态资源目录
  publicDir: './public',
})
