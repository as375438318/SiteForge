import { Card, CardHeader, CardTitle, Button, Badge, Table, Th, Td, Select, Label, Input } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Database, RotateCcw } from 'lucide-react'

const backups = [
  { time: '2025-07-01 03:00', size: '45.2 MB', type: '定时备份', status: '成功' },
  { time: '2025-06-30 03:00', size: '44.8 MB', type: '定时备份', status: '成功' },
  { time: '2025-06-29 14:30', size: '44.5 MB', type: '手动备份', status: '成功' },
  { time: '2025-06-28 03:00', size: '43.9 MB', type: '定时备份', status: '成功' },
  { time: '2025-06-27 03:00', size: '43.2 MB', type: '升级前备份', status: '成功' },
]

export default function SystemBackup() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">备份恢复</h1><p className="text-sm text-muted-foreground">数据库与媒体文件备份管理</p></div>
        <Button onClick={() => { toast.info('正在创建备份...'); setTimeout(() => toast.success('备份完成'), 1500) }}><Database className="w-4 h-4" /> 立即备份</Button>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>定时备份配置</CardTitle></CardHeader>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>备份频率</Label><Select><option>每日</option><option>每周</option><option>每月</option></Select></div>
          <div><Label>备份时间</Label><Input defaultValue="03:00" /></div>
          <div><Label>保留份数</Label><Select><option>30 份</option><option>60 份</option><option>90 份</option></Select></div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>备份记录</CardTitle></CardHeader>
        <Table>
          <thead><tr><Th>备份时间</Th><Th>大小</Th><Th>类型</Th><Th>状态</Th><Th>操作</Th></tr></thead>
          <tbody>
            {backups.map((b, i) => (
              <tr key={i} className="hover:bg-muted/50">
                <Td className="text-muted-foreground whitespace-nowrap">{b.time}</Td>
                <Td>{b.size}</Td>
                <Td><Badge>{b.type}</Badge></Td>
                <Td><Badge variant="success">{b.status}</Badge></Td>
                <Td><div className="flex gap-1"><Button size="sm" variant="link" onClick={() => { if (confirm('确认从备份恢复？')) toast.info('恢复中...') }}>恢复</Button><Button size="sm" variant="link">下载</Button></div></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
