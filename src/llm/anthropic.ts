import { LLMConfig, ChatCompletionRequest, ChatCompletionResponse } from './types.js'

export class AnthropicProvider {
  private apiKey: string
  private baseUrl: string = 'https://api.anthropic.com/v1'

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: request.messages.filter(m => m.role !== 'system'),
        system: request.messages.find(m => m.role === 'system')?.content || '',
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      model: data.model,
      choices: [{
        message: {
          role: 'assistant',
          content: data.content[0].text
        },
        finishReason: data.stop_reason
      }],
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      }
    }
  }
}
