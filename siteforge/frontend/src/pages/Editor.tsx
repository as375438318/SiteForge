import { useState } from 'react'
import { Button, Card, CardHeader, CardTitle, Input, Select, Label, Badge } from '@/components/ui'
import { toast } from '@/stores/toast'
import { MousePointerClick, Save, Undo, Redo, Eye, Rocket } from 'lucide-react'

const components = [
  { type: 'hero', label: 'Hero 大图区' }, { type: 'feature_grid', label: '特性网格' },
  { type: 'product_grid', label: '产品网格' }, { type: 'case_list', label: '案例列表' },
  { type: 'page_header', label: '页面标题' }, { type: 'text_image', label: '图文介绍' },
  { type: 'team', label: '团队介绍' }, { type: 'cta', label: '行动号召' },
  { type: 'contact_info', label: '联系信息' }, { type: 'form', label: '表单' },
  { type: 'stats', label: '数据统计' }, { type: 'faq', label: '常见问答' },
  { type: 'testimonial', label: '客户评价' }, { type: 'map', label: '地图' },
  { type: 'footer', label: '页脚' }, { type: 'breadcrumb', label: '面包屑' },
]

export default function Editor() {
  const [selected, setSelected] = useState<number | null>(0)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewHtml, setPreviewHtml] = useState<string>('')

  const pageBlocks = [
    { type: 'hero', props: { title: '智云科技', subtitle: '专注企业数字化转型', cta: '了解更多' } },
    { type: 'feature_grid', props: { title: '核心优势', items: [{ icon: '⚡', title: '高效建站', desc: '10分钟完成' }, { icon: '🔍', title: 'SEO优化', desc: '搜得到' }, { icon: '🤖', title: 'GEO优化', desc: 'AI引得到' }] } },
    { type: 'cta', props: { title: '联系我们', button: '立即咨询' } },
  ]

  async function handlePreview() {
    const site = { name: '智云科技', domain: 'www.zhiyun-tech.com', description: '专注企业数字化转型', navigation: [{ label: '首页', url: '/' }] }
    const page = { url: '/', title: '首页', seoMeta: { title: '智云科技', description: '专注企业数字化转型' }, blocks: pageBlocks.map((b, i) => ({ ...b, sortOrder: i })) }
    try {
      const res = await fetch('/api/ssg/preview-page', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site, page }) })
      const data = await res.json()
      setPreviewHtml(data.html)
      toast.success('预览已更新')
    } catch { toast.error('预览失败') }
  }

  const vpWidths = { desktop: '100%', tablet: '768px', mobile: '375px' }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6">
      {/* Left: Component Library */}
      <div className="w-56 border-r border-border bg-card overflow-y-auto flex-shrink-0">
        <div className="p-3 text-xs font-semibold text-muted-foreground uppercase">组件库</div>
        {components.map((c, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer border-b border-border hover:bg-primary/10 hover:text-primary text-muted-foreground hover:text-foreground">
            <MousePointerClick className="w-4 h-4" /> {c.label}
          </div>
        ))}
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="h-12 border-b border-border flex items-center px-4 gap-2 bg-card">
          <Select className="w-40"><option>首页 /</option><option>产品 /products</option><option>关于 /about</option></Select>
          <div className="flex-1" />
          <Button variant="ghost" size="sm"><Undo className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm"><Redo className="w-3.5 h-3.5" /></Button>
          <div className="w-px h-5 bg-border mx-1" />
          {(['desktop', 'tablet', 'mobile'] as const).map(vp => (
            <Button key={vp} variant={viewport === vp ? 'primary' : 'ghost'} size="sm" onClick={() => setViewport(vp)}>{vp === 'desktop' ? '🖥️' : vp === 'tablet' ? '📱' : '📱'}</Button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={handlePreview}><Eye className="w-3.5 h-3.5" /> 预览</Button>
          <Button size="sm"><Save className="w-3.5 h-3.5" /> 保存</Button>
          <Button size="sm" onClick={() => toast.success('发布中...')}><Rocket className="w-3.5 h-3.5" /> 发布</Button>
        </div>
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          {previewHtml ? (
            <iframe srcDoc={previewHtml} className="bg-white rounded-lg shadow-md" style={{ width: vpWidths[viewport], height: '100%', border: 'none' }} />
          ) : (
            <div className="bg-white rounded-lg shadow-md w-full max-w-4xl min-h-[500px] flex items-center justify-center text-gray-400">
              点击"预览"查看页面效果
            </div>
          )}
        </div>
      </div>

      {/* Right: Properties */}
      <div className="w-72 border-l border-border bg-card overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">区块属性</div>
          {selected !== null && pageBlocks[selected] ? (
            <>
              <Label>类型</Label>
              <div className="mb-3"><Badge variant="primary">{pageBlocks[selected].type}</Badge></div>
              {Object.entries(pageBlocks[selected].props).map(([key, val]) => (
                typeof val === 'string' ? (
                  <div key={key} className="mb-3"><Label>{key}</Label><Input defaultValue={val as string} /></div>
                ) : null
              ))}
            </>
          ) : <div className="text-sm text-muted-foreground">选择区块编辑属性</div>}
        </div>
        <div className="p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">样式</div>
          <Label>主题色</Label>
          <div className="flex gap-2 mb-3">
            {['#4f46e5', '#0ea5e9', '#22c55e', '#f97316', '#ec4899'].map(c => (
              <div key={c} className="w-7 h-7 rounded-full cursor-pointer border-2 border-transparent hover:border-primary" style={{ background: c }} />
            ))}
          </div>
          <Label>字体</Label>
          <Select><option>系统默认</option><option>思源黑体</option><option>鸿蒙字体</option></Select>
        </div>
      </div>
    </div>
  )
}
