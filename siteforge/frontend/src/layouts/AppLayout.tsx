import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wand2, LayoutGrid, MousePointerClick, FileText, FileEdit,
  MessageSquare, Inbox, Search, Bot, FileCode, Settings, Server, KeyRound,
  DatabaseBackup, Cpu, Sun, Moon, Bell, ChevronLeft, ChevronRight, Globe, Rocket
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import { toast } from '@/stores/toast'
import { Button } from '@/components/ui'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}
interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  { label: '概览', items: [{ to: '/dashboard', label: '工作台', icon: LayoutDashboard }] },
  {
    label: '建站',
    items: [
      { to: '/parse', label: 'AI 结构复刻', icon: Wand2 },
      { to: '/templates', label: '模板库', icon: LayoutGrid },
      { to: '/editor', label: '可视化编辑器', icon: MousePointerClick },
    ],
  },
  {
    label: '内容',
    items: [
      { to: '/cms/list', label: '内容管理', icon: FileText },
      { to: '/cms/edit', label: '编辑内容', icon: FileEdit },
      { to: '/cms/pages', label: '页面与导航', icon: FileCode },
    ],
  },
  {
    label: '获客',
    items: [
      { to: '/forms/designer', label: '表单设计器', icon: MessageSquare },
      { to: '/leads', label: '线索管理', icon: Inbox },
    ],
  },
  {
    label: '优化',
    items: [
      { to: '/seo/settings', label: 'SEO 引擎', icon: Search },
      { to: '/seo/health', label: 'SEO 健康度', icon: Search },
      { to: '/geo/llms-txt', label: 'GEO 引擎', icon: Bot },
      { to: '/geo/citation-test', label: 'AI 引用模拟', icon: Bot },
    ],
  },
  {
    label: '数据',
    items: [
      { to: '/analytics/traffic', label: '访问统计', icon: LayoutDashboard },
      { to: '/analytics/seo-geo', label: '效果仪表盘', icon: LayoutDashboard },
    ],
  },
  {
    label: '系统',
    items: [
      { to: '/system/deploy', label: '部署配置', icon: Server },
      { to: '/system/license', label: 'License 管理', icon: KeyRound },
      { to: '/system/backup', label: '备份恢复', icon: DatabaseBackup },
      { to: '/system/llm', label: 'LLM 配置', icon: Cpu },
    ],
  },
]

const routeLabels: Record<string, string> = {
  '/dashboard': '工作台',
  '/parse': 'AI 结构复刻', '/templates': '模板库', '/editor': '可视化编辑器',
  '/cms/list': '内容管理', '/cms/edit': '编辑内容', '/cms/pages': '页面与导航',
  '/forms/designer': '表单设计器', '/leads': '线索管理',
  '/seo/settings': 'SEO 引擎', '/seo/health': 'SEO 健康度',
  '/geo/llms-txt': 'GEO 引擎', '/geo/citation-test': 'AI 引用模拟',
  '/analytics/traffic': '访问统计', '/analytics/seo-geo': '效果仪表盘',
  '/system/deploy': '部署配置', '/system/license': 'License 管理',
  '/system/backup': '备份恢复', '/system/llm': 'LLM 配置',
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggle } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()

  const currentLabel = routeLabels[location.pathname] || '工作台'
  const isEditor = location.pathname === '/editor'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn('fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-200', collapsed || isEditor ? 'w-16' : 'w-60')}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 p-4 border-b border-border h-14">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">⚡</div>
          {!collapsed && !isEditor && <span className="font-bold text-base">SiteForge</span>}
        </div>

        {/* Site Selector */}
        {!collapsed && !isEditor && (
          <div className="mx-3 mt-3 mb-2 px-3 py-2 rounded-lg bg-muted flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:bg-muted/80">
            <Globe className="w-3.5 h-3.5" />
            <span>智云科技</span>
            <ChevronRight className="w-3 h-3 ml-auto" />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              {!collapsed && !isEditor && (
                <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 mx-2 px-3 py-2 rounded-md text-sm transition-colors relative',
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    (collapsed || isEditor) && 'justify-center px-0',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />}
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && !isEditor && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">A</div>
          {!collapsed && !isEditor && (
            <div className="flex-1 text-xs">
              <div className="font-medium">admin</div>
              <div className="text-muted-foreground">智云科技 · 管理员</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={cn('flex-1 transition-all duration-200', collapsed || isEditor ? 'ml-16' : 'ml-60')}>
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-14 bg-card/80 backdrop-blur border-b border-border flex items-center px-5 gap-3">
          <button onClick={() => setCollapsed(!collapsed)} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>智云科技</span>
            <span>›</span>
            <span className="text-foreground font-medium">{currentLabel}</span>
          </div>
          <div className="flex-1" />
          <button onClick={() => { toast.info('预览站点') }} className="h-8 px-3 flex items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
            <Globe className="w-3.5 h-3.5" /> 预览
          </button>
          <Button size="sm" onClick={() => { toast.success('正在生成静态站点...') }}>
            <Rocket className="w-3.5 h-3.5" /> 发布
          </Button>
          <button onClick={toggle} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
          </button>
        </header>

        {/* Content */}
        <main className="p-6 max-w-[1400px] mx-auto page-enter">{children}</main>
      </div>
    </div>
  )
}
