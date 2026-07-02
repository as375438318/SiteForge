import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button, Input, Label } from '@/components/ui'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    const ok = await login(username, password)
    setLoading(false)
    if (ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setError('用户名或密码错误')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-400/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/90 to-white/60 flex items-center justify-center text-2xl font-bold text-indigo-700 shadow-lg mb-3">
              ⚡
            </div>
            <h1 className="text-2xl font-bold text-white">SiteForge</h1>
            <p className="text-sm text-white/70 mt-1">AI 驱动的企业建站平台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/80">用户名</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60 focus:ring-white/20"
              />
            </div>
            <div>
              <Label className="text-white/80">密码</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60 focus:ring-white/20"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-400/40 text-red-100 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-white text-indigo-700 hover:bg-white/90 font-medium"
            >
              {loading ? '登录中...' : '登 录'}
            </Button>
          </form>

          <p className="text-center text-xs text-white/50 mt-6">
            © {new Date().getFullYear()} SiteForge · 本地部署版
          </p>
        </div>
      </div>
    </div>
  )
}
