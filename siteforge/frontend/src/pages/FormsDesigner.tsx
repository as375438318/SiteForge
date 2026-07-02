import { Button, Card, CardHeader, CardTitle, Input, Select, Label, Toggle, Badge } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Type, Hash, List, CheckSquare, ChevronDown, Calendar, Phone, Mail, Upload, Plus, GripVertical } from 'lucide-react'
import { useState } from 'react'

const fieldTypes = [
  { icon: Type, label: '单行文本' }, { icon: Type, label: '多行文本' }, { icon: Hash, label: '数字' },
  { icon: CheckSquare, label: '单选' }, { icon: CheckSquare, label: '多选' }, { icon: ChevronDown, label: '下拉' },
  { icon: Calendar, label: '日期' }, { icon: Phone, label: '电话' }, { icon: Mail, label: '邮箱' },
]

const sampleFields = [
  { label: '姓名', type: '单行文本', required: true },
  { label: '电话', type: '电话', required: true },
  { label: '需求描述', type: '多行文本', required: false },
]

export default function FormsDesigner() {
  const [popupEnabled, setPopupEnabled] = useState(false)
  const [floatEnabled, setFloatEnabled] = useState(true)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">表单设计器</h1><p className="text-sm text-muted-foreground">设计询盘表单并配置投放位置</p></div>
        <Button onClick={() => toast.success('表单已保存')}>保存</Button>
      </div>

      <div className="flex h-[calc(100vh-12rem)] gap-5">
        {/* Left: Field Library */}
        <div className="w-56 flex-shrink-0">
          <Card className="h-full">
            <CardHeader><CardTitle className="text-sm">字段库</CardTitle></CardHeader>
            <div className="space-y-1">
              {fieldTypes.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary text-muted-foreground" onClick={() => toast.success(`已添加字段：${f.label}`)}>
                  <f.icon className="w-3.5 h-3.5" /> {f.label}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center: Form Canvas */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader><CardTitle>表单：在线咨询</CardTitle><Badge variant="success">3个字段</Badge></CardHeader>
            <div className="space-y-3">
              {sampleFields.map((field, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required && <Badge variant="danger">必填</Badge>}
                      <Badge variant="default">{field.type}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">编辑</Button>
                  <Button variant="ghost" size="sm">删除</Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" className="w-full"><Plus className="w-3.5 h-3.5" /> 添加字段</Button>
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
