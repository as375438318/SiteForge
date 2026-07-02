import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Alert, CodeBlock, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Play, Bot, AlertCircle } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api'

interface Site {
  id: string
  name?: string
}
interface ContentItem {
  id?: string
  title?: string
  text?: string
  content?: string
  body?: string
  summary?: string
}
interface CitationResult {
  citationProbability?: 'high' | 'medium' | 'low'
  wouldCite?: boolean
  retrievedCount?: number
  simulatedAnswer?: string
  reason?: string
  missingInfo?: string
  suggestions?: string[]
  retrievedContents?: { title?: string; score?: number }[]
  disclaimer?: string
}

export default function GeoCitationTest() {
  const [question, setQuestion] = useState('企业官网怎么提升AI搜索排名')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CitationResult | null>(null)
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [siteId, setSiteId] = useState('default')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let sid = 'default'
        try {
          const sitesRes = await apiClient.get<Site[] | { items?: Site[] }>('/sites')
          const sitesList = Array.isArray(sitesRes) ? sitesRes : (sitesRes as { items?: Site[] })?.items
          if (sitesList && sitesList.length > 0 && sitesList[0].id) {
            sid = sitesList[0].id
          }
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            window.location.href = '/login'
            return
          }
        }
        if (cancelled) return
        setSiteId(sid)

        const data = await apiClient.get<ContentItem[] | { items?: ContentItem[] }>(`/cms/contents/${sid}`)
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data as { items?: ContentItem[] })?.items || []
        setContents(list)
        if (list.length === 0) {
          setLoadError('当前站点暂无内容，无法进行引用测试')
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          window.location.href = '/login'
          return
        }
        setLoadError(e instanceof Error ? e.message : '加载内容失败')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function runTest() {
    if (contents.length === 0) {
      toast.error('暂无可用内容，无法运行测试')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const payload = contents.map((c) => ({
        title: c.title || '',
        text: c.text || c.content || c.body || '',
        summary: c.summary || '',
      }))
      const data = await apiClient.post<CitationResult>('/geo/citation-test', {
        question,
        contents: payload,
      })
      setResult(data)
      toast.success('模拟测试完成')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('测试失败')
    } finally {
      setLoading(false)
    }
  }

  const probMap = {
    high: { color: 'var(--success)', label: '🟢 很可能被引用', desc: '内容质量高，AI搜索很可能引用' },
    medium: { color: 'var(--warning)', label: '🟡 可能被引用', desc: '内容可能被引用，有优化空间' },
    low: { color: 'var(--destructive)', label: '🔴 不太可能被引用', desc: '内容质量不足以被AI引用' },
  }
  const prob = result?.citationProbability ? probMap[result.citationProbability] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">AI 引用模拟测试</h1><p className="text-sm text-muted-foreground">模拟AI搜索的RAG流程，测试内容是否会被引用</p></div>
        <Badge variant="info"><Bot className="w-3 h-3" /> 规则引擎模式</Badge>
      </div>

      {loadError && (
        <Alert type="warning" className="mb-4">
          <div className="text-sm">{loadError}</div>
        </Alert>
      )}

      <Card className="mb-4">
        <div className="grid grid-cols-[1fr_200px_auto] gap-3 items-end">
          <div><label className="block mb-1.5 text-xs font-medium text-muted-foreground">测试问题</label><Input value={question} onChange={e => setQuestion(e.target.value)} /></div>
          <div><label className="block mb-1.5 text-xs font-medium text-muted-foreground">内容范围</label><Select><option>全站内容</option><option>仅博客文章</option><option>仅产品页</option></Select></div>
          <Button onClick={runTest} disabled={loading || contents.length === 0}><Play className="w-3.5 h-3.5" /> {loading ? '测试中...' : '运行测试'}</Button>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          已加载 {contents.length} 篇内容用于测试
        </div>
      </Card>

      {result && prob && (
        <div className="grid grid-cols-[1fr_320px] gap-5">
          <div>
            <div className="rounded-xl p-5 mb-4 border" style={{ background: `${prob.color}15`, borderColor: `${prob.color}40` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: prob.color }}><Bot className="w-6 h-6 text-white" /></div>
                <div><div className="font-semibold text-lg" style={{ color: prob.color }}>{prob.label}</div><div className="text-sm text-muted-foreground">{result.wouldCite ? '✅ 会引用' : '❌ 不会引用'} · {prob.desc}</div></div>
              </div>
            </div>

            <Card className="mb-4">
              <CardHeader><CardTitle>模拟 AI 回答</CardTitle><Badge>{result.retrievedCount || 0} 篇命中</Badge></CardHeader>
              {result.simulatedAnswer ? (
                <CodeBlock>{result.simulatedAnswer}</CodeBlock>
              ) : (
                <EmptyState title="暂无回答" description="后端未返回模拟回答" />
              )}
            </Card>

            {result.reason && <Alert type="info" className="mb-4"><div className="text-sm"><strong>判断依据：</strong>{result.reason}</div></Alert>}
            {result.missingInfo && <Alert type="warning" className="mb-4"><div className="text-sm"><strong>⚠️ 缺失信息：</strong>{result.missingInfo}</div></Alert>}

            {result.suggestions && result.suggestions.length > 0 && (
              <Card>
                <CardHeader><CardTitle>优化建议</CardTitle></CardHeader>
                {result.suggestions.map((s, i) => <Alert key={i} type="info" className="mb-2"><div className="text-xs">💡 {s}</div></Alert>)}
              </Card>
            )}
          </div>

          <div>
            {result.retrievedContents && result.retrievedContents.length > 0 && (
              <Card>
                <CardHeader><CardTitle>检索到的内容</CardTitle></CardHeader>
                {result.retrievedContents.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-t border-border">
                    <span>📄</span><span className="flex-1 text-sm">{c.title}</span>
                    <Badge variant={(c.score || 0) >= 60 ? 'success' : (c.score || 0) >= 40 ? 'warning' : 'danger'}>可引用性 {c.score ?? 0}</Badge>
                  </div>
                ))}
              </Card>
            )}
            {result.disclaimer && (
              <Alert type="info" className="mt-4"><div className="text-xs">{result.disclaimer}</div></Alert>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
