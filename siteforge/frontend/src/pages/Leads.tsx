import { useEffect, useState } from 'react'
import { Button, Table, Th, Td, Badge, Select, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Download, Shield, Inbox, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient, ApiError } from '@/lib/api'

interface Lead {
  id?: string
  time?: string
  createdAt?: string
  name?: string
  phone?: string
  email?: string
  source?: string
  sourceUrl?: string
  form?: string
  formName?: string
  status?: string
}
interface LeadsResponse {
  items?: Lead[]
}
interface Site {
  id: string
  name?: string
}

const STATUS_LABEL: Record<string, string> = {
  NEW: '未处理',
  READ: '已读',
  REPLIED: '已联系',
  ARCHIVED: '已归档',
  SPAM: '无效',
}
const statusMap: Record<string, 'info' | 'warning' | 'success' | 'default' | 'danger'> = {
  '未处理': 'info', '已联系': 'warning', '已成交': 'success', '无效': 'default',
  NEW: 'info', READ: 'info', REPLIED: 'warning', ARCHIVED: 'default', SPAM: 'danger',
}

function fmtTime(lead: Lead): string {
  if (lead.time) return lead.time
  if (lead.createdAt) {
    const d = new Date(lead.createdAt)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return String(lead.createdAt)
  }
  return '-'
}

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [siteId, setSiteId] = useState('default')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
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

        const data = await apiClient.get<LeadsResponse | Lead[]>(`/leads/${sid}`)
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data as LeadsResponse)?.items || []
        setLeads(list)
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          window.location.href = '/login'
          return
        }
        setError(e instanceof Error ? e.message : '加载失败')
        setLeads([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function exportCsv() {
    try {
      // 后端可能返回 JSON 或 CSV 文本
      const res = await fetch(`/api/leads/${siteId}/export`, {
        headers: {
          ...(localStorage.getItem('sf-token')
            ? { Authorization: `Bearer ${localStorage.getItem('sf-token')}` }
            : {}),
        },
      })
      if (!res.ok) throw new Error(`导出失败: ${res.status}`)
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        // 后端返回 JSON 数组，前端转 CSV
        const data = await res.json()
        const arr: Lead[] = Array.isArray(data) ? data : (data?.items || [])
        if (arr.length === 0) {
          toast.info('暂无线索可导出')
          return
        }
        const header = ['提交时间', '姓名', '联系方式', '来源', '表单', '状态']
        const rows = arr.map((l) => [
          fmtTime(l),
          l.name || '',
          l.phone || '',
          l.source || l.sourceUrl || '',
          l.form || l.formName || '',
          STATUS_LABEL[l.status || ''] || l.status || '',
        ])
        const csv = [header, ...rows]
          .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
          .join('\n')
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-${siteId}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-${siteId}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success('线索已导出为CSV')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('导出失败')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">线索管理</h1>
          <p className="text-sm text-muted-foreground">所有线索仅存储在本地服务器</p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          <Download className="w-4 h-4" /> 导出CSV
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Select className="w-40"><option>全部时间</option><option>今天</option><option>7天</option><option>30天</option></Select>
        <Select className="w-40"><option>全部来源</option><option>/contact</option><option>/products</option><option>弹窗</option></Select>
        <Select className="w-40"><option>全部表单</option><option>在线咨询</option><option>产品咨询</option></Select>
        <Select className="w-32"><option>全部状态</option><option>未处理</option><option>已联系</option><option>已成交</option><option>无效</option></Select>
        <div className="flex-1" />
        <Badge variant="success"><Shield className="w-3 h-3" /> 线索仅存本地</Badge>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">加载中...</div>
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-10 h-10" />} title="加载失败" description={error} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-10 h-10" />}
          title="暂无线索"
          description="当访客提交表单后，线索将显示在此处"
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>提交时间</Th><Th>姓名</Th><Th>联系方式</Th><Th>来源页面</Th><Th>表单</Th><Th>状态</Th><Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => {
              const status = STATUS_LABEL[lead.status || ''] || lead.status || '未处理'
              return (
                <tr key={lead.id ?? i} className="hover:bg-muted/50">
                  <Td className="text-muted-foreground whitespace-nowrap">{fmtTime(lead)}</Td>
                  <Td className="font-medium">{lead.name || '-'}</Td>
                  <Td className="text-muted-foreground">{lead.phone || '-'}</Td>
                  <Td className="text-muted-foreground">{lead.source || lead.sourceUrl || '-'}</Td>
                  <Td><Badge>{lead.form || lead.formName || '-'}</Badge></Td>
                  <Td><Badge variant={statusMap[status] || 'default'}>{status}</Badge></Td>
                  <Td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(lead.id ? `/leads/detail?id=${lead.id}` : '/leads/detail')}
                    >
                      查看
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
