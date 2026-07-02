import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Eye, Check, Sparkles } from 'lucide-react'
import { Card, CardTitle, Button, Select, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/toast'

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
  name: string
  industry: string
  tone: string
  gradient: string
  seoScore: number
  geoScore: number
}

const TEMPLATES: Template[] = [
  { id: 't1', name: 'Nebula SaaS', industry: 'SaaS 软件', tone: 'purple', gradient: 'from-purple-500 via-violet-500 to-indigo-600', seoScore: 92, geoScore: 88 },
  { id: 't2', name: 'Apex 企业', industry: '企业官网', tone: 'blue', gradient: 'from-blue-500 via-cyan-500 to-teal-500', seoScore: 90, geoScore: 82 },
  { id: 't3', name: 'Bazaar 商城', industry: '电商零售', tone: 'orange', gradient: 'from-orange-500 via-amber-500 to-yellow-500', seoScore: 85, geoScore: 70 },
  { id: 't4', name: 'EduPro 学院', industry: '教育培训', tone: 'green', gradient: 'from-emerald-500 via-green-500 to-lime-500', seoScore: 88, geoScore: 79 },
  { id: 't5', name: 'MedCare 健康', industry: '医疗健康', tone: 'blue', gradient: 'from-sky-400 via-blue-400 to-cyan-400', seoScore: 86, geoScore: 75 },
  { id: 't6', name: 'FinEdge 金融', industry: '金融服务', tone: 'dark', gradient: 'from-slate-700 via-gray-800 to-zinc-900', seoScore: 91, geoScore: 84 },
  { id: 't7', name: 'FactoryPro', industry: '制造业', tone: 'orange', gradient: 'from-red-500 via-orange-500 to-amber-500', seoScore: 83, geoScore: 71 },
  { id: 't8', name: 'Quantum Tech', industry: 'SaaS 软件', tone: 'purple', gradient: 'from-fuchsia-500 via-purple-500 to-violet-600', seoScore: 94, geoScore: 90 },
]

export default function Templates() {
  const navigate = useNavigate()
  const [industry, setIndustry] = useState('全部')
  const [tone, setTone] = useState('all')
  const [hovered, setHovered] = useState<string | null>(null)

  const filtered = TEMPLATES.filter((t) => {
    if (industry !== '全部' && t.industry !== industry) return false
    if (tone !== 'all' && t.tone !== tone) return false
    return true
  })

  const apply = (t: Template) => {
    toast.success(`已应用模板「${t.name}」，正在进入编辑器...`)
    setTimeout(() => navigate('/editor'), 600)
  }

  const preview = (t: Template) => {
    toast.info(`正在预览「${t.name}」...`)
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
        <Badge variant="primary">{filtered.length} / {TEMPLATES.length} 个模板</Badge>
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16 text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <div>未找到匹配的模板，试试调整筛选条件</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="!p-0 overflow-hidden group" onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}>
              {/* Thumbnail */}
              <div className={cn('relative aspect-[4/3] bg-gradient-to-br', t.gradient)}>
                {/* mock layout */}
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
                {/* hover overlay */}
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
                {/* badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/90 text-gray-800">{t.industry}</span>
                </div>
              </div>

              {/* Meta */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="success">SEO {t.seoScore}</Badge>
                  <Badge variant="info">GEO {t.geoScore}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        模板已内置 SEO 结构化数据与 llms.txt，应用后可在编辑器中自由调整
      </div>
    </div>
  )
}
