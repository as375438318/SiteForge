/**
 * SiteForge GEO 引擎 — LLM 适配层
 *
 * 统一兼容千问 / DeepSeek / 智谱 / OpenAI 的 OpenAI 格式 API。
 * 用户自配 API Key，按需充值。
 *
 * 降级策略：
 *   未配置 → NOT_CONFIGURED
 *   401     → INVALID_KEY
 *   429     → RATE_LIMIT（指数退避重试）
 *   402     → INSUFFICIENT_BALANCE
 *   超时    → TIMEOUT
 *   5xx/其他 → SERVER_ERROR
 */

import { z } from 'zod';
import {
  LLMError,
  type LLMProviderName,
  type LLMProvider,
  type ProviderPreset,
  type ChatMessage,
  type ChatOptions,
  type ChatResult,
  type ConnectionTestResult,
  type UsageStats,
  type UsageRecord,
  type TokenUsage,
} from './types';

// ========== Zod Schema ==========

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
}).strict();

export const ChatOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
  retries: z.number().int().min(0).max(5).optional(),
}).strict();

// ========== 服务商预置配置 ==========

export const PROVIDER_PRESETS: Record<Exclude<LLMProviderName, 'custom'>, ProviderPreset> = {
  qwen: {
    name: '阿里千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    pricePerMillion: { input: 0.004, output: 0.012 },
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    pricePerMillion: { input: 0.001, output: 0.002 },
  },
  zhipu: {
    name: '智谱 GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: ['glm-4', 'glm-4-flash', 'glm-4-air'],
    pricePerMillion: { input: 0.001, output: 0.001 },
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    pricePerMillion: { input: 0.15, output: 0.6 },
  },
};

// ========== 错误提示文案 ==========

export const ERROR_MESSAGES: Record<LLMError['type'], string> = {
  NOT_CONFIGURED:
    '尚未配置 LLM API Key，当前使用规则引擎模式。配置 Key 后可解锁 AI 智能分析。',
  INVALID_KEY: 'API Key 无效，请检查配置。当前已降级为规则引擎模式。',
  RATE_LIMIT: 'API 调用频率过高，请稍后重试。当前已降级为规则引擎模式。',
  INSUFFICIENT_BALANCE: 'API 余额不足，请充值后使用。当前已降级为规则引擎模式。',
  TIMEOUT: 'AI 分析请求超时，请稍后重试。当前已降级为规则引擎模式。',
  SERVER_ERROR: 'AI 服务暂时不可用，请稍后重试。当前已降级为规则引擎模式。',
  PARSE_ERROR: 'AI 返回内容解析失败。当前已降级为规则引擎模式。',
};

// ========== LLMAdapter 类 ==========

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;

export class LLMAdapter {
  private provider: LLMProvider | null;
  private usageLog: UsageRecord[] = [];

  constructor(config: LLMProvider | null = null) {
    this.provider = config;
  }

  /** 是否已配置 API Key */
  isConfigured(): boolean {
    return !!(this.provider && this.provider.apiKey);
  }

  /** 当前 provider（只读） */
  getProvider(): LLMProvider | null {
    return this.provider;
  }

  /** 配置 provider（基于预置） */
  configure(
    providerName: Exclude<LLMProviderName, 'custom'>,
    apiKey: string,
    model?: string,
  ): void {
    const preset = PROVIDER_PRESETS[providerName];
    if (!preset) {
      throw new LLMError(
        'SERVER_ERROR',
        `不支持的服务商: ${providerName}`,
      );
    }
    this.provider = {
      name: providerName,
      label: preset.name,
      baseURL: preset.baseURL,
      apiKey,
      model: model || preset.defaultModel,
    };
  }

  /** 自定义 provider（用于 baseURL 自定义的服务商） */
  configureCustom(config: {
    baseURL: string;
    apiKey: string;
    model: string;
    label?: string;
  }): void {
    this.provider = {
      name: 'custom',
      label: config.label || '自定义',
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      model: config.model,
    };
  }

  /** 连通性测试 */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      return { success: false, message: ERROR_MESSAGES.NOT_CONFIGURED };
    }
    try {
      const result = await this.chat(
        [{ role: 'user', content: '请回复"连接成功"四个字' }],
        { maxTokens: 20, retries: 0 },
      );
      const provider = this.provider!;
      return {
        success: true,
        message: `连接成功（${provider.label} / ${provider.model}，耗时 ${result.duration}ms）`,
      };
    } catch (err) {
      const message =
        err instanceof LLMError
          ? `${err.type}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      return { success: false, message };
    }
  }

  /**
   * 统一聊天接口（兼容 OpenAI 格式）
   * @throws {LLMError}
   */
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    const parsedMessages = z.array(ChatMessageSchema).parse(messages);
    const parsedOptions = ChatOptionsSchema.parse(options);

    if (!this.isConfigured() || !this.provider) {
      throw new LLMError('NOT_CONFIGURED', ERROR_MESSAGES.NOT_CONFIGURED);
    }

    const {
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      retries = 0,
    } = parsedOptions;

    const provider = this.provider;
    const url = `${provider.baseURL}/chat/completions`;
    const body = JSON.stringify({
      model: provider.model,
      messages: parsedMessages,
      temperature,
      max_tokens: maxTokens,
    });

    return this.callWithRetry(url, body, provider, timeoutMs, retries);
  }

  /** 内部：带重试的 fetch 调用 */
  private async callWithRetry(
    url: string,
    body: string,
    provider: LLMProvider,
    timeoutMs: number,
    retries: number,
    attempt = 0,
  ): Promise<ChatResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errType = this.classifyHttpError(response.status);
        // 仅对 RATE_LIMIT / SERVER_ERROR 重试
        if ((errType === 'RATE_LIMIT' || errType === 'SERVER_ERROR') && attempt < retries) {
          await this.backoff(attempt);
          return this.callWithRetry(url, body, provider, timeoutMs, retries, attempt + 1);
        }
        throw new LLMError(
          errType,
          `${response.status} ${errorBody.substring(0, 200)}`,
          response.status,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new LLMError('PARSE_ERROR', 'AI 返回格式异常：choices[0].message.content 缺失');
      }

      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      };

      const result: ChatResult = {
        content,
        usage,
        duration: Date.now() - startTime,
      };

      this.logUsage(provider, usage);
      return result;
    } catch (err) {
      // fetch 超时 / abort
      if (err instanceof Error && (err.name === 'AbortError' || /fetch/i.test(err.message))) {
        if (attempt < retries) {
          await this.backoff(attempt);
          return this.callWithRetry(url, body, provider, timeoutMs, retries, attempt + 1);
        }
        throw new LLMError('TIMEOUT', ERROR_MESSAGES.TIMEOUT);
      }
      // 已是 LLMError 直接抛出
      if (err instanceof LLMError) throw err;
      // 其他未知错误
      if (attempt < retries) {
        await this.backoff(attempt);
        return this.callWithRetry(url, body, provider, timeoutMs, retries, attempt + 1);
      }
      throw new LLMError('SERVER_ERROR', err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(timer);
    }
  }

  private classifyHttpError(status: number): LLMError['type'] {
    if (status === 401 || status === 403) return 'INVALID_KEY';
    if (status === 429) return 'RATE_LIMIT';
    if (status === 402) return 'INSUFFICIENT_BALANCE';
    return 'SERVER_ERROR';
  }

  /** 指数退避：500ms * 2^attempt */
  private backoff(attempt: number): Promise<void> {
    const delay = 500 * Math.pow(2, attempt);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private logUsage(provider: LLMProvider, usage: TokenUsage): void {
    this.usageLog.push({
      provider: provider.name,
      model: provider.model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      timestamp: new Date().toISOString(),
    });
  }

  /** 用量统计 */
  getUsageStats(): UsageStats {
    const total = this.usageLog.reduce(
      (acc, log) => {
        acc.calls++;
        acc.promptTokens += log.promptTokens;
        acc.completionTokens += log.completionTokens;
        acc.totalTokens += log.totalTokens;
        return acc;
      },
      { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    );
    return { ...total, records: [...this.usageLog] };
  }

  /** 清空用量记录 */
  resetUsage(): void {
    this.usageLog = [];
  }
}
