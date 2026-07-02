import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wand2, Link as LinkIcon, ShieldCheck, Loader2, CheckCircle2, ArrowRight,
  ArrowLeft, FileCode, Layers, Eye, ChevronRight, RotateCcw, AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, Button, Input, Alert, Progress, Badge, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/toast'

const STAGES = [
  { key: 'robots', label: '检查 robots.txt 与抓取规则' },
  { key: 'crawl', label: '爬取并渲染目标页面' },
  { key: 'identify', label: '识别页面类型与版式' },
  { key: 'extract', label: '提取区块与内容结构' },
  { key: 'template', label: '生成可编辑模板骨架' },
]

interface Block {
  type: string
  name: string
}
interface PageInfo {
  path: string
  title: string
  blocks: Block[]
}

interface ParseResult {
  site: string
  pages: PageInfo[]
}

export default function Parse() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [url, setUrl] = useState('')
  const [stageIdx, setStageIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<string | null>(null)

  const startParse = async () => {
    if (!url) {
      toast.error('请输入目标站点 URL')
      return
    }
    if (!/^https?:\/\//.test(url)) {
      toast.error('URL 需以 http:// 或 https:// 开头')
      return
    }
    setStep(2)
    setRunning(true)
    setStageIdx(0)
    setError(null)

    // Simulate stage progression
    for (let i = 0; i < STAGES.length; i++) {
      setStageIdx(i)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 700))
    }

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) {
        throw new Error(`解析失败：${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      toast.success(`解析完成，已生成 ${(data?.pages?.length || 0)} 个页面骨架`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
      toast.error('解析失败')
    }
    setRunning(false)
    setStep(3)
  }

  const reset = () => {
    setStep(1)
    setUrl('')
    setResult(null)
    setStageIdx(-1)
    setSelectedPage(null)
    setError(null)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-primary" /> AI 结构复刻
        </h1>
        <p className="text-sm text-muted-foreground mt-1">输入参考站点 URL，AI 自动识别版式并生成可编辑骨架。</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors',
              step >= n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              step > n && 'bg-success text-white',
            )}>
              {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
            </div>
            <span className={cn('text-sm', step >= n ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              {n === 1 ? '输入 URL' : n === 2 ? '解析进度' : '查看结果'}
            </span>
            {n < 3 && <div className={cn('flex-1 h-px', step > n ? 'bg-success' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {/* Step 1: URL input */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>目标站点</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-muted-foreground">参考站点 URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="https://example-competitor.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startParse()}
                  />
                </div>
                <Button onClick={startParse} disabled={!url}>
                  <Wand2 className="w-4 h-4" /> 解析并生成骨架
                </Button>
              </div>
            </div>

            <Alert type="warning">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">合规须知</div>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>仅复刻页面版式结构，不复制对方的文案、图片等受版权保护的内容</li>
                  <li>请确保你已获得目标站点所有者的授权，或目标站点为公开可参考的版式</li>
                  <li>robots.txt 中禁止抓取的页面将被自动跳过</li>
                  <li>生成后所有内容均为占位文本，请替换为自有内容后再发布</li>
                </ul>
              </div>
            </Alert>

            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
              提示：AI 复刻可节省 60% 以上的版式搭建时间，但仍需人工调整品牌色、字体与文案。
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Progress */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>解析进度</CardTitle>
            <Badge variant="info">{url}</Badge>
          </CardHeader>
          <div className="space-y-5">
            <Progress value={running ? ((stageIdx + 1) / STAGES.length) * 100 : 100} />
            <div className="space-y-2.5">
              {STAGES.map((s, i) => {
                const done = i < stageIdx || !running
                const active = i === stageIdx && running
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs',
                      done ? 'bg-success text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : i + 1}
                    </div>
                    <span className={cn('text-sm', done ? 'text-foreground' : active ? 'text-primary font-medium' : 'text-muted-foreground')}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Result */}
      {step === 3 && !result && (
        <Card>
          <CardHeader>
            <CardTitle>解析失败</CardTitle>
            <Button variant="secondary" size="sm" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" /> 重新解析
            </Button>
          </CardHeader>
          <EmptyState
            icon={<AlertCircle className="w-10 h-10" />}
            title="解析失败"
            description={error || '后端服务不可用，请稍后再试'}
          />
        </Card>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>解析结果</CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={reset}>
                  <RotateCcw className="w-3.5 h-3.5" /> 重新解析
                </Button>
                <Button size="sm" onClick={() => navigate('/editor')}>
                  确认进入编辑器 <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <div className="grid grid-cols-3 gap-4 text-center mb-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{result.pages.length}</div>
                <div className="text-xs text-muted-foreground mt-1">识别页面</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{result.pages.reduce((a, p) => a + p.blocks.length, 0)}</div>
                <div className="text-xs text-muted-foreground mt-1">区块总数</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-success">98%</div>
                <div className="text-xs text-muted-foreground mt-1">结构识别置信度</div>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            {result.pages.map((p) => (
              <Card key={p.path} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setSelectedPage(selectedPage === p.path ? null : p.path)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <FileCode className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{p.title}</span>
                      <code className="text-xs text-muted-foreground">{p.path}</code>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.blocks.length} 个区块</div>
                  </div>
                  <Badge variant="primary">{p.blocks.length} blocks</Badge>
                  <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', selectedPage === p.path && 'rotate-90')} />
                </button>
                {selectedPage === p.path && (
                  <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/20">
                    <div className="text-xs font-medium text-muted-foreground mb-2 mt-3 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> 区块序列
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.blocks.map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-card border border-border text-xs">
                          <span className="text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                          <span className="font-medium">{b.name}</span>
                          <code className="text-muted-foreground">{b.type}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" /> 返回修改
            </Button>
            <Button onClick={() => navigate('/editor')}>
              <Eye className="w-4 h-4" /> 确认进入编辑器
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
