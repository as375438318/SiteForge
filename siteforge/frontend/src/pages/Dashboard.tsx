import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Inbox, Wand2, LayoutGrid, FilePlus2,
  ArrowRight, AlertCircle, CheckCircle2, Clock, Search, Settings,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, StatCard, Badge, Button, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { apiClient, ApiError } from '@/lib/api'

interface Site {
  id: string
  name?: string
  domain?: string
}
interface SeoHealthResponse {
  score?: number
  passed?: number
  warnings?: number
  failed?: number
  checks?: { name: string; status: 'pass' | 'warning' | 'fail'; detail?: string }[]
}
interface LeadsSummary {
  pending?: number
}

interface StatItem {
  label: string
  value: number | string
  delta?: string
  deltaType?: 'up' | 'down'
}
interface TodoItem {
  label: string
  count: number
  icon: ComponentType<{ className?: string }>
  color: string
  to: string
}
interface ActivityItem {
  icon: ComponentType<{ className?: string }>
  color: string
  title: string
  desc: string
  time: string
}

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

export default function Dashboard() {
  const [stats, setStats] = useState<StatItem[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. 获取站点
        let siteId = 'default'
        let siteName = '工作台'
        try {
          const sitesRes = await apiClient.get<Site[] | { items?: Site[] }>('/sites')
          const sitesList = Array.isArray(sitesRes) ? sitesRes : (sitesRes as { items?: Site[] })?.items
          if (sitesList && sitesList.length > 0) {
            siteId = sitesList[0].id || siteId
            siteName = sitesList[0].name || siteName
          }
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            window.location.href = '/login'
            return
          }
          // 站点接口失败时使用 default
        }

        // 2. 并行获取 SEO 健康度 + 线索摘要
        const [seoRes, leadsRes] = await Promise.allSettled([
          apiClient.post<SeoHealthResponse>('/seo/health-check', {
            site: { id: siteId, name: siteName },
            pages: [],
          }),
          apiClient.get<LeadsSummary[] | { items?: LeadsSummary[] }>(`/leads/${siteId}`),
        ])

        if (cancelled) return

        const seo = seoRes.status === 'fulfilled' ? seoRes.value : undefined
        const leadsList =
          leadsRes.status === 'fulfilled'
            ? Array.isArray(leadsRes.value)
              ? leadsRes.value
              : (leadsRes.value as { items?: LeadsSummary[] })?.items || []
            : []

        const pendingLeads = leadsList.length

        const statItems: StatItem[] = []
        if (seo?.score !== undefined) {
          statItems.push({ label: 'SEO 健康度', value: seo.score, delta: '', deltaType: 'up' })
        }
        if (seo?.passed !== undefined) {
          statItems.push({ label: '检查通过项', value: seo.passed, delta: '', deltaType: 'up' })
        }
        if (seo?.warnings !== undefined) {
          statItems.push({ label: '警告项', value: seo.warnings, delta: '', deltaType: 'down' })
        }
        statItems.push({ label: '线索总数', value: pendingLeads, delta: '', deltaType: 'up' })
        setStats(statItems)

        // 待办：基于真实数据
        const todoItems: TodoItem[] = []
        if (seo?.failed !== undefined && seo.failed > 0) {
          todoItems.push({ label: 'SEO 未通过项', count: seo.failed, icon: Search, color: 'text-warning', to: '/seo/health' })
        }
        if (pendingLeads > 0) {
          todoItems.push({ label: '未处理线索', count: pendingLeads, icon: Inbox, color: 'text-destructive', to: '/leads' })
        }
        todoItems.push({ label: '未配置 LLM API', count: 0, icon: Settings, color: 'text-blue-500', to: '/system/llm' })
        setTodos(todoItems)

        // 活动流：留空，后端暂无活动接口
        setActivities([])
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

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? '加载中...' : '欢迎回来，今日数据如下。'}
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">加载中...</div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle className="w-10 h-10" />}
          title="数据加载失败"
          description={error}
        />
      ) : stats.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-10 h-10" />}
          title="暂无统计数据"
          description="站点配置或 SEO 检查完成后将显示数据"
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

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
            {todos.length === 0 ? (
              <div className="flex items-center gap-2 p-3 text-xs text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>暂无待办事项</span>
              </div>
            ) : (
              todos.map((t) => (
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
              ))
            )}
          </div>
        </Card>

        {/* Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <Button variant="ghost" size="sm">查看全部</Button>
          </CardHeader>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-8 h-8" />}
                title="暂无活动记录"
                description="发布内容、生成页面后将在此处显示"
              />
            ) : (
              activities.map((a, i) => (
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
              ))
            )}
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
