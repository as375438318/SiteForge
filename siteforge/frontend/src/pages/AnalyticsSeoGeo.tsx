import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, StatCard, Badge, EmptyState, Alert } from '@/components/ui'
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
interface GeoScoreResponse {
  total?: number
  dimensions?: { dimensionKey?: string; dimension?: string; score: number; maxScore: number }[]
}

export default function AnalyticsSeoGeo() {
  const [seo, setSeo] = useState<SeoHealthResponse | null>(null)
  const [geo, setGeo] = useState<GeoScoreResponse | null>(null)
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

        const [seoRes, geoRes] = await Promise.allSettled([
          apiClient.post<SeoHealthResponse>('/seo/health-check', { site: { id: sid, name: siteName }, pages: [] }),
          apiClient.post<GeoScoreResponse>('/geo/score', { text: '', html: '', meta: {} }),
        ])
        if (cancelled) return
        if (seoRes.status === 'fulfilled') setSeo(seoRes.value)
        if (geoRes.status === 'fulfilled') setGeo(geoRes.value)
        if (seoRes.status === 'rejected') {
          const e = seoRes.reason
          if (e instanceof ApiError && e.status === 401) {
            window.location.href = '/login'
            return
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
  }, [])

  // SEO 健康度趋势：仅有当前分数，展示为单点
  const seoRankOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['当前'] },
    yAxis: { type: 'value', max: 100 },
    series: [{
      data: [seo?.score ?? 0],
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.1 },
      itemStyle: { color: '#4f46e5' },
    }],
  }

  // GEO 评分维度柱状图
  const geoDims = geo?.dimensions || []
  const geoScoreOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: geoDims.map((d) => d.dimension || d.dimensionKey || ''),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: 'value' },
    series: [{
      data: geoDims.map((d) => d.score),
      type: 'bar',
      barWidth: '50%',
      itemStyle: { color: '#4f46e5' },
    }],
  }

  const svi = seo?.score ?? 0
  const sviLabel = svi >= 80 ? '优秀' : svi >= 60 ? '良好' : svi >= 40 ? '一般' : '需优化'

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>
  }
  if (error) {
    return <EmptyState icon={<AlertCircle className="w-10 h-10" />} title="加载失败" description={error} />
  }

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">SEO/GEO 效果仪表盘</h1><p className="text-sm text-muted-foreground">双引擎对照 — 搜得到 + AI 引得到</p></div>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">SVI 搜索可见性指数（基于 SEO 健康度）</div>
            <div className="text-5xl font-extrabold text-primary mt-1">{svi}</div>
            <div className="text-sm text-muted-foreground mt-1">由 SEO 健康度计算</div>
          </div>
          <div className="text-right">
            <Badge variant={svi >= 80 ? 'success' : svi >= 60 ? 'warning' : 'danger'}>{sviLabel}</Badge>
            <div className="text-xs text-muted-foreground mt-2">综合搜索引擎 + AI 搜索可见性</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        {/* SEO Section */}
        <div>
          <div className="flex items-center gap-2 mb-4"><span className="text-lg">🔍</span><h2 className="text-lg font-semibold">SEO 区</h2><Badge variant="info">搜索引擎</Badge></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="SEO 健康度" value={seo?.score ?? 0} />
            <StatCard label="通过项" value={seo?.passed ?? 0} />
          </div>
          <Card className="mb-4"><CardHeader><CardTitle>SEO 健康度</CardTitle></CardHeader><ReactECharts option={seoRankOption} style={{ height: 200 }} /></Card>
          <Card>
            <CardHeader><CardTitle>检查摘要</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">通过</span><span className="font-medium">{seo?.passed ?? 0} 项</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">警告</span><span className="font-medium">{seo?.warnings ?? 0} 项</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">未通过</span><span className="font-medium">{seo?.failed ?? 0} 项</span></div>
            </div>
          </Card>
        </div>

        {/* GEO Section */}
        <div>
          <div className="flex items-center gap-2 mb-4"><span className="text-lg">🤖</span><h2 className="text-lg font-semibold">GEO 区</h2><Badge variant="primary">AI 搜索引擎</Badge></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="可引用性总分" value={geo?.total ?? 0} />
            <StatCard label="评分维度" value={geoDims.length} />
          </div>
          <Card className="mb-4"><CardHeader><CardTitle>可引用性评分维度</CardTitle></CardHeader><ReactECharts option={geoScoreOption} style={{ height: 200 }} /></Card>
          <Card>
            <CardHeader><CardTitle>维度明细</CardTitle></CardHeader>
            <div className="space-y-2">
              {geoDims.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-2">暂无评分数据</div>
              ) : (
                geoDims.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-t border-border">
                    <span className="text-sm flex-1">{d.dimension || d.dimensionKey}</span>
                    <Badge variant={d.score >= (d.maxScore * 0.8) ? 'success' : d.score >= (d.maxScore * 0.6) ? 'warning' : 'danger'}>
                      {d.score} / {d.maxScore}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Alert type="info" className="mt-6"><div className="text-sm"><strong>优化建议：</strong>基于 SEO 健康度与 GEO 可引用性评分，定位未通过项并补充内容质量。</div></Alert>
    </div>
  )
}
