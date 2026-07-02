import { Card, CardHeader, CardTitle, StatCard, Badge, Button, Alert } from '@/components/ui'
import { toast } from '@/stores/toast'
import ReactECharts from 'echarts-for-react'

export default function AnalyticsSeoGeo() {
  const seoRankOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'] },
    yAxis: { type: 'value', max: 100 },
    series: [{ data: [45, 52, 48, 61, 68, 72], type: 'line', smooth: true, areaStyle: { opacity: 0.1 }, itemStyle: { color: '#4f46e5' } }],
  }

  const geoScoreOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['0-20', '20-40', '40-60', '60-80', '80-100'] },
    yAxis: { type: 'value' },
    series: [{ data: [3, 7, 12, 8, 4], type: 'bar', barWidth: '50%', itemStyle: { color: (p: any) => ['#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e'][p.dataIndex] } }],
  }

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">SEO/GEO 效果仪表盘</h1><p className="text-sm text-muted-foreground">双引擎对照 — 搜得到 + AI 引得到</p></div>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">SVI 搜索可见性指数（北极星）</div><div className="text-5xl font-extrabold text-primary mt-1">72</div><div className="text-sm text-success mt-1">↑ 较上周 +8</div></div>
          <div className="text-right"><Badge variant="success">良好</Badge><div className="text-xs text-muted-foreground mt-2">综合搜索引擎 + AI 搜索可见性</div></div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        {/* SEO Section */}
        <div>
          <div className="flex items-center gap-2 mb-4"><span className="text-lg">🔍</span><h2 className="text-lg font-semibold">SEO 区</h2><Badge variant="info">搜索引擎</Badge></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="收录页面数" value="87" delta="625%" deltaType="up" />
            <StatCard label="SEO 健康度" value="78" delta="5分" deltaType="up" />
          </div>
          <Card className="mb-4"><CardHeader><CardTitle>关键词排名趋势</CardTitle></CardHeader><ReactECharts option={seoRankOption} style={{ height: 200 }} /></Card>
          <Card>
            <CardHeader><CardTitle>索引状态</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">已索引</span><span className="font-medium">87 / 102 页</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">待索引</span><span className="font-medium">15 页</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">索引率</span><Badge variant="success">85%</Badge></div>
            </div>
          </Card>
        </div>

        {/* GEO Section */}
        <div>
          <div className="flex items-center gap-2 mb-4"><span className="text-lg">🤖</span><h2 className="text-lg font-semibold">GEO 区</h2><Badge variant="primary">AI 搜索引擎</Badge></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="可引用性均分" value="64" delta="+8分" deltaType="up" />
            <StatCard label="AI引用通过率" value="42%" delta="+15%" deltaType="up" />
          </div>
          <Card className="mb-4"><CardHeader><CardTitle>可引用性评分分布</CardTitle></CardHeader><ReactECharts option={geoScoreOption} style={{ height: 200 }} /></Card>
          <Card>
            <CardHeader><CardTitle>AI 引用测试历史</CardTitle></CardHeader>
            <div className="space-y-2">
              {[{ q: '企业建站工具推荐', r: 'high' }, { q: 'SEO和GEO的区别', r: 'medium' }, { q: '本地部署建站系统', r: 'low' }].map((h, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-t border-border">
                  <span className="text-sm flex-1">{h.q}</span>
                  <Badge variant={h.r === 'high' ? 'success' : h.r === 'medium' ? 'warning' : 'danger'}>{h.r === 'high' ? '高' : h.r === 'medium' ? '中' : '低'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Alert type="info" className="mt-6"><div className="text-sm"><strong>优化建议：</strong>1. GEO 区可引用性均分 64 分，建议提升至 80+ 分以增加 AI 引用概率。2. SEO 区有 15 页待索引，建议重新提交 sitemap。</div></Alert>
    </div>
  )
}
