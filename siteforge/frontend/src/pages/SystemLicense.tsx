import { Card, CardHeader, CardTitle, Badge, Button, Alert, Table, Th, Td } from '@/components/ui'
import { toast } from '@/stores/toast'

export default function SystemLicense() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">License 管理</h1><p className="text-sm text-muted-foreground">授权状态、续期、功能权限</p></div>

      <Card className="mb-4">
        <CardHeader><CardTitle>授权状态</CardTitle><Badge variant="success">有效</Badge></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><div className="text-xs text-muted-foreground mb-1">授权版本</div><div className="text-sm font-medium">Standard（标准版）</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">License Key</div><div className="text-sm font-medium">SF-2025-*****-00001</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">绑定域名</div><div className="text-sm font-medium">www.zhiyun-tech.com</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">机器码</div><div className="text-sm font-medium">a3f8b2c1...</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">有效期至</div><div className="text-sm font-medium">2026-07-01</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">剩余天数</div><div className="text-sm font-medium text-success">365 天</div></div>
        </div>
        <div className="mt-4"><Button variant="secondary" onClick={() => toast.info('请联系商务团队续期')}>续期</Button></div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>功能权限</CardTitle></CardHeader>
        <Table>
          <thead><tr><Th>功能模块</Th><Th>权限</Th></tr></thead>
          <tbody>
            {[['AI 结构复刻', '✅ 已授权'], ['可视化编辑器', '✅ 已授权'], ['SEO 引擎', '✅ 已授权'], ['GEO 规则引擎', '✅ 已授权'], ['GEO LLM 增强', '❌ 需升级 Pro 版'], ['多站点管理', '❌ 需升级 Pro 版'], ['源码授权', '❌ 需升级 Source 版']].map(([f, p]) => (
              <tr key={f} className="hover:bg-muted/50"><Td className="font-medium">{f}</Td><Td><Badge variant={p.startsWith('✅') ? 'success' : 'warning'}>{p}</Badge></Td></tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Alert type="info"><div className="text-sm"><strong>降级说明：</strong>年度服务费过期后，软件仍可正常运行当前版本，仅不可升级。License 过期后已发布站点保持访问，管理功能锁定。</div></Alert>
    </div>
  )
}
