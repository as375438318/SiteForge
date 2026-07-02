import { Card, CardHeader, CardTitle, Button, Textarea, Badge, Alert, CodeBlock, Toggle, Label } from '@/components/ui'
import { toast } from '@/stores/toast'
import { RefreshCw, Download } from 'lucide-react'
import { useState } from 'react'

const defaultLlmsTxt = `# 智云科技

> 专注企业数字化转型与AI应用

## 主要内容

- 产品服务: https://www.zhiyun-tech.com/products - 提供专业的产品和服务解决方案
- 成功案例: https://www.zhiyun-tech.com/cases - 服务客户的成功案例展示
- 关于我们: https://www.zhiyun-tech.com/about - 公司简介与团队介绍
- 联系方式: https://www.zhiyun-tech.com/contact - 联系方式与在线咨询

## 核心资源

- 企业数字化转型指南: https://www.zhiyun-tech.com/posts/digital-transformation - 2025年企业数字化转型的关键步骤

## 补充说明

智云科技致力于为企业提供专业的数字化转型方案，拥有200+成功案例，服务覆盖制造业、零售、教育等多个行业。`

export default function GeoLlmsTxt() {
  const [content, setContent] = useState(defaultLlmsTxt)
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [loading, setLoading] = useState(false)

  async function regenerate() {
    setLoading(true)
    try {
      const site = { name: '智云科技', domain: 'www.zhiyun-tech.com', description: '专注企业数字化转型与AI应用', pages: [{ title: '产品服务', url: '/products', summary: '产品解决方案' }, { title: '关于我们', url: '/about', summary: '公司简介' }, { title: '联系我们', url: '/contact', summary: '联系方式' }] }
      const res = await fetch('/api/geo/llms-txt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(site) })
      const data = await res.json()
      setContent(data.llmsTxt)
      toast.success('llms.txt 已重新生成')
    } catch { toast.error('生成失败') }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">llms.txt 编辑</h1><p className="text-sm text-muted-foreground">面向大语言模型的站点说明文件</p></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">发布时自动更新</span><Toggle checked={autoUpdate} onChange={setAutoUpdate} /></div>
          <Button variant="secondary" onClick={regenerate} disabled={loading}><RefreshCw className="w-4 h-4" /> {loading ? '生成中...' : '重新生成'}</Button>
          <Button variant="secondary" onClick={() => toast.success('已下载')}><Download className="w-4 h-4" /> 下载</Button>
          <Button onClick={() => toast.success('已保存并发布')}>保存并发布</Button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5">
        <Card>
          <CardHeader><CardTitle>llms.txt 内容</CardTitle><Badge variant="primary">{content.length} 字符</Badge></CardHeader>
          <Textarea rows={20} value={content} onChange={e => setContent(e.target.value)} className="font-mono text-xs" />
        </Card>

        <div>
          <Card className="mb-4">
            <CardHeader><CardTitle>说明</CardTitle></CardHeader>
            <div className="space-y-3 text-sm">
              <div><Label>数据来源</Label><div className="text-muted-foreground">自动从站点配置、页面摘要、内容列表聚合生成</div></div>
              <div><Label>自动更新机制</Label><div className="text-muted-foreground">每次发布站点时自动重新生成</div></div>
              <div><Label>合规说明</Label><div className="text-muted-foreground">仅包含公开内容，不含用户数据</div></div>
              <div><Label>规范</Label><a className="text-primary text-xs" href="https://llmld.org" target="_blank">llmld.org ↗</a></div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>文件切换</CardTitle></CardHeader>
            <Button variant="secondary" className="w-full mb-2">llms.txt（简洁版）</Button>
            <Button variant="ghost" className="w-full">llms-full.txt（详细版）</Button>
          </Card>

          <Alert type="info" className="mt-4"><div className="text-xs">💡 llms.txt 是 GEO 的关键文件，向 AI 搜索引擎声明站点核心内容。Stripe、Cloudflare、Anthropic 等已采用此规范。</div></Alert>
        </div>
      </div>
    </div>
  )
}
