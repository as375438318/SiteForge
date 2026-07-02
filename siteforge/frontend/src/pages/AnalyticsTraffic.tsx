import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, StatCard, Button, EmptyState } from '@/components/ui'
import ReactECharts from 'echarts-for-react'
import { apiClient, ApiError } from '@/lib/api'
import { AlertCircle } from 'lucide-react'

interface Site {
  id: string
  name?: string
}
interface SeoHealthResponse {
  score?: number
  passed?: number
  warnings?: number
  failed?: number
  checks?: { name: string; status: 'pass' | 'warning' | 'fail' }[]
}

export default function AnalyticsTraffic() {
  const [period, setPeriod] = useState('7日')
  const [health, setHealth] = useState<SeoHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
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
        if (cancelled) return

        const data = await apiClient.post<SeoHealthResponse>('/seo/health-check', {
          site: { id: sid, name: siteName },
          pages: [],
        })
        if (cancelled) return
        setHealth(data)
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

  // 用 SEO 检查数据填充图表
  const checkStatusCount = (status: 'pass' | 'warning' | 'fail') =>
    health?.checks?.filter((c) => c.status === status).length || 0

  const trafficOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['通过', '警告', '未通过'] },
    yAxis: { type: 'value' },
    series: [{
      data: [checkStatusCount('pass'), checkStatusCount('warning'), checkStatusCount('fail')],
      type: 'bar',
      barWidth: '50%',
      itemStyle: { color: '#4f46e5' },
    }],
  }

  const sourceOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: checkStatusCount('pass'), name: '通过', itemStyle: { color: '#22c55e' } },
        { value: checkStatusCount('warning'), name: '警告', itemStyle: { color: '#eab308' } },
        { value: checkStatusCount('fail'), name: '未通过', itemStyle: { color: '#ef4444' } },
      ],
    }],
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">访问统计</h1><p className="text-sm text-muted-foreground">基于 SEO 健康度数据展示</p></div>
        <div className="flex gap-1">
          {['今日', '7日', '30日'].map(p => (
            <Button key={p} size="sm" variant={period === p ? 'primary' : 'secondary'} onClick={() => setPeriod(p)}>{p}</Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">加载中...</div>
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-10 h-10" />} title="加载失败" description={error} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="SEO 健康度" value={health?.score ?? 0} />
            <StatCard label="通过项" value={checkStatusCount('pass')} />
            <StatCard label="警告项" value={checkStatusCount('warning')} />
            <StatCard label="未通过项" value={checkStatusCount('fail')} />
          </div>

          <div className="grid grid-cols-[1fr_400px] gap-5 mb-6">
            <Card><CardHeader><CardTitle>检查项分布</CardTitle></CardHeader><ReactECharts option={trafficOption} style={{ height: 300 }} /></Card>
            <Card><CardHeader><CardTitle>状态占比</CardTitle></CardHeader><ReactECharts option={sourceOption} style={{ height: 300 }} /></Card>
          </div>

          <Card className="mb-4">
            <CardHeader><CardTitle>检查项明细</CardTitle></CardHeader>
            {health?.checks && health.checks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">检查项</th>
                      <th className="text-left px-4 py-3 bg-muted font-semibold text-muted-foreground">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.checks.map((c, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-4 py-3 border-t border-border font-medium">{c.name}</td>
                        <td className="px-4 py-3 border-t border-border text-muted-foreground">{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="暂无检查数据" description="运行 SEO 健康检查后将显示" />
            )}
          </Card>
        </>
      )}
    </div>
  )
}
