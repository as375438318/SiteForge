import { useState } from 'react'
import { Card, CardHeader, CardTitle, StatCard, Button, Table, Th, Td, Badge } from '@/components/ui'
import ReactECharts from 'echarts-for-react'

export default function AnalyticsTraffic() {
  const [period, setPeriod] = useState('7日')

  const trafficOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value' },
    series: [{ data: [420, 580, 390, 650, 720, 580, 507], type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#4f46e5' } }],
  }

  const sourceOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: [
        { value: 1540, name: '搜索引擎', itemStyle: { color: '#4f46e5' } },
        { value: 980, name: '直接访问', itemStyle: { color: '#3b82f6' } },
        { value: 620, name: '社交媒体', itemStyle: { color: '#22c55e' } },
        { value: 350, name: 'AI搜索', itemStyle: { color: '#eab308' } },
        { value: 357, name: '其他', itemStyle: { color: '#94a3b8' } },
      ],
    }],
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">访问统计</h1><p className="text-sm text-muted-foreground">网站访问数据分析</p></div>
        <div className="flex gap-1">
          {['今日', '7日', '30日'].map(p => (
            <Button key={p} size="sm" variant={period === p ? 'primary' : 'secondary'} onClick={() => setPeriod(p)}>{p}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="总访问量" value="3,847" delta="12%" deltaType="up" />
        <StatCard label="独立访客" value="1,203" delta="8%" deltaType="up" />
        <StatCard label="跳出率" value="42%" delta="3%" deltaType="down" />
        <StatCard label="平均停留" value="2分18秒" delta="15%" deltaType="up" />
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-5 mb-6">
        <Card><CardHeader><CardTitle>访问趋势</CardTitle></CardHeader><ReactECharts option={trafficOption} style={{ height: 300 }} /></Card>
        <Card><CardHeader><CardTitle>来源渠道</CardTitle></CardHeader><ReactECharts option={sourceOption} style={{ height: 300 }} /></Card>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>热门页面 Top 10</CardTitle></CardHeader>
        <Table>
          <thead><tr><Th>排名</Th><Th>页面</Th><Th>访问量</Th><Th>占比</Th></tr></thead>
          <tbody>
            {[{ p: '/', v: 1542, pct: '40%' }, { p: '/products', v: 876, pct: '23%' }, { p: '/about', v: 523, pct: '14%' }, { p: '/contact', v: 387, pct: '10%' }, { p: '/posts/geo-guide', v: 256, pct: '7%' }].map((r, i) => (
              <tr key={i} className="hover:bg-muted/50"><Td>{i + 1}</Td><Td className="font-medium">{r.p}</Td><Td>{r.v}</Td><Td className="text-muted-foreground">{r.pct}</Td></tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader><CardTitle>设备分布</CardTitle></CardHeader>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg"><div className="text-2xl font-bold">60%</div><div className="text-sm text-muted-foreground">🖥️ PC</div></div>
          <div className="text-center p-4 bg-muted/50 rounded-lg"><div className="text-2xl font-bold">35%</div><div className="text-sm text-muted-foreground">📱 移动</div></div>
          <div className="text-center p-4 bg-muted/50 rounded-lg"><div className="text-2xl font-bold">5%</div><div className="text-sm text-muted-foreground">📱 平板</div></div>
        </div>
      </Card>
    </div>
  )
}
