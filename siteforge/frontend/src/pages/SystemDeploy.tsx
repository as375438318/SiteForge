import { Card, CardHeader, CardTitle, Input, Label, Button, Badge, Alert } from '@/components/ui'
import { toast } from '@/stores/toast'

export default function SystemDeploy() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">部署配置</h1><p className="text-sm text-muted-foreground">系统信息、环境配置、域名SSL、升级检测</p></div>

      <Card className="mb-4">
        <CardHeader><CardTitle>系统信息</CardTitle><Badge variant="success">运行中</Badge></CardHeader>
        <div className="grid grid-cols-4 gap-4">
          <div><Label>版本</Label><div className="text-sm font-medium">v1.0.0</div></div>
          <div><Label>运行环境</Label><div className="text-sm font-medium">Ubuntu 22.04</div></div>
          <div><Label>Docker 容器</Label><div className="text-sm font-medium">4 个运行中</div></div>
          <div><Label>资源占用</Label><div className="text-sm font-medium">CPU 12% · 内存 1.2GB</div></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>.env 配置</CardTitle><Button size="sm" variant="secondary" onClick={() => toast.success('配置已保存')}>保存</Button></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>站点域名</Label><Input defaultValue="www.zhiyun-tech.com" /></div>
          <div><Label>数据库密码</Label><Input type="password" defaultValue="••••••••" /></div>
          <div><Label>API 端口</Label><Input defaultValue="3000" /></div>
          <div><Label>License Key</Label><Input defaultValue="SF-2025-00001" /></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>域名与 SSL</CardTitle></CardHeader>
        <div className="space-y-4">
          <div><Label>独立域名</Label><Input defaultValue="www.zhiyun-tech.com" /></div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg"><div><div className="text-sm font-medium">Let's Encrypt 自动签发</div><div className="text-xs text-muted-foreground">自动申请和续期 SSL 证书</div></div><Badge variant="success">已启用</Badge></div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg"><div><div className="text-sm font-medium">强制 HTTPS 跳转</div><div className="text-xs text-muted-foreground">HTTP 自动 301 到 HTTPS</div></div><Badge variant="success">已启用</Badge></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>升级检测</CardTitle></CardHeader>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div><div className="text-sm font-medium">当前版本 v1.0.0</div><div className="text-xs text-muted-foreground">最新版本 v1.1.0（新增AI内容生成功能）</div></div>
          <Button size="sm" onClick={() => { if (confirm('确认升级？升级前会自动备份')) toast.success('升级中...') }}>升级</Button>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>部署自检</CardTitle><Badge variant="success">全部通过</Badge></CardHeader>
        <div className="space-y-2">
          {['数据库连接', 'Redis 连通', 'Nginx 路由', 'License 校验', 'SSL 证书'].map(item => (
            <div key={item} className="flex items-center gap-3 py-2"><span className="text-success">✓</span><span className="text-sm flex-1">{item}</span><Badge variant="success">通过</Badge></div>
          ))}
        </div>
      </Card>
    </div>
  )
}
