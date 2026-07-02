import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, CardTitle, Badge, EmptyState, Input, Textarea, Label } from '@/components/ui'
import { toast } from '@/stores/toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Globe, Clock, AlertCircle, Plus } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api'

interface LeadDetail {
  id?: string
  name?: string
  phone?: string
  email?: string
  source?: string
  sourceUrl?: string
  form?: string
  formName?: string
  status?: string
  createdAt?: string
  time?: string
  message?: string
  content?: string
  timeline?: { time: string; content: string; action?: string }[]
}

const STATUSES = [
  { key: 'NEW', label: '未处理' },
  { key: 'READ', label: '已读' },
  { key: 'REPLIED', label: '已联系' },
  { key: 'ARCHIVED', label: '已归档' },
  { key: 'SPAM', label: '无效' },
]

function fmtTime(s?: string): string {
  if (!s) return '-'
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return s
}

export default function LeadsDetail() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [status, setStatus] = useState('NEW')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [timeline, setTimeline] = useState<{ time: string; content: string; action?: string }[]>([])

  useEffect(() => {
    let cancelled = false
    if (!id) {
      setError('缺少线索 ID')
      setLoading(false)
      return
    }
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.get<LeadDetail>(`/leads/detail/${id}`)
        if (cancelled) return
        setLead(data)
        setStatus(data?.status || 'NEW')
        setTimeline(data?.timeline || [])
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
  }, [id])

  async function changeStatus(next: string) {
    if (!id || next === status) return
    const prev = status
    setStatus(next)
    try {
      await apiClient.put(`/leads/${id}/status`, { status: next })
      toast.success(`状态已更新为：${STATUSES.find((s) => s.key === next)?.label || next}`)
    } catch (e) {
      setStatus(prev)
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('更新失败')
    }
  }

  async function addNote() {
    if (!newNote.trim()) {
      toast.error('请输入跟进内容')
      return
    }
    // 后端无独立跟进记录 API，仅在前端追加展示
    const entry = {
      time: fmtTime(new Date().toISOString()),
      content: newNote.trim(),
      action: 'admin',
    }
    setTimeline((prev) => [...prev, entry])
    setNewNote('')
    toast.success('已添加跟进记录')
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>
  }
  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-10 h-10" />}
        title="加载失败"
        description={error}
        action={<Button variant="secondary" onClick={() => navigate('/leads')}>返回列表</Button>}
      />
    )
  }
  if (!lead) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-10 h-10" />}
        title="未找到线索"
        action={<Button variant="secondary" onClick={() => navigate('/leads')}>返回列表</Button>}
      />
    )
  }

  const statusLabel = STATUSES.find((s) => s.key === status)?.label || status

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}><ArrowLeft className="w-4 h-4" /> 返回</Button>
          <h1 className="text-2xl font-bold">线索详情</h1>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div>
          <Card className="mb-4">
            <CardHeader><CardTitle>线索信息</CardTitle><Badge variant="info">{statusLabel}</Badge></CardHeader>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-xs text-muted-foreground mb-1">姓名</div><div className="text-sm font-medium">{lead.name || '-'}</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">电话</div><div className="text-sm font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {lead.phone || '-'}</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">邮箱</div><div className="text-sm font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {lead.email || '-'}</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">来源页面</div><div className="text-sm font-medium flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {lead.source || lead.sourceUrl || '-'}</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">提交时间</div><div className="text-sm font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lead.time || fmtTime(lead.createdAt)}</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">表单名称</div><div className="text-sm font-medium">{lead.form || lead.formName || '-'}</div></div>
            </div>
          </Card>

          <Card className="mb-4">
            <CardHeader><CardTitle>需求详情</CardTitle></CardHeader>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {lead.message || lead.content || '（无）'}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>跟进记录</CardTitle>
              <Button size="sm" variant="secondary" onClick={addNote}>添加记录</Button>
            </CardHeader>
            <div className="mb-4 space-y-2">
              <Label>新增跟进</Label>
              <Textarea
                rows={2}
                placeholder="输入跟进内容..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button size="sm" onClick={addNote}><Plus className="w-3.5 h-3.5" /> 添加</Button>
            </div>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">暂无跟进记录</div>
              ) : (
                timeline.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm">{item.content}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.time} · {item.action || '系统'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>跟进状态</CardTitle></CardHeader>
            <div className="space-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => changeStatus(s.key)}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${status === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
