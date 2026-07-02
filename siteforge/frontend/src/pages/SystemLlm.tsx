import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, Input, Label, Button, Badge, Alert } from '@/components/ui'
import { toast } from '@/stores/toast'
import { CheckCircle2, XCircle } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api'

const providers = [
  { key: 'deepseek', name: 'DeepSeek', model: 'deepseek-chat', price: '¥0.001/千token', recommended: true },
  { key: 'qwen', name: '阿里千问', model: 'qwen-plus', price: '¥0.004/千token', recommended: false },
  { key: 'zhipu', name: '智谱 GLM', model: 'glm-4-flash', price: '¥0.001/千token', recommended: false },
  { key: 'openai', name: 'OpenAI', model: 'gpt-4o-mini', price: '$0.15/百万token', recommended: false },
]

interface LlmStatus {
  configured?: boolean
  provider?: string
  model?: string
  monthlyCalls?: number
  tokenUsage?: number
}

export default function SystemLlm() {
  const [provider, setProvider] = useState('deepseek')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('deepseek-chat')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)
  const [configured, setConfigured] = useState(false)
  const [monthlyCalls, setMonthlyCalls] = useState(0)
  const [tokenUsage, setTokenUsage] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // 拉取后端当前 LLM 状态
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiClient.get<LlmStatus>('/llm/status')
        if (cancelled) return
        if (data) {
          if (data.configured) setConfigured(true)
          if (data.provider) {
            setProvider(data.provider)
            const matched = providers.find((p) => p.key === data.provider)
            if (matched && !data.model) setModel(matched.model)
          }
          if (data.model) setModel(data.model)
          if (typeof data.monthlyCalls === 'number') setMonthlyCalls(data.monthlyCalls)
          if (typeof data.tokenUsage === 'number') setTokenUsage(data.tokenUsage)
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          window.location.href = '/login'
        }
        // 后端未实现，忽略
      } finally {
        if (!cancelled) setLoadingStatus(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      await apiClient.post('/llm/configure', {
        provider,
        apiKey,
        model,
        test: true,
      })
      setTestResult('success')
      toast.success('连接成功')
    } catch (e) {
      setTestResult('fail')
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('API Key 无效或后端未实现')
    } finally {
      setTesting(false)
    }
  }

  async function saveConfig() {
    try {
      await apiClient.post('/llm/configure', { provider, apiKey, model })
      setConfigured(true)
      toast.success('配置已保存')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
        return
      }
      toast.error('保存失败，请检查后端服务')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">LLM API 配置</h1>
        <p className="text-sm text-muted-foreground">配置第三方 LLM API，解锁 AI 引用模拟和智能写作建议</p>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div>
          <Card className="mb-4">
            <CardHeader><CardTitle>选择服务商</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-3">
              {providers.map((p) => (
                <div
                  key={p.key}
                  onClick={() => { setProvider(p.key); setModel(p.model) }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${provider === p.key ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    {p.recommended && <Badge variant="primary">推荐</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">模型：{p.model}</div>
                  <div className="text-xs text-muted-foreground">价格：{p.price}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mb-4">
            <CardHeader><CardTitle>API 配置</CardTitle></CardHeader>
            <div className="space-y-4">
              <div>
                <Label>API Key</Label>
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="粘贴你的 API Key" />
              </div>
              <div>
                <Label>模型名称</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={testConnection} disabled={testing}>
                  {testing ? '测试中...' : '测试连接'}
                </Button>
                <Button variant="secondary" onClick={saveConfig}>保存配置</Button>
              </div>
              {testResult === 'success' && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="w-4 h-4" /> 连接成功（{providers.find((p) => p.key === provider)?.name} / {model}）
                </div>
              )}
              {testResult === 'fail' && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="w-4 h-4" /> API Key 无效，请检查
                </div>
              )}
            </div>
          </Card>

          <Alert type="info">
            <div className="text-sm">
              <strong>💡 成本说明：</strong>DeepSeek 约 ¥0.001/千token，单次引用模拟约 ¥0.001。企业官网月均 GEO 分析成本：几元到十几元。
            </div>
          </Alert>
        </div>

        <div>
          <Card className="mb-4">
            <CardHeader><CardTitle>当前状态</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">配置状态</span>
                {loadingStatus ? (
                  <Badge variant="default">加载中</Badge>
                ) : configured ? (
                  <Badge variant="success">已配置</Badge>
                ) : (
                  <Badge variant="warning">未配置</Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">服务商</span>
                <span>{providers.find((p) => p.key === provider)?.name || provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">模型</span>
                <span>{model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">本月调用</span>
                <span>{monthlyCalls} 次</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token 消耗</span>
                <span>{tokenUsage.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Alert type="success" className="mb-4">
            <div className="text-xs">
              <strong>合规说明：</strong>官网内容为公开信息，发送至 API 分析不涉及隐私。线索/客户数据不会外发。可随时清空 Key 关闭。
            </div>
          </Alert>

          <Alert type="warning">
            <div className="text-xs">
              <strong>降级说明：</strong>未配置时 GEO 引擎使用规则引擎模式，基础功能可用。配置后解锁 AI 引用模拟和智能写作建议。
            </div>
          </Alert>
        </div>
      </div>
    </div>
  )
}
