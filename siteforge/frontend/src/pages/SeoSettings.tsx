import { Card, CardHeader, CardTitle, Input, Textarea, Label, Button, Badge, Toggle, CodeBlock, Select } from '@/components/ui'
import { toast } from '@/stores/toast'
import { useState } from 'react'

export default function SeoSettings() {
  const [autoSitemap, setAutoSitemap] = useState(true)
  const [aiCrawlers, setAiCrawlers] = useState(true)

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">SEO 设置</h1><p className="text-sm text-muted-foreground">全局SEO配置、技术文件、结构化数据</p></div>

      <Card className="mb-4">
        <CardHeader><CardTitle>全局 SEO</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>站点标题</Label><Input defaultValue="智云科技" /></div>
          <div><Label>站点描述</Label><Input defaultValue="专注企业数字化转型与AI应用" /></div>
          <div><Label>Favicon</Label><Input placeholder="favicon URL" /></div>
          <div><Label>语言声明</Label><Select><option>zh-CN</option><option>en</option></Select></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>技术 SEO 文件</CardTitle></CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div><div className="text-sm font-medium">sitemap.xml 自动生成</div><div className="text-xs text-muted-foreground">发布时自动更新站点地图</div></div><Toggle checked={autoSitemap} onChange={setAutoSitemap} /></div>
          <div className="flex items-center justify-between"><div><div className="text-sm font-medium">AI 爬虫放行（GEO 关键）</div><div className="text-xs text-muted-foreground">放行 GPTBot/ClaudeBot/PerplexityBot 等 9 个 AI 爬虫</div></div><div className="flex items-center gap-2"><Toggle checked={aiCrawlers} onChange={setAiCrawlers} />{aiCrawlers && <Badge variant="success">已放行</Badge>}</div></div>
          <div><Label>robots.txt 自定义规则</Label><CodeBlock>{`User-agent: *
Allow: /
Disallow: /admin/

# AI Crawlers (GEO)
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /`}</CodeBlock></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Schema.org 结构化数据</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-3">
          {['Organization', 'Product', 'Article', 'FAQPage', 'BreadcrumbList', 'LocalBusiness'].map(s => (
            <div key={s} className="flex items-center gap-2 p-3 border border-border rounded-lg"><Toggle checked onChange={() => {}} /><span className="text-sm">{s}</span></div>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>搜索引擎收录</CardTitle></CardHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg"><Badge variant="primary">百度</Badge><Input placeholder="百度站长平台 API Key" className="flex-1" /><Button size="sm" variant="secondary" onClick={() => toast.success('已提交sitemap到百度')}>提交</Button></div>
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg"><Badge variant="primary">Google</Badge><Input placeholder="Google Search Console API Key" className="flex-1" /><Button size="sm" variant="secondary" onClick={() => toast.success('已提交sitemap到Google')}>提交</Button></div>
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg"><Badge variant="primary">Bing</Badge><Input placeholder="Bing Webmaster API Key" className="flex-1" /><Button size="sm" variant="secondary">提交</Button></div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>关键词排名监控</CardTitle><Button size="sm" variant="secondary">添加关键词</Button></CardHeader>
        <div className="space-y-2">
          {['企业建站', '官网搭建', 'SEO优化'].map(kw => (
            <div key={kw} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium flex-1">{kw}</span><Badge variant="warning">第3页</Badge><span className="text-xs text-muted-foreground">↑ 5位</span></div>
          ))}
        </div>
      </Card>
    </div>
  )
}
