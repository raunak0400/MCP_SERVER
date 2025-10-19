import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'
import { LLMConfig, ChatCompletionRequest, ChatCompletionResponse } from './types.js'

export class LLMService {
  private provider: OpenAIProvider | AnthropicProvider

  constructor(config: LLMConfig) {
    if (config.provider === 'openai') {
      this.provider = new OpenAIProvider(config)
    } else if (config.provider === 'anthropic') {
      this.provider = new AnthropicProvider(config)
    } else {
      throw new Error(`Unsupported LLM provider: ${config.provider}`)
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return await this.provider.chat(request)
  }

  async generateCompletion(prompt: string): Promise<string> {
    const response = await this.chat({
      messages: [{ role: 'user', content: prompt }]
    })
    return response.choices[0].message.content
  }

  async chatWithHistory(userMessage: string, history: Array<{ role: 'user' | 'assistant', content: string }>): Promise<string> {
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: userMessage }
    ]
    const response = await this.chat({ messages })
    return response.choices[0].message.content
  }
}
