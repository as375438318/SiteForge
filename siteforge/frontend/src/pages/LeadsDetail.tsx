import { Button, Card, CardHeader, CardTitle, Badge } from '@/components/ui'
import { toast } from '@/stores/toast'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Globe, Clock } from 'lucide-react'
import { useState } from 'react'

const timeline = [
  { time: '2025-07-01 14:32', content: '用户提交咨询表单', action: '系统' },
  { time: '2025-07-01 15:00', content: '已电话联系客户，客户表示对CRM系统感兴趣', action: 'admin' },
  { time: '2025-07-01 16:30', content: '已发送产品资料到客户邮箱', action: 'admin' },
]

const statuses = ['未处理', '已联系', '已成交', '无效']

export default function LeadsDetail() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('未处理')

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
            <CardHeader><CardTitle>线索信息</CardTitle><Badge variant="info">{status}</Badge></CardHeader>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-xs text-muted-foreground mb-1">姓名</div><div className="text-sm font-medium">王先生</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">电话</div><div className="text-sm font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> 138****8888</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">邮箱</div><div className="text-sm font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> wang@example.com</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">来源页面</div><div className="text-sm font-medium flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> /contact</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">提交时间</div><div className="text-sm font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2025-07-01 14:32</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">表单名称</div><div className="text-sm font-medium">在线咨询</div></div>
            </div>
          </Card>

          <Card className="mb-4">
            <CardHeader><CardTitle>需求详情</CardTitle></CardHeader>
            <div className="text-sm text-muted-foreground leading-relaxed">您好，我们是一家制造企业，约50人规模。想了解贵公司的CRM系统，主要关注：1. 是否支持定制开发 2. 数据能否本地部署 3. 价格方案。方便的话请安排demo演示。</div>
          </Card>

          <Card>
            <CardHeader><CardTitle>跟进记录</CardTitle><Button size="sm" variant="secondary" onClick={() => toast.success('已添加跟进记录')}>添加记录</Button></CardHeader>
            <div className="space-y-3">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1"><div className="text-sm">{item.content}</div><div className="text-xs text-muted-foreground mt-1">{item.time} · {item.action}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>跟进状态</CardTitle></CardHeader>
            <div className="space-y-2">
              {statuses.map(s => (
                <button key={s} onClick={() => { setStatus(s); toast.success(`状态已更新为：${s}`) }} className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
