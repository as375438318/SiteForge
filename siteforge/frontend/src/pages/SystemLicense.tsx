import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, Badge, Button, Alert, Table, Th, Td, EmptyState } from '@/components/ui'
import { toast } from '@/stores/toast'
import { apiClient, ApiError } from '@/lib/api'
import { AlertCircle } from 'lucide-react'

interface LicenseResponse {
  status?: string
  active?: boolean
  version?: string
  plan?: string
  licenseKey?: string
  domain?: string
  fingerprint?: string
  machineCode?: string
  expiresAt?: string
  daysLeft?: number
  features?: { name: string; granted: boolean }[]
}

export default function SystemLicense() {
  const [license, setLicense] = useState<LicenseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.get<LicenseResponse>('/license/status')
        if (cancelled) return
        setLicense(data)
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

  const active = license?.active !== false && license?.status !== 'expired' && license?.status !== 'invalid'

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">License 管理</h1><p className="text-sm text-muted-foreground">授权状态、续期、功能权限</p></div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>授权状态</CardTitle>
          <Badge variant={active ? 'success' : 'warning'}>
            {active ? '有效' : license?.status || '未知'}
          </Badge>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><div className="text-xs text-muted-foreground mb-1">授权版本</div><div className="text-sm font-medium">{license?.plan || license?.version || '-'}</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">License Key</div><div className="text-sm font-medium">{license?.licenseKey || '-'}</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">绑定域名</div><div className="text-sm font-medium">{license?.domain || '-'}</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">机器码</div><div className="text-sm font-medium">{license?.fingerprint || license?.machineCode || '-'}</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">有效期至</div><div className="text-sm font-medium">{license?.expiresAt || '-'}</div></div>
          <div><div className="text-xs text-muted-foreground mb-1">剩余天数</div><div className="text-sm font-medium text-success">{typeof license?.daysLeft === 'number' ? `${license.daysLeft} 天` : '-'}</div></div>
        </div>
        <div className="mt-4"><Button variant="secondary" onClick={() => toast.info('请联系商务团队续期')}>续期</Button></div>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>功能权限</CardTitle></CardHeader>
        <Table>
          <thead><tr><Th>功能模块</Th><Th>权限</Th></tr></thead>
          <tbody>
            {license?.features && license.features.length > 0 ? (
              license.features.map((f) => (
                <tr key={f.name} className="hover:bg-muted/50">
                  <Td className="font-medium">{f.name}</Td>
                  <Td><Badge variant={f.granted ? 'success' : 'warning'}>{f.granted ? '✅ 已授权' : '❌ 未授权'}</Badge></Td>
                </tr>
              ))
            ) : (
              <tr><Td className="text-muted-foreground text-center" >暂无功能权限数据</Td><Td></Td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Alert type="info"><div className="text-sm"><strong>降级说明：</strong>年度服务费过期后，软件仍可正常运行当前版本，仅不可升级。License 过期后已发布站点保持访问，管理功能锁定。</div></Alert>
    </div>
  )
}
