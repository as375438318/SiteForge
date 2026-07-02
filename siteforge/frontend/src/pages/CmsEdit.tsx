import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, CardTitle, Input, Textarea, Select, Label, ScoreCard, ScoreBar, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Bot, AlertCircle } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api'

const DEFAULT_TEXT = ''

interface Site {
  id: string
  name?: string
}
interface GeoScoreData {
  total: number
  dimensions: { dimensionKey?: string; dimension?: string; score: number; maxScore: number }[]
}
interface ContentDetail {
  id?: string
  title?: string
  category?: string
  type?: string
  status?: string
  text?: string
  content?: string
  body?: string
  author?: string
  authorTitle?: string
  publishedAt?: string
  slug?: string
  seoMeta?: { title?: string; description?: string }
}

export default function CmsEdit() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const id = params.get('id') || ''
  const [text, setText] = useState(DEFAULT_TEXT)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('GEO')
  const [slug, setSlug] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [author, setAuthor] = useState('')
  const [authorTitle, setAuthorTitle] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [seoOpen, setSeoOpen] = useState(false)
  const [score, setScore] = useState(0)
  const [dimensions, setDimensions] = useState<{ name: string; score: number; max: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [siteId, setSiteId] = useState('default')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
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

        if (id) {
          const data = await apiClient.get<ContentDetail>(`/cms/content/${id}`)
          if (cancelled) return
          if (data) {
            setTitle(data.title || '')
            setCategory(data.category || data.type || 'GEO')
            setText(data.text || data.content || data.body || '')
            setSlug(data.slug || '')
            setAuthor(data.author || '')
            setAuthorTitle(data.authorTitle || '')
            setPublishedAt(data.publishedAt || '')
            if (data.seoMeta) {
              setSeoTitle(data.seoMeta.title || '')
              setSeoDesc(data.seoMeta.description || '')
            }
          }
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          window.location.href = '/login'
          return
        }
        setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function rescore() {
    setScoring(true)
    try {
      const data = await apiClient.post<GeoScoreData>('/geo/score', {
        text,
        html: text,
        meta: { author, authorTitle, publishedAt },
      })
      setScore(data.total)
      const dimMap: Record<string, string> = {
        factDensity: '事实陈述密度', structure: '结构化程度', citations: '引用来源',
        authority: '权威性信号', completeness: '内容完整度', semanticClarity: '语义清晰度',
      }
      setDimensions(
        (data.dimensions || []).map((d) => ({
          name: dimMap[d.dimensionKey || ''] || d.dimension || '维度',
          score: d.score,
          max: d.maxScore,
        })),
      )
      toast.success(`可引用性评分: ${data.total} 分`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('评分失败')
    } finally {
      setScoring(false)
    }
  }

  async function save() {
    if (!title.trim()) {
      toast.error('请填写标题')
      return
    }
    setSaving(true)
    try {
      const payload = {
        siteId,
        title,
        category,
        type: category,
        text,
        content: text,
        body: text,
        author,
        authorTitle,
        publishedAt,
        slug,
        seoMeta: { title: seoTitle, description: seoDesc },
      }
      if (id) {
        await apiClient.put(`/cms/content/${id}`, payload)
      } else {
        const res = await apiClient.post<{ id?: string }>('/cms/content', payload)
        if (res?.id) {
          toast.success('内容已保存')
          navigate(`/cms/edit?id=${res.id}`)
          return
        }
      }
      toast.success('内容已保存')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>
  }
  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-10 h-10" />}
        title="加载失败"
        description={error}
        action={<Button variant="secondary" onClick={() => navigate('/cms')}>返回列表</Button>}
      />
    )
  }

  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'
  const scoreLabel = score >= 80 ? '优秀 · 极易被AI引用' : score >= 60 ? '良好 · 可被AI引用' : score >= 40 ? '一般 · 需优化' : '较差 · 需重点优化'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">编辑内容</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/cms')}>取消</Button>
          <Button onClick={save} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        {/* Left: Editor */}
        <div>
          <Card className="mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><Label>标题</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div><Label>分类</Label><Select value={category} onChange={(e) => setCategory(e.target.value)}><option>GEO</option><option>SEO</option><option>产品</option></Select></div>
            </div>
            <div className="mb-4"><Label>封面图</Label><div className="border-2 border-dashed border-border rounded-lg h-32 flex items-center justify-center text-muted-foreground text-sm cursor-pointer hover:border-primary">点击上传封面图</div></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><Label>自定义字段：规格</Label><Input placeholder="如：标准版" /></div>
              <div><Label>自定义字段：价格</Label><Input placeholder="如：¥999/年" /></div>
            </div>
            <Label>正文</Label>
            <Textarea rows={14} value={text} onChange={e => setText(e.target.value)} />
          </Card>

          {/* SEO TDK */}
          <Card>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setSeoOpen(!seoOpen)}>
              <CardTitle>SEO 设置（TDK）</CardTitle>
              {seoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            {seoOpen && (
              <div className="mt-4">
                <div className="mb-3"><Label>SEO 标题</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO标题（≤60字符）" /></div>
                <div className="mb-3"><Label>SEO 描述</Label><Textarea rows={2} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="SEO描述（≤160字符）" /></div>
                <div><Label>URL Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: GEO Panel */}
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="w-4 h-4" /> 可引用性评分</CardTitle>
              <Button size="sm" onClick={rescore} disabled={scoring}>{scoring ? '评分中...' : '重新评分'}</Button>
            </CardHeader>
            <ScoreCard score={score} label={scoreLabel} color={scoreColor} />
            <div className="mt-4">
              {dimensions.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">点击「重新评分」获取维度数据</div>
              ) : (
                dimensions.map((d, i) => <ScoreBar key={i} {...d} />)
              )}
            </div>
          </Card>

          <Card className="mb-4">
            <CardHeader><CardTitle>权威信号配置</CardTitle></CardHeader>
            <div className="mb-3"><Label>作者</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
            <div className="mb-3"><Label>作者头衔</Label><Input value={authorTitle} onChange={(e) => setAuthorTitle(e.target.value)} /></div>
            <div className="mb-3"><Label>发布时间</Label><Input value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} /></div>
            <div><Label>作者简介</Label><Textarea rows={2} placeholder="作者简介..." /></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
