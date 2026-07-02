import { useEffect, useState } from 'react'
import { Button, Table, Th, Td, Badge, Tabs, Input, Select, EmptyState } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, AlertCircle } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api'

interface ContentItem {
  id?: string
  title?: string
  category?: string
  score?: number
  status?: string
  date?: string
  updatedAt?: string
  type?: string
}
interface CmsListResponse {
  items?: ContentItem[]
}
interface Site {
  id: string
  name?: string
}

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '已发布',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
}

function normalize(item: ContentItem): {
  title: string
  category: string
  score: number
  status: string
  date: string
} {
  return {
    title: item.title || '未命名',
    category: item.category || item.type || '-',
    score: typeof item.score === 'number' ? item.score : 0,
    status: STATUS_LABEL[item.status || ''] || item.status || '-',
    date: item.date || (item.updatedAt ? String(item.updatedAt).slice(0, 10) : '-'),
  }
}

export default function CmsList() {
  const [tab, setTab] = useState('product')
  const navigate = useNavigate()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        // 获取第一个站点的 id
        let siteId = 'default'
        try {
          const sitesRes = await apiClient.get<Site[] | { items?: Site[] }>('/sites')
          const sitesList = Array.isArray(sitesRes) ? sitesRes : (sitesRes as { items?: Site[] })?.items
          if (sitesList && sitesList.length > 0 && sitesList[0].id) {
            siteId = sitesList[0].id
          }
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            window.location.href = '/login'
            return
          }
        }

        const data = await apiClient.get<CmsListResponse | ContentItem[]>(
          `/cms/contents/${siteId}?type=${tab}`,
        )
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data as CmsListResponse)?.items || []
        setItems(list)
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          window.location.href = '/login'
          return
        }
        setError(e instanceof Error ? e.message : '加载失败')
        setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tab])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">内容管理</h1>
          <p className="text-sm text-muted-foreground">管理产品、案例、文章内容</p>
        </div>
        <Button onClick={() => navigate('/cms/edit')}><Plus className="w-4 h-4" /> 新建</Button>
      </div>

      <Tabs
        tabs={[
          { key: 'product', label: '产品' },
          { key: 'case', label: '案例' },
          { key: 'post', label: '文章' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="搜索内容..." />
        </div>
        <Select className="w-40"><option>全部分类</option><option>SaaS</option><option>模板</option><option>GEO</option></Select>
        <Select className="w-32"><option>全部状态</option><option>已发布</option><option>草稿</option></Select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">加载中...</div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle className="w-10 h-10" />}
          title="加载失败"
          description={error}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10" />}
          title="暂无内容"
          description="点击右上角“新建”创建第一条内容"
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>标题</Th><Th>分类</Th><Th>可引用性</Th><Th>更新时间</Th><Th>状态</Th><Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const n = normalize(item)
              return (
                <tr key={item.id ?? i} className="hover:bg-muted/50">
                  <Td className="font-medium">{n.title}</Td>
                  <Td><Badge>{n.category}</Badge></Td>
                  <Td>
                    <Badge variant={n.score >= 80 ? 'success' : n.score >= 60 ? 'warning' : 'danger'}>
                      {n.score}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground">{n.date}</Td>
                  <Td><Badge variant={n.status === '已发布' ? 'success' : 'default'}>{n.status}</Badge></Td>
                  <Td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(item.id ? `/cms/edit?id=${item.id}` : '/cms/edit')}
                    >
                      编辑
                    </Button>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </div>
  )
}
