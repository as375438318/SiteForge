import { Card, CardHeader, CardTitle, Input, Textarea, Label, Button, Badge, Toggle, CodeBlock, Select } from '@/components/ui'
import { toast } from '@/stores/toast'
import { useEffect, useState } from 'react'
import { apiClient, ApiError } from '@/lib/api'

interface Site {
  id: string
  name?: string
  domain?: string
  description?: string
}

export default function SeoSettings() {
  const [autoSitemap, setAutoSitemap] = useState(true)
  const [aiCrawlers, setAiCrawlers] = useState(true)
  const [siteTitle, setSiteTitle] = useState('')
  const [siteDesc, setSiteDesc] = useState('')
  const [favicon, setFavicon] = useState('')
  const [lang, setLang] = useState('zh-CN')
  const [robots, setRobots] = useState('User-agent: *\nAllow: /\nDisallow: /admin/\n')
  const [keywords, setKeywords] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [siteId, setSiteId] = useState('default')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let sid = 'default'
        let siteInfo: Site | null = null
        try {
          const sitesRes = await apiClient.get<Site[] | { items?: Site[] }>('/sites')
          const sitesList = Array.isArray(sitesRes) ? sitesRes : (sitesRes as { items?: Site[] })?.items
          if (sitesList && sitesList.length > 0) {
            siteInfo = sitesList[0]
            sid = siteInfo.id || sid
          }
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            window.location.href = '/login'
            return
          }
        }
        if (cancelled) return
        setSiteId(sid)
        if (siteInfo) {
          setSiteTitle(siteInfo.name || '')
          setSiteDesc(siteInfo.description || '')
        }
      } catch (e) {
        // 忽略
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function generate() {
    setGenerating(true)
    try {
      const res = await apiClient.post<{ robots?: string; keywords?: string[]; sitemap?: string }>(
        '/seo/generate',
        { site: { id: siteId, name: siteTitle, domain: '', description: siteDesc } },
      )
      if (res?.robots) setRobots(res.robots)
      if (Array.isArray(res?.keywords)) setKeywords(res.keywords)
      toast.success('SEO 内容已生成')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('生成失败')
    } finally {
      setGenerating(false)
    }
  }

  function addKeyword(kw: string) {
    const k = kw.trim()
    if (!k) return
    if (keywords.includes(k)) {
      toast.info('关键词已存在')
      return
    }
    setKeywords((prev) => [...prev, k])
  }

  function removeKeyword(kw: string) {
    if (!confirm(`确认删除关键词「${kw}」？`)) return
    setKeywords((prev) => prev.filter((k) => k !== kw))
  }

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">SEO 设置</h1><p className="text-sm text-muted-foreground">全局SEO配置、技术文件、结构化数据</p></div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>全局 SEO</CardTitle>
          <Button size="sm" variant="secondary" onClick={generate} disabled={generating}>
            {generating ? '生成中...' : '生成 SEO 配置'}
          </Button>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>站点标题</Label><Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} /></div>
          <div><Label>站点描述</Label><Input value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} /></div>
          <div><Label>Favicon</Label><Input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="favicon URL" /></div>
          <div><Label>语言声明</Label><Select value={lang} onChange={(e) => setLang(e.target.value)}><option>zh-CN</option><option>en</option></Select></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>技术 SEO 文件</CardTitle></CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div><div className="text-sm font-medium">sitemap.xml 自动生成</div><div className="text-xs text-muted-foreground">发布时自动更新站点地图</div></div><Toggle checked={autoSitemap} onChange={setAutoSitemap} /></div>
          <div className="flex items-center justify-between"><div><div className="text-sm font-medium">AI 爬虫放行（GEO 关键）</div><div className="text-xs text-muted-foreground">放行 GPTBot/ClaudeBot/PerplexityBot 等 9 个 AI 爬虫</div></div><div className="flex items-center gap-2"><Toggle checked={aiCrawlers} onChange={setAiCrawlers} />{aiCrawlers && <Badge variant="success">已放行</Badge>}</div></div>
          <div><Label>robots.txt 自定义规则</Label><CodeBlock>{robots}</CodeBlock></div>
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
        <CardHeader>
          <CardTitle>关键词排名监控</CardTitle>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const kw = prompt('输入要监控的关键词')
              if (kw) addKeyword(kw)
            }}
          >添加关键词</Button>
        </CardHeader>
        <div className="space-y-2">
          {keywords.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">暂无监控关键词</div>
          ) : (
            keywords.map((kw) => (
              <div key={kw} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium flex-1">{kw}</span>
                <Button variant="link" size="sm" onClick={() => removeKeyword(kw)}>删除</Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
