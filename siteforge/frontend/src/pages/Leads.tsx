import { Button, Table, Th, Td, Badge, Select, Input, Card } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Download, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const leads = [
  { time: '2025-07-01 14:32', name: '王先生', phone: '138****8888', source: '/contact', form: '在线咨询', status: '未处理' },
  { time: '2025-07-01 10:15', name: '李女士', phone: '159****6666', source: '/products', form: '产品咨询', status: '已联系' },
  { time: '2025-06-30 16:48', name: '张总', phone: '186****1234', source: '/contact', form: '在线咨询', status: '已成交' },
  { time: '2025-06-30 09:22', name: '陈先生', phone: '137****5555', source: '弹窗', form: '在线咨询', status: '未处理' },
  { time: '2025-06-29 15:30', name: '刘女士', phone: '135****9999', source: '/contact', form: '预约 demo', status: '已联系' },
  { time: '2025-06-28 11:10', name: '赵先生', phone: '188****0000', source: '/products', form: '产品咨询', status: '已成交' },
  { time: '2025-06-28 08:45', name: '孙女士', phone: '133****3333', source: '/contact', form: '在线咨询', status: '无效' },
  { time: '2025-06-27 17:20', name: '周总', phone: '131****7777', source: '浮动按钮', form: '在线咨询', status: '未处理' },
]

const statusMap: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  '未处理': 'info', '已联系': 'warning', '已成交': 'success', '无效': 'default',
}

export default function Leads() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">线索管理</h1><p className="text-sm text-muted-foreground">所有线索仅存储在本地服务器</p></div>
        <Button variant="secondary" onClick={() => toast.success('线索已导出为CSV')}><Download className="w-4 h-4" /> 导出CSV</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Select className="w-40"><option>全部时间</option><option>今天</option><option>7天</option><option>30天</option></Select>
        <Select className="w-40"><option>全部来源</option><option>/contact</option><option>/products</option><option>弹窗</option></Select>
        <Select className="w-40"><option>全部表单</option><option>在线咨询</option><option>产品咨询</option></Select>
        <Select className="w-32"><option>全部状态</option><option>未处理</option><option>已联系</option><option>已成交</option><option>无效</option></Select>
        <div className="flex-1" />
        <Badge variant="success"><Shield className="w-3 h-3" /> 线索仅存本地</Badge>
      </div>

      <Table>
        <thead><tr><Th>提交时间</Th><Th>姓名</Th><Th>联系方式</Th><Th>来源页面</Th><Th>表单</Th><Th>状态</Th><Th>操作</Th></tr></thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr key={i} className="hover:bg-muted/50">
              <Td className="text-muted-foreground whitespace-nowrap">{lead.time}</Td>
              <Td className="font-medium">{lead.name}</Td>
              <Td className="text-muted-foreground">{lead.phone}</Td>
              <Td className="text-muted-foreground">{lead.source}</Td>
              <Td><Badge>{lead.form}</Badge></Td>
              <Td><Badge variant={statusMap[lead.status]}>{lead.status}</Badge></Td>
              <Td><Button variant="link" size="sm" onClick={() => navigate('/leads/detail')}>查看</Button></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
