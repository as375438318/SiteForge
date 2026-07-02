import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Eye, Check, Sparkles, AlertCircle } from 'lucide-react'
import { Card, CardTitle, Button, Select, Badge, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/toast'
import { apiClient, ApiError } from '@/lib/api'

const INDUSTRIES = ['全部', 'SaaS 软件', '企业官网', '电商零售', '教育培训', '医疗健康', '金融服务', '制造业']

const TONES = [
  { value: 'all', label: '全部色调' },
  { value: 'blue', label: '商务蓝' },
  { value: 'purple', label: '科技紫' },
  { value: 'green', label: '自然绿' },
  { value: 'orange', label: '活力橙' },
  { value: 'dark', label: '暗黑系' },
]

interface Template {
  id: string
  name?: string
  title?: string
  industry?: string
  tone?: string
  gradient?: string
  seoScore?: number
  geoScore?: number
}

const DEFAULT_GRADIENT = 'from-slate-500 via-slate-600 to-slate-700'

export default function Templates() {
  const navigate = useNavigate()
  const [industry, setIndustry] = useState('全部')
  const [tone, setTone] = useState('all')
  const [hovered, setHovered] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.get<Template[] | { items?: Template[] }>('/templates')
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data as { items?: Template[] })?.items || []
        setTemplates(list)
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
  }, [])

  const filtered = templates.filter((t) => {
    if (industry !== '全部' && t.industry !== industry) return false
    if (tone !== 'all' && t.tone !== tone) return false
    return true
  })

  const apply = (t: Template) => {
    toast.success(`已应用模板「${t.name || t.title || ''}」，正在进入编辑器...`)
    setTimeout(() => navigate('/editor'), 600)
  }

  const preview = (t: Template) => {
    toast.info(`正在预览「${t.name || t.title || ''}」...`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" /> 模板库
          </h1>
          <p className="text-sm text-muted-foreground mt-1">精选行业模板，开箱即用。已应用 SEO 与 GEO 最佳实践。</p>
        </div>
        <Badge variant="primary">{filtered.length} / {templates.length} 个模板</Badge>
      </div>

      {/* Filters */}
      <Card className="!py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">行业：</span>
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                industry === ind ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {ind}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">色调：</span>
            <Select value={tone} onChange={(e) => setTone(e.target.value)} className="w-32">
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="p-16 text-center text-muted-foreground">加载中...</div>
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-10 h-10" />} title="加载失败" description={error} />
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <div>未找到匹配的模板，试试调整筛选条件</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="!p-0 overflow-hidden group" onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}>
              {/* Thumbnail */}
              <div className={cn('relative aspect-[4/3] bg-gradient-to-br', t.gradient || DEFAULT_GRADIENT)}>
                <div className="absolute inset-0 p-4 flex flex-col gap-1.5">
                  <div className="h-2 w-12 bg-white/40 rounded" />
                  <div className="h-1.5 w-20 bg-white/25 rounded mt-1" />
                  <div className="flex-1 grid grid-cols-3 gap-1.5 mt-2">
                    <div className="bg-white/20 rounded col-span-2" />
                    <div className="bg-white/15 rounded" />
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <div className="h-1.5 flex-1 bg-white/20 rounded" />
                    <div className="h-1.5 flex-1 bg-white/20 rounded" />
                    <div className="h-1.5 flex-1 bg-white/20 rounded" />
                  </div>
                </div>
                {hovered === t.id && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-2 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => preview(t)}>
                      <Eye className="w-3.5 h-3.5" /> 预览
                    </Button>
                    <Button size="sm" onClick={() => apply(t)}>
                      <Check className="w-3.5 h-3.5" /> 应用
                    </Button>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {t.industry && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/90 text-gray-800">{t.industry}</span>}
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-sm">{t.name || t.title || '未命名'}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {typeof t.seoScore === 'number' && <Badge variant="success">SEO {t.seoScore}</Badge>}
                  {typeof t.geoScore === 'number' && <Badge variant="info">GEO {t.geoScore}</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground pt-2">
        模板已内置 SEO 结构化数据与 llms.txt，应用后可在编辑器中自由调整
      </div>
    </div>
  )
}
