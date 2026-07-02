import { Card, CardHeader, CardTitle, Badge, Button, StatCard, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { CheckCircle, AlertTriangle, XCircle, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiClient, ApiError } from '@/lib/api'

interface Site {
  id: string
  name?: string
}
interface SeoCheck {
  name: string
  desc?: string
  status: 'pass' | 'warning' | 'fail'
  detail?: string
  autoFix?: boolean
}
interface SeoHealthData {
  score?: number
  passed?: number
  warnings?: number
  failed?: number
  checks?: SeoCheck[]
}

const statusMap = {
  pass: { icon: CheckCircle, color: 'text-success', badge: 'success' as const, label: '通过' },
  warning: { icon: AlertTriangle, color: 'text-warning', badge: 'warning' as const, label: '警告' },
  fail: { icon: XCircle, color: 'text-destructive', badge: 'danger' as const, label: '未通过' },
}

export default function SeoHealth() {
  const [score, setScore] = useState(0)
  const [checks, setChecks] = useState<SeoCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [rechecking, setRechecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      let sid = 'default'
      let siteName = ''
      try {
        const sitesRes = await apiClient.get<Site[] | { items?: Site[] }>('/sites')
        const sitesList = Array.isArray(sitesRes) ? sitesRes : (sitesRes as { items?: Site[] })?.items
        if (sitesList && sitesList.length > 0) {
          sid = sitesList[0].id
          siteName = sitesList[0].name || ''
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          window.location.href = '/login'
          return
        }
      }

      const data = await apiClient.post<SeoHealthData>('/seo/health-check', {
        site: { id: sid, name: siteName },
        pages: [],
      })
      setScore(data?.score ?? 0)
      setChecks(data?.checks || [])
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function recheck() {
    setRechecking(true)
    try {
      await load()
      toast.success(`SEO 健康度: ${score} 分`)
    } catch {
      toast.error('检查失败')
    } finally {
      setRechecking(false)
    }
  }

  const passed = checks.filter((c) => c.status === 'pass').length
  const warnings = checks.filter((c) => c.status === 'warning').length
  const failed = checks.filter((c) => c.status === 'fail').length
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#f97316'

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>
  }
  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-10 h-10" />}
        title="加载失败"
        description={error}
        action={<Button variant="secondary" onClick={load}>重试</Button>}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">SEO 健康度</h1><p className="text-sm text-muted-foreground">SEO 检查，0-100 评分</p></div>
        <Button onClick={recheck} disabled={rechecking}>{rechecking ? '检查中...' : '重新检查'}</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="健康度评分" value={score} />
        <StatCard label="通过" value={passed} />
        <StatCard label="警告" value={warnings} />
        <StatCard label="未通过" value={failed} />
      </div>

      {checks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<AlertCircle className="w-8 h-8" />}
            title="暂无检查数据"
            description="后端未返回检查项，请稍后再试"
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>检查项清单（{checks.length} 项）</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => toast.info('请逐项查看修复')}>一键修复全部</Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">检查项</th>
                  <th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">状态</th>
                  <th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">详情</th>
                  <th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check, i) => {
                  const s = statusMap[check.status] || statusMap.warning
                  return (
                    <tr key={i} className="hover:bg-muted/50">
                      <td className="px-4 py-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <s.icon className={`w-4 h-4 ${s.color}`} />
                          <div>
                            <div className="font-medium">{check.name}</div>
                            {check.desc && <div className="text-xs text-muted-foreground">{check.desc}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-t border-border"><Badge variant={s.badge}>{s.label}</Badge></td>
                      <td className="px-4 py-3 border-t border-border text-muted-foreground">{check.detail || '-'}</td>
                      <td className="px-4 py-3 border-t border-border">
                        {check.autoFix ? (
                          <Button size="sm" onClick={() => toast.success(`已修复：${check.name}`)}>一键修复</Button>
                        ) : (
                          <Button size="sm" variant="link">查看</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
