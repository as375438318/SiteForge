import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, FileText, Bot, Inbox, Wand2, LayoutGrid, FilePlus2,
  ArrowRight, AlertCircle, CheckCircle2, Clock, Search, MessageSquare,
  Rocket, FileCode, Settings,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, StatCard, Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { apiClient, ApiError } from '@/lib/api'

interface DashboardStats {
  svi?: number
  sviDelta?: string
  indexedPages?: number
  indexedPagesDelta?: string
  citationScore?: number
  citationScoreDelta?: string
  leads7d?: number
  leads7dDelta?: string
}
interface DashboardActivity {
  icon?: string
  color?: string
  title: string
  desc: string
  time: string
}
interface DashboardData {
  stats?: DashboardStats
  activities?: DashboardActivity[]
  todos?: { label: string; count: number; icon: string; color: string; to: string }[]
}

const defaultStats = [
  { label: 'SVI 指数', value: 72, delta: '5.2', deltaType: 'up' as const },
  { label: '收录页面', value: 87, delta: '4', deltaType: 'up' as const },
  { label: '可引用性均分', value: 64, delta: '2.1', deltaType: 'up' as const },
  { label: '近 7 天线索', value: 23, delta: '8', deltaType: 'up' as const },
]

const entries = [
  {
    to: '/parse',
    icon: Wand2,
    title: '参考同行',
    desc: '输入竞品 URL，AI 自动复刻站点结构与版式，快速起步',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    to: '/templates',
    icon: LayoutGrid,
    title: '选模板',
    desc: '从 8 大行业精选模板库中挑选，开箱即用、一键应用',
    color: 'from-purple-500 to-pink-500',
  },
  {
    to: '/editor',
    icon: FilePlus2,
    title: '空白开始',
    desc: '从零搭建，可视化拖拽编辑器自由组合 16 种组件',
    color: 'from-amber-500 to-orange-500',
  },
]

const defaultTodos = [
  { label: 'SEO 未通过项', count: 3, icon: Search, color: 'text-warning', to: '/seo/health' },
  { label: '未处理线索', count: 5, icon: Inbox, color: 'text-destructive', to: '/leads' },
  { label: '未配置 LLM API', count: 1, icon: Settings, color: 'text-blue-500', to: '/system/llm' },
]

const defaultActivities = [
  { icon: Rocket, color: 'text-success', title: '发布了静态站点', desc: '生成 87 个页面，已部署至 CDN', time: '10 分钟前' },
  { icon: FileText, color: 'text-blue-500', title: '发布了文章《2024 SaaS 趋势》', desc: 'GEO 评分 78，可引用性良好', time: '2 小时前' },
  { icon: Bot, color: 'text-purple-500', title: '生成了 llms.txt', desc: '6 个页面已写入 AI 引用档案', time: '今天 09:12' },
  { icon: MessageSquare, color: 'text-warning', title: '收到 3 条新线索', desc: '来自「产品咨询」表单', time: '昨天 18:30' },
  { icon: FileCode, color: 'text-muted-foreground', title: '新增页面 /pricing', desc: '已配置 SEO TDK 与结构化数据', time: '昨天 14:05' },
]

const activityIconMap: Record<string, ComponentType<{ className?: string }>> = {
  Rocket, FileText, Bot, MessageSquare, FileCode,
}

type ActivityItem = {
  icon: ComponentType<{ className?: string }>
  color: string
  title: string
  desc: string
  time: string
}

export default function Dashboard() {
  const [stats, setStats] = useState(defaultStats)
  const [todos, setTodos] = useState(defaultTodos)
  const [activities, setActivities] = useState<ActivityItem[]>(defaultActivities)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiClient.get<DashboardData>('/dashboard')
        if (cancelled) return
        if (data?.stats) {
          setStats([
            { label: 'SVI 指数', value: data.stats.svi ?? defaultStats[0].value, delta: data.stats.sviDelta ?? defaultStats[0].delta, deltaType: 'up' },
            { label: '收录页面', value: data.stats.indexedPages ?? defaultStats[1].value, delta: data.stats.indexedPagesDelta ?? defaultStats[1].delta, deltaType: 'up' },
            { label: '可引用性均分', value: data.stats.citationScore ?? defaultStats[2].value, delta: data.stats.citationScoreDelta ?? defaultStats[2].delta, deltaType: 'up' },
            { label: '近 7 天线索', value: data.stats.leads7d ?? defaultStats[3].value, delta: data.stats.leads7dDelta ?? defaultStats[3].delta, deltaType: 'up' },
          ])
        }
        if (data?.activities?.length) {
          setActivities(
            data.activities.map((a) => ({
              icon: (a.icon && activityIconMap[a.icon]) || FileText,
              color: a.color || 'text-muted-foreground',
              title: a.title,
              desc: a.desc,
              time: a.time,
            })),
          )
        }
      } catch (e) {
        // 后端未就绪或无数据，保留 mock 兜底
        if (e instanceof ApiError && e.status === 401) {
          // 鉴权失败，跳登录
          window.location.href = '/login'
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">早上好，admin。今日有 {todos[1]?.count ?? 5} 条新线索待跟进。</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Entries */}
      <div>
        <h2 className="text-base font-semibold mb-3">快速开始</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entries.map((e) => (
            <Link key={e.to} to={e.to}>
              <Card className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <div className={cn('w-11 h-11 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-4', e.color)}>
                  <e.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-semibold">{e.title}</h3>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Todos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>待办清单</CardTitle>
            <Badge variant="warning">{todos.reduce((a, b) => a + b.count, 0)}</Badge>
          </CardHeader>
          <div className="space-y-2">
            {todos.map((t) => (
              <Link
                key={t.label}
                to={t.to}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <t.icon className={cn('w-4 h-4', t.color)} />
                  <span className="text-sm">{t.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.count > 2 ? 'danger' : 'warning'}>{t.count}</Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </Link>
            ))}
            <div className="flex items-center gap-2 p-3 text-xs text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>其余 12 项检查均已通过</span>
            </div>
          </div>
        </Card>

        {/* Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <Button variant="ghost" size="sm">查看全部</Button>
          </CardHeader>
          <div className="space-y-4">
            {activities.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn('w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0', a.color)}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  {i < activities.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.title}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
        <AlertCircle className="w-4 h-4" />
        <span>SVI 指数综合了 SEO 健康度、GEO 可引用性、收录量与线索转化，目标值 80。</span>
        <TrendingUp className="w-3.5 h-3.5 ml-auto text-success" />
      </div>
    </div>
  )
}
