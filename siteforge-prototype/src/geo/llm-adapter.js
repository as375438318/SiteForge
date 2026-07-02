/**
 * SiteForge - LLM 适配层
 * 统一兼容千问/DeepSeek/智谱/OpenAI 的 OpenAI 格式 API
 * 用户自配 API Key，按需充值
 */

const PROVIDER_PRESETS = {
  qwen: {
    name: '阿里千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  zhipu: {
    name: '智谱 GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: ['glm-4', 'glm-4-flash', 'glm-4-air'],
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
  },
}

class LLMAdapter {
  constructor(config = null) {
    this.provider = config
    this.usageLog = []
  }

  isConfigured() {
    return !!(this.provider && this.provider.apiKey)
  }

  configure(provider, apiKey, model) {
    const preset = PROVIDER_PRESETS[provider]
    if (!preset) throw new Error(`不支持的服务商: ${provider}`)
    this.provider = {
      name: provider,
      label: preset.name,
      baseURL: preset.baseURL,
      apiKey,
      model: model || preset.defaultModel,
    }
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: '未配置 API Key' }
    }
    try {
      const result = await this.chat([
        { role: 'user', content: '请回复"连接成功"四个字' },
      ], { maxTokens: 20 })
      return { success: true, message: `连接成功（${this.provider.label} / ${this.provider.model}）` }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  async chat(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('NOT_CONFIGURED: 尚未配置 LLM API Key')
    }

    const { temperature = 0.7, maxTokens = 2000 } = options
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.provider.apiKey}`,
        },
        body: JSON.stringify({
          model: this.provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        if (response.status === 401) throw new Error('INVALID_KEY: API Key 无效')
        if (response.status === 429) throw new Error('RATE_LIMIT: API 调用频率过高')
        if (response.status === 402) throw new Error('INSUFFICIENT_BALANCE: API 余额不足')
        throw new Error(`SERVER_ERROR: ${response.status} ${errorBody.substring(0, 200)}`)
      }

      const data = await response.json()
      const result = {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        duration: Date.now() - startTime,
      }

      this.usageLog.push({
        provider: this.provider.name,
        model: this.provider.model,
        ...result.usage,
        timestamp: new Date().toISOString(),
      })

      return result
    } catch (err) {
      if (err.message.includes('fetch')) {
        throw new Error('TIMEOUT: AI 服务请求超时，请检查网络或稍后重试')
      }
      throw err
    }
  }

  getUsageStats() {
    const total = this.usageLog.reduce((acc, log) => {
      acc.calls++
      acc.promptTokens += log.promptTokens
      acc.completionTokens += log.completionTokens
      acc.totalTokens += log.totalTokens
      return acc
    }, { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 })

    return { ...total, records: this.usageLog }
  }
}

module.exports = { LLMAdapter, PROVIDER_PRESETS }
