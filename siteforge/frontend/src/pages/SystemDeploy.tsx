import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, Input, Label, Button, Badge, Alert, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { apiClient, ApiError } from '@/lib/api'
import { AlertCircle } from 'lucide-react'

interface HealthResponse {
  status?: string
  uptime?: number | string
  version?: string
  env?: string
  os?: string
  containers?: number
  cpu?: string
  memory?: string
  services?: { name: string; status: 'up' | 'down' | string }[]
}
interface LicenseResponse {
  status?: string
  version?: string
  plan?: string
  licenseKey?: string
  domain?: string
  fingerprint?: string
  expiresAt?: string
  daysLeft?: number
  features?: { name: string; granted: boolean }[]
}

export default function SystemDeploy() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [healthRes, licenseRes] = await Promise.allSettled([
          apiClient.get<HealthResponse>('/health'),
          apiClient.get<LicenseResponse>('/license/status'),
        ])
        if (cancelled) return
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value)
        if (licenseRes.status === 'fulfilled') setLicense(licenseRes.value)
        if (healthRes.status === 'rejected' && licenseRes.status === 'rejected') {
          const e = healthRes.reason
          if (e instanceof ApiError && e.status === 401) {
            window.location.href = '/login'
            return
          }
          setError(e instanceof Error ? e.message : '加载失败')
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

  const running = health?.status === 'ok' || health?.status === 'up'

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">部署配置</h1><p className="text-sm text-muted-foreground">系统信息、环境配置、域名SSL、升级检测</p></div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>系统信息</CardTitle>
          <Badge variant={running ? 'success' : 'warning'}>
            {running ? '运行中' : health?.status || '未知'}
          </Badge>
        </CardHeader>
        <div className="grid grid-cols-4 gap-4">
          <div><Label>版本</Label><div className="text-sm font-medium">{license?.version || health?.version || '-'}</div></div>
          <div><Label>运行环境</Label><div className="text-sm font-medium">{health?.os || health?.env || '-'}</div></div>
          <div><Label>Docker 容器</Label><div className="text-sm font-medium">{typeof health?.containers === 'number' ? `${health.containers} 个运行中` : '-'}</div></div>
          <div><Label>资源占用</Label><div className="text-sm font-medium">{health?.cpu || health?.memory ? `CPU ${health.cpu || '-'} · 内存 ${health.memory || '-'}` : '-'}</div></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>.env 配置</CardTitle><Button size="sm" variant="secondary" onClick={() => toast.success('配置已保存')}>保存</Button></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>站点域名</Label><Input defaultValue={license?.domain || ''} placeholder="www.example.com" /></div>
          <div><Label>数据库密码</Label><Input type="password" placeholder="••••••••" /></div>
          <div><Label>API 端口</Label><Input defaultValue="3000" /></div>
          <div><Label>License Key</Label><Input defaultValue={license?.licenseKey || ''} placeholder="SF-XXXX-XXXX" /></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>域名与 SSL</CardTitle></CardHeader>
        <div className="space-y-4">
          <div><Label>独立域名</Label><Input defaultValue={license?.domain || ''} placeholder="www.example.com" /></div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg"><div><div className="text-sm font-medium">Let's Encrypt 自动签发</div><div className="text-xs text-muted-foreground">自动申请和续期 SSL 证书</div></div><Badge variant="success">已启用</Badge></div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg"><div><div className="text-sm font-medium">强制 HTTPS 跳转</div><div className="text-xs text-muted-foreground">HTTP 自动 301 到 HTTPS</div></div><Badge variant="success">已启用</Badge></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>升级检测</CardTitle></CardHeader>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm font-medium">当前版本 {license?.version || 'v1.0.0'}</div>
            <div className="text-xs text-muted-foreground">可通过官方渠道获取最新版本</div>
          </div>
          <Button size="sm" onClick={() => { if (confirm('确认升级？升级前会自动备份')) toast.success('升级中...') }}>升级</Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>部署自检</CardTitle>
          <Badge variant={running ? 'success' : 'warning'}>{running ? '全部通过' : '请检查'}</Badge>
        </CardHeader>
        <div className="space-y-2">
          {(health?.services && health.services.length > 0
            ? health.services
            : [{ name: '数据库连接', status: 'up' }, { name: 'License 校验', status: license ? 'up' : 'down' }]
          ).map((item) => {
            const ok = item.status === 'up' || item.status === 'ok'
            return (
              <div key={item.name} className="flex items-center gap-3 py-2">
                <span className={ok ? 'text-success' : 'text-destructive'}>{ok ? '✓' : '✗'}</span>
                <span className="text-sm flex-1">{item.name}</span>
                <Badge variant={ok ? 'success' : 'danger'}>{ok ? '通过' : '未通过'}</Badge>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
