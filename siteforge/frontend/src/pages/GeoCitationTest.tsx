import { useState } from 'react'
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Alert, CodeBlock } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Play, Bot } from 'lucide-react'

export default function GeoCitationTest() {
  const [question, setQuestion] = useState('企业官网怎么提升AI搜索排名')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function runTest() {
    setLoading(true)
    setResult(null)
    const contents = [
      { title: '企业官网如何提升AI搜索排名', text: 'GEO是面向AI搜索的优化方法。专家引言提升可见性41%。建议生成llms.txt文件、放行AI爬虫。某企业90天内AI引用通过率从15%提升至68%。', summary: 'GEO优化指南' },
      { title: 'SiteForge建站系统', text: 'SiteForge是本地部署的企业官网搭建系统，支持AI结构复刻、SEO优化、GEO生成式引擎优化。数据100%存本地。', summary: '产品介绍' },
      { title: 'llms.txt规范', text: 'llms.txt是面向大语言模型的站点说明文件。由Jeremy Howard提出。包含站点名称、简介、核心页面链接与摘要。', summary: '技术规范' },
    ]
    try {
      const res = await fetch('/api/geo/citation-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, contents }) })
      const data = await res.json()
      setResult(data)
      toast.success('模拟测试完成')
    } catch { toast.error('测试失败') }
    setLoading(false)
  }

  const probMap = {
    high: { color: 'var(--success)', label: '🟢 很可能被引用', desc: '内容质量高，AI搜索很可能引用' },
    medium: { color: 'var(--warning)', label: '🟡 可能被引用', desc: '内容可能被引用，有优化空间' },
    low: { color: 'var(--destructive)', label: '🔴 不太可能被引用', desc: '内容质量不足以被AI引用' },
  }
  const prob = result ? probMap[result.citationProbability as keyof typeof probMap] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">AI 引用模拟测试</h1><p className="text-sm text-muted-foreground">模拟AI搜索的RAG流程，测试内容是否会被引用</p></div>
        <Badge variant="info"><Bot className="w-3 h-3" /> 规则引擎模式</Badge>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-[1fr_200px_auto] gap-3 items-end">
          <div><label className="block mb-1.5 text-xs font-medium text-muted-foreground">测试问题</label><Input value={question} onChange={e => setQuestion(e.target.value)} /></div>
          <div><label className="block mb-1.5 text-xs font-medium text-muted-foreground">内容范围</label><Select><option>全站内容</option><option>仅博客文章</option><option>仅产品页</option></Select></div>
          <Button onClick={runTest} disabled={loading}><Play className="w-3.5 h-3.5" /> {loading ? '测试中...' : '运行测试'}</Button>
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
              <CodeBlock>{result.simulatedAnswer}</CodeBlock>
            </Card>

            {result.reason && <Alert type="info" className="mb-4"><div className="text-sm"><strong>判断依据：</strong>{result.reason}</div></Alert>}
            {result.missingInfo && <Alert type="warning" className="mb-4"><div className="text-sm"><strong>⚠️ 缺失信息：</strong>{result.missingInfo}</div></Alert>}

            {result.suggestions?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>优化建议</CardTitle></CardHeader>
                {result.suggestions.map((s: string, i: number) => <Alert key={i} type="info" className="mb-2"><div className="text-xs">💡 {s}</div></Alert>)}
              </Card>
            )}
          </div>

          <div>
            {result.retrievedContents?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>检索到的内容</CardTitle></CardHeader>
                {result.retrievedContents.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-t border-border">
                    <span>📄</span><span className="flex-1 text-sm">{c.title}</span>
                    <Badge variant={c.score >= 60 ? 'success' : c.score >= 40 ? 'warning' : 'danger'}>可引用性 {c.score}</Badge>
                  </div>
                ))}
              </Card>
            )}
            <Alert type="info" className="mt-4"><div className="text-xs">{result.disclaimer}</div></Alert>
          </div>
        </div>
      )}
    </div>
  )
}
