import { Card, CardHeader, CardTitle, Button, Select, Label, Input, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { Database } from 'lucide-react'

export default function SystemBackup() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">备份恢复</h1><p className="text-sm text-muted-foreground">数据库与媒体文件备份管理</p></div>
        <Button onClick={() => toast.info('备份 API 暂未实现')}><Database className="w-4 h-4" /> 立即备份</Button>
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
        <EmptyState
          icon={<Database className="w-10 h-10" />}
          title="暂无备份记录"
          description="备份 API 暂未实现，创建后将显示在此处"
        />
      </Card>
    </div>
  )
}
