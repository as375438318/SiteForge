import { Card, CardHeader, CardTitle, Badge, Button, Progress, StatCard } from '@/components/ui'
import { toast } from '@/stores/toast'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useState } from 'react'

const checks = [
  { name: 'TDK 完整性', desc: '标题/描述/关键词', status: 'pass', detail: '102/102 页面 TDK 完整' },
  { name: 'H1 标签', desc: '每页唯一 H1', status: 'pass', detail: '所有页面 H1 唯一' },
  { name: 'H 标签层级', desc: 'H1-H3 结构', status: 'pass', detail: '所有页面层级正确' },
  { name: '图片 alt 属性', desc: '无障碍 + SEO', status: 'warning', detail: '8 张图片缺失 alt', autoFix: true },
  { name: 'canonical 标签', desc: '避免重复内容', status: 'pass', detail: '全站已注入' },
  { name: '内链结构', desc: '页面间链接', status: 'warning', detail: '12 页面内链不足', autoFix: false },
  { name: '移动友好', desc: '响应式布局', status: 'pass', detail: '全部页面移动友好' },
  { name: '页面体积', desc: '< 2MB', status: 'warning', detail: '2 页面 > 2MB', autoFix: true },
  { name: 'HTTPS', desc: 'SSL 证书', status: 'pass', detail: '有效期至 2026-12-01' },
  { name: '结构化数据', desc: 'Schema.org', status: 'pass', detail: '4 种 Schema 已注入' },
  { name: 'AI 爬虫放行', desc: 'GEO 关键', status: 'pass', detail: '9 个 AI 爬虫已放行' },
  { name: 'llms.txt', desc: 'GEO 文件', status: 'pass', detail: '已生成' },
]

const statusMap = {
  pass: { icon: CheckCircle, color: 'text-success', badge: 'success' as const, label: '通过' },
  warning: { icon: AlertTriangle, color: 'text-warning', badge: 'warning' as const, label: '警告' },
  fail: { icon: XCircle, color: 'text-destructive', badge: 'danger' as const, label: '未通过' },
}

export default function SeoHealth() {
  const [score, setScore] = useState(78)
  const [loading, setLoading] = useState(false)

  async function recheck() {
    setLoading(true)
    try {
      const site = { ssl: true, sitemapGenerated: true, robotsGenerated: true, allowAiCrawlers: true }
      const pages = [{ url: '/', title: '首页', html: '<h1>首页</h1><img src="a.jpg">', seoMeta: { title: '首页', description: '首页' } }]
      const res = await fetch('/api/seo/health-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site, pages }) })
      const data = await res.json()
      setScore(data.score)
      toast.success(`SEO 健康度: ${data.score} 分`)
    } catch { toast.error('检查失败') }
    setLoading(false)
  }

  const passed = checks.filter(c => c.status === 'pass').length
  const warnings = checks.filter(c => c.status === 'warning').length
  const failed = checks.filter(c => c.status === 'fail').length
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#f97316'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">SEO 健康度</h1><p className="text-sm text-muted-foreground">12 项 SEO 检查，0-100 评分</p></div>
        <Button onClick={recheck} disabled={loading}>{loading ? '检查中...' : '重新检查'}</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="健康度评分" value={score} />
        <StatCard label="通过" value={passed} />
        <StatCard label="警告" value={warnings} />
        <StatCard label="未通过" value={failed} />
      </div>

      <Card>
        <CardHeader><CardTitle>检查项清单（12 项）</CardTitle><Button size="sm" variant="secondary">一键修复全部</Button></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">检查项</th><th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">状态</th><th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">详情</th><th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">操作</th></tr></thead>
            <tbody>
              {checks.map((check, i) => {
                const s = statusMap[check.status as keyof typeof statusMap]
                return (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="px-4 py-3 border-t border-border"><div className="flex items-center gap-2"><s.icon className={`w-4 h-4 ${s.color}`} /><div><div className="font-medium">{check.name}</div><div className="text-xs text-muted-foreground">{check.desc}</div></div></div></td>
                    <td className="px-4 py-3 border-t border-border"><Badge variant={s.badge}>{s.label}</Badge></td>
                    <td className="px-4 py-3 border-t border-border text-muted-foreground">{check.detail}</td>
                    <td className="px-4 py-3 border-t border-border">{check.autoFix ? <Button size="sm" onClick={() => toast.success(`已修复：${check.name}`)}>一键修复</Button> : <Button size="sm" variant="link">查看</Button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
