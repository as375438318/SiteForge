import { Card, CardHeader, CardTitle, Button, Textarea, Badge, Alert, Toggle, Label, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { RefreshCw, Download, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiClient, ApiError } from '@/lib/api'

interface Site {
  id: string
  name?: string
  domain?: string
  description?: string
}

export default function GeoLlmsTxt() {
  const [content, setContent] = useState('')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [site, setSite] = useState<Site | null>(null)
  const [initLoading, setInitLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setInitLoading(true)
      setInitError(null)
      try {
        const sitesRes = await apiClient.get<Site[] | { items?: Site[] }>('/sites')
        if (cancelled) return
        const list = Array.isArray(sitesRes) ? sitesRes : (sitesRes as { items?: Site[] })?.items || []
        const s = list.length > 0 ? list[0] : { id: 'default' }
        setSite(s)
        // 站点信息填充为 llms.txt 默认内容
        setContent(buildDefaultLlmsTxt(s))
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          window.location.href = '/login'
          return
        }
        setInitError(e instanceof Error ? e.message : '加载失败')
      } finally {
        if (!cancelled) setInitLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function buildDefaultLlmsTxt(s: Site): string {
    const name = s.name || '我的站点'
    const domain = s.domain || ''
    const desc = s.description || ''
    return `# ${name}\n\n> ${desc}\n\n## 主要内容\n\n- 主页: ${domain ? `https://${domain}/` : '/'} - ${name}\n`
  }

  async function regenerate() {
    if (!site) return
    setLoading(true)
    try {
      const data = await apiClient.post<{ llmsTxt?: string; content?: string }>('/geo/llms-txt', {
        site: {
          id: site.id,
          name: site.name || '',
          domain: site.domain || '',
          description: site.description || '',
          pages: [],
        },
      })
      if (data?.llmsTxt) setContent(data.llmsTxt)
      else if (data?.content) setContent(data.content)
      toast.success('llms.txt 已重新生成')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('生成失败')
    } finally {
      setLoading(false)
    }
  }

  async function publish() {
    if (!site) return
    setPublishing(true)
    try {
      await apiClient.post('/ssg/generate', { site: { ...site, llmsTxt: content } })
      toast.success('已保存并发布')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('发布失败')
    } finally {
      setPublishing(false)
    }
  }

  function download() {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'llms.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已下载')
  }

  if (initLoading) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>
  }
  if (initError) {
    return <EmptyState icon={<AlertCircle className="w-10 h-10" />} title="加载失败" description={initError} />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">llms.txt 编辑</h1><p className="text-sm text-muted-foreground">面向大语言模型的站点说明文件</p></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">发布时自动更新</span><Toggle checked={autoUpdate} onChange={setAutoUpdate} /></div>
          <Button variant="secondary" onClick={regenerate} disabled={loading}><RefreshCw className="w-4 h-4" /> {loading ? '生成中...' : '重新生成'}</Button>
          <Button variant="secondary" onClick={download}><Download className="w-4 h-4" /> 下载</Button>
          <Button onClick={publish} disabled={publishing}>{publishing ? '发布中...' : '保存并发布'}</Button>
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
              <div><Label>规范</Label><a className="text-primary text-xs" href="https://llmld.org" target="_blank" rel="noreferrer">llmld.org ↗</a></div>
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
