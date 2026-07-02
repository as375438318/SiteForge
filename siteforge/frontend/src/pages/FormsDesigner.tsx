import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, CardTitle, Input, Select, Label, Toggle, Badge, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Type, Hash, CheckSquare, ChevronDown, Calendar, Phone, Mail, Plus, GripVertical, AlertCircle } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api'

const fieldTypes = [
  { icon: Type, label: '单行文本' }, { icon: Type, label: '多行文本' }, { icon: Hash, label: '数字' },
  { icon: CheckSquare, label: '单选' }, { icon: CheckSquare, label: '多选' }, { icon: ChevronDown, label: '下拉' },
  { icon: Calendar, label: '日期' }, { icon: Phone, label: '电话' }, { icon: Mail, label: '邮箱' },
]

interface FormField {
  label: string
  type: string
  required: boolean
}
interface FormItem {
  id?: string
  name?: string
  title?: string
  fields?: FormField[]
  popupEnabled?: boolean
  floatEnabled?: boolean
  embedPage?: string
  notifyEmail?: string
  webhookUrl?: string
}
interface Site {
  id: string
  name?: string
}

export default function FormsDesigner() {
  const [popupEnabled, setPopupEnabled] = useState(false)
  const [floatEnabled, setFloatEnabled] = useState(true)
  const [fields, setFields] = useState<FormField[]>([])
  const [formId, setFormId] = useState<string | undefined>(undefined)
  const [formName, setFormName] = useState('在线咨询')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

        const data = await apiClient.get<FormItem[] | { items?: FormItem[] }>(`/forms/${sid}`)
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data as { items?: FormItem[] })?.items || []
        if (list.length > 0) {
          const f = list[0]
          setFormId(f.id)
          setFormName(f.name || f.title || '在线咨询')
          setFields(f.fields || [])
          if (typeof f.popupEnabled === 'boolean') setPopupEnabled(f.popupEnabled)
          if (typeof f.floatEnabled === 'boolean') setFloatEnabled(f.floatEnabled)
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

  async function save() {
    setSaving(true)
    try {
      const payload: FormItem = {
        name: formName,
        fields,
        popupEnabled,
        floatEnabled,
      }
      if (formId) {
        await apiClient.put(`/forms/${formId}`, payload)
      } else {
        const res = await apiClient.post<FormItem>('/forms', { ...payload, siteId })
        if (res?.id) setFormId(res.id)
      }
      toast.success('表单已保存')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
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
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">表单设计器</h1><p className="text-sm text-muted-foreground">设计询盘表单并配置投放位置</p></div>
        <Button onClick={save} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
      </div>

      <div className="flex h-[calc(100vh-12rem)] gap-5">
        {/* Left: Field Library */}
        <div className="w-56 flex-shrink-0">
          <Card className="h-full">
            <CardHeader><CardTitle className="text-sm">字段库</CardTitle></CardHeader>
            <div className="space-y-1">
              {fieldTypes.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary text-muted-foreground"
                  onClick={() => setFields((prev) => [...prev, { label: f.label, type: f.label, required: false }])}
                >
                  <f.icon className="w-3.5 h-3.5" /> {f.label}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center: Form Canvas */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>表单：{formName}</CardTitle>
              <Badge variant="success">{fields.length}个字段</Badge>
            </CardHeader>
            <div className="space-y-3">
              {fields.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  暂无字段，从左侧字段库添加
                </div>
              ) : (
                fields.map((field, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.required && <Badge variant="danger">必填</Badge>}
                        <Badge variant="default">{field.type}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newLabel = prompt('字段名称', field.label)
                        if (newLabel !== null) {
                          setFields((prev) => prev.map((p, idx) => idx === i ? { ...p, label: newLabel } : p))
                        }
                      }}
                    >编辑</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!confirm('确认删除该字段？')) return
                        setFields((prev) => prev.filter((_, idx) => idx !== i))
                      }}
                    >删除</Button>
                  </div>
                ))
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setFields((prev) => [...prev, { label: '新字段', type: '单行文本', required: false }])}
              >
                <Plus className="w-3.5 h-3.5" /> 添加字段
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Placement Settings */}
        <div className="w-72 flex-shrink-0">
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-sm">投放设置</CardTitle></CardHeader>
            <div className="mb-3"><Label>嵌入页面</Label><Select><option>联系页</option><option>首页</option><option>全部页面</option></Select></div>
            <div className="mb-3"><Label>弹窗触发</Label><div className="flex items-center gap-2 mt-1"><Toggle checked={popupEnabled} onChange={setPopupEnabled} /><span className="text-sm">{popupEnabled ? '已开启' : '已关闭'}</span></div></div>
            {popupEnabled && <div className="mb-3"><Label>触发规则</Label><Select><option>滚动50%时</option><option>停留30秒后</option><option>退出意图</option></Select></div>}
            <div className="mb-3"><Label>浮动按钮</Label><div className="flex items-center gap-2 mt-1"><Toggle checked={floatEnabled} onChange={setFloatEnabled} /><span className="text-sm">{floatEnabled ? '已开启' : '已关闭'}</span></div></div>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">通知配置</CardTitle></CardHeader>
            <div className="mb-3"><Label>邮件通知</Label><Input placeholder="notify@example.com" /></div>
            <div className="mb-3"><Label>Webhook URL</Label><Input placeholder="https://..." /></div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Toggle checked onChange={() => {}} /><span className="text-sm">微信通知</span></div>
              <div className="flex items-center gap-2"><Toggle checked={false} onChange={() => {}} /><span className="text-sm">钉钉通知</span></div>
              <div className="flex items-center gap-2"><Toggle checked={false} onChange={() => {}} /><span className="text-sm">飞书通知</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
