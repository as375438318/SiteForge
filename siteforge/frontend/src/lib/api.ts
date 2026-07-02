const API_BASE = '/api'

export class ApiError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`${status}: ${body}`)
    this.status = status
    this.body = body
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('sf-token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  // 处理可能为空的响应（如 204）
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, data?: any) =>
    api<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: any) =>
    api<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
}
