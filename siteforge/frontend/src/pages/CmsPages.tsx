import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, Input, Label, Badge, Button, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { GripVertical, Plus, AlertCircle, FileText } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api'

interface PageItem {
  id?: string
  name?: string
  title?: string
  slug?: string
  url?: string
  level?: number
  blocks?: unknown[]
  seoMeta?: { title?: string; description?: string }
}
interface NavItem {
  label?: string
  title?: string
  url?: string
  id?: string
}
interface Site {
  id: string
  name?: string
}

export default function CmsPages() {
  const [selected, setSelected] = useState(0)
  const [pages, setPages] = useState<PageItem[]>([])
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [siteId, setSiteId] = useState('default')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        let sid = 'default'
        try {
          const sitesRes = await apiClient.get<Site[] | { items?: Site[] }>('/sites')
          const sitesList = Array.isArray(sitesRes) ? sitesRes : (sitesRes as { items?: Site[] })?.items
          if (sitesList && sitesList.length > 0 && sitesList[0].id) {
            sid = sitesList[0].id
          }
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            window.location.href = '/login'
            return
          }
        }
        if (cancelled) return
        setSiteId(sid)

        const [pagesRes, navRes] = await Promise.allSettled([
          apiClient.get<PageItem[] | { items?: PageItem[] }>(`/cms/pages/${sid}`),
          apiClient.get<NavItem[] | { items?: NavItem[] }>(`/cms/navigation/${sid}`),
        ])

        if (cancelled) return

        if (pagesRes.status === 'fulfilled') {
          const list = Array.isArray(pagesRes.value)
            ? pagesRes.value
            : (pagesRes.value as { items?: PageItem[] })?.items || []
          setPages(list)
          if (list.length === 0) setSelected(-1)
          else if (selected >= list.length) setSelected(0)
        } else if (pagesRes.reason instanceof ApiError && pagesRes.reason.status === 401) {
          window.location.href = '/login'
          return
        }
        if (navRes.status === 'fulfilled') {
          const list = Array.isArray(navRes.value)
            ? navRes.value
            : (navRes.value as { items?: NavItem[] })?.items || []
          setNavItems(list)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveNav() {
    try {
      await apiClient.put(`/cms/navigation/${siteId}`, { items: navItems })
      toast.success('导航已保存')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('保存失败')
    }
  }

  const current = selected >= 0 ? pages[selected] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">页面与导航</h1><p className="text-sm text-muted-foreground">管理站点页面结构和导航菜单</p></div>
        <Button><Plus className="w-4 h-4" /> 新建页面</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">加载中...</div>
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-10 h-10" />} title="加载失败" description={error} />
      ) : (
        <div className="grid grid-cols-[320px_1fr] gap-5">
          {/* Left: Page Tree */}
          <Card>
            <CardHeader><CardTitle>页面树</CardTitle></CardHeader>
            <div className="space-y-1">
              {pages.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">暂无页面</div>
              ) : (
                pages.map((p, i) => (
                  <div
                    key={p.id ?? i}
                    onClick={() => setSelected(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm ${selected === i ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                    style={{ paddingLeft: `${12 + (p.level || 0) * 20}px` }}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="flex-1">{p.name || p.title || '未命名'}</span>
                    <Badge variant="default">{p.slug || p.url || '/'}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Right: Page Properties */}
          <Card>
            <CardHeader><CardTitle>页面属性</CardTitle></CardHeader>
            {current ? (
              <div className="space-y-4">
                <div><Label>页面名称</Label><Input defaultValue={current.name || current.title || ''} /></div>
                <div><Label>URL Slug</Label><Input defaultValue={current.slug || current.url || ''} /></div>
                <div><Label>SEO 标题</Label><Input defaultValue={current.seoMeta?.title || ''} placeholder="SEO标题" /></div>
                <div><Label>SEO 描述</Label><Input defaultValue={current.seoMeta?.description || ''} placeholder="SEO描述" /></div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">配置 SEO</Button>
                  <Button variant="secondary" size="sm">配置 GEO</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (!current.id) {
                        toast.error('该页面未保存，无法删除')
                        return
                      }
                      if (!confirm('确认删除该页面？')) return
                      apiClient
                        .delete(`/cms/page/${current.id}`)
                        .then(() => {
                          toast.success('已删除')
                          setPages((prev) => prev.filter((_, idx) => idx !== selected))
                          setSelected(0)
                        })
                        .catch((e) => {
                          if (e instanceof ApiError && e.status === 401) {
                            window.location.href = '/login'
                            return
                          }
                          toast.error('删除失败')
                        })
                    }}
                  >
                    删除页面
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title="未选择页面"
                description="从左侧选择页面或新建页面"
              />
            )}
          </Card>
        </div>
      )}

      {/* Navigation Config */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>导航菜单配置</CardTitle>
          <Button size="sm" variant="secondary" onClick={saveNav}>保存导航</Button>
        </CardHeader>
        <div className="space-y-2">
          {navItems.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">暂无导航项</div>
          ) : (
            navItems.map((item, i) => (
              <div key={item.id ?? i} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="flex-1">{item.label || item.title || '未命名'}</span>
                <Button variant="ghost" size="sm">编辑</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!confirm('确认删除该导航项？')) return
                    setNavItems((prev) => prev.filter((_, idx) => idx !== i))
                  }}
                >删除</Button>
              </div>
            ))
          )}
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setNavItems((prev) => [...prev, { label: '新导航项', url: '/' }])}
          >
            <Plus className="w-3.5 h-3.5" /> 添加导航项
          </Button>
        </div>
      </Card>
    </div>
  )
}
