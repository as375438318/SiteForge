import { useState } from 'react'
import { Button, Card, CardHeader, CardTitle, Input, Textarea, Select, Label, Badge, ScoreCard, ScoreBar, Alert, CodeBlock } from '@/components/ui'
import { toast } from '@/stores/toast'
import { ChevronDown, ChevronUp, Bot } from 'lucide-react'

const sampleText = `## 企业官网如何提升 AI 搜索排名

2025年，用户搜索行为正从传统搜索引擎向 AI 搜索迁移。据 Gartner 预测，到2026年底传统搜索流量将下降25%。

Princeton/Georgia Tech 的 GEO 论文（KDD 2024）实证：专家引言提升可见性41%，统计数据提升33%，引用来源提升28%。

### 如何提升？

1. 生成 llms.txt 文件
2. 提升内容可引用性（补数据、FAQ、引用来源）
3. 放行 AI 爬虫（robots.txt）
4. 注入 Schema.org 结构化数据

> "GEO 是企业官网未来2-3年的新增长杠杆" —— 张明，SEO/GEO专家

来源：Princeton GEO 论文、Gartner 2024报告`

export default function CmsEdit() {
  const [text, setText] = useState(sampleText)
  const [seoOpen, setSeoOpen] = useState(false)
  const [score, setScore] = useState(64)
  const [dimensions, setDimensions] = useState([
    { name: '事实陈述密度', score: 15, max: 20 },
    { name: '结构化程度', score: 16, max: 20 },
    { name: '引用来源', score: 8, max: 15 },
    { name: '权威性信号', score: 12, max: 15 },
    { name: '内容完整度', score: 7, max: 15 },
    { name: '语义清晰度', score: 6, max: 15 },
  ])
  const [loading, setLoading] = useState(false)

  async function rescore() {
    setLoading(true)
    try {
      const res = await fetch('/api/geo/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, html: text, meta: { author: '张明', authorTitle: 'SEO专家', publishedAt: '2025-07-01' } }),
      })
      const data = await res.json()
      setScore(data.total)
      const dimMap: Record<string, string> = { factDensity: '事实陈述密度', structure: '结构化程度', citations: '引用来源', authority: '权威性信号', completeness: '内容完整度', semanticClarity: '语义清晰度' }
      setDimensions(data.dimensions.map((d: any) => ({ name: dimMap[d.dimensionKey] || d.dimension, score: d.score, max: d.maxScore })))
      toast.success(`可引用性评分: ${data.total} 分`)
    } catch { toast.error('评分失败') }
    setLoading(false)
  }

  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'
  const scoreLabel = score >= 80 ? '优秀 · 极易被AI引用' : score >= 60 ? '良好 · 可被AI引用' : score >= 40 ? '一般 · 需优化' : '较差 · 需重点优化'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">编辑内容</h1>
        <div className="flex gap-2"><Button variant="secondary">取消</Button><Button onClick={() => toast.success('内容已保存')}>保存</Button></div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        {/* Left: Editor */}
        <div>
          <Card className="mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><Label>标题</Label><Input defaultValue="企业官网如何提升AI搜索排名" /></div>
              <div><Label>分类</Label><Select><option>GEO</option><option>SEO</option><option>产品</option></Select></div>
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
            {seoOpen && <div className="mt-4"><div className="mb-3"><Label>SEO 标题</Label><Input placeholder="SEO标题（≤60字符）" /></div><div className="mb-3"><Label>SEO 描述</Label><Textarea rows={2} placeholder="SEO描述（≤160字符）" /></div><div><Label>URL Slug</Label><Input defaultValue="geo-optimization-guide" /></div></div>}
          </Card>
        </div>

        {/* Right: GEO Panel */}
        <div>
          <Card className="mb-4">
            <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="w-4 h-4" /> 可引用性评分</CardTitle><Button size="sm" onClick={rescore} disabled={loading}>{loading ? '评分中...' : '重新评分'}</Button></CardHeader>
            <ScoreCard score={score} label={scoreLabel} color={scoreColor} />
            <div className="mt-4">{dimensions.map((d, i) => <ScoreBar key={i} {...d} />)}</div>
          </Card>

          <Card className="mb-4">
            <CardHeader><CardTitle>优化提示</CardTitle><Badge variant="warning">3项</Badge></CardHeader>
            <Alert type="warning" className="mb-2"><div className="text-xs">📌 <strong>完整性不足</strong>：建议补充"已服务200+企业"等具体数字</div></Alert>
            <Alert type="info" className="mb-2"><div className="text-xs">💡 <strong>权威信号缺失</strong>：建议填写作者头衔</div></Alert>
            <Alert type="info"><div className="text-xs">💡 <strong>结构化建议</strong>：可将核心能力改为FAQ结构</div></Alert>
            <Button variant="secondary" size="sm" className="w-full mt-3">应用 GEO 写作模板</Button>
          </Card>

          <Card>
            <CardHeader><CardTitle>权威信号配置</CardTitle></CardHeader>
            <div className="mb-3"><Label>作者</Label><Input defaultValue="张明" /></div>
            <div className="mb-3"><Label>作者头衔</Label><Input defaultValue="SEO/GEO专家" /></div>
            <div className="mb-3"><Label>发布时间</Label><Input defaultValue="2025-07-01" /></div>
            <div><Label>作者简介</Label><Textarea rows={2} placeholder="作者简介..." /></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
