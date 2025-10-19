import { LLMConfig, ChatCompletionRequest, ChatCompletionResponse } from './types.js'

export class OpenAIProvider {
  private apiKey: string
  private baseUrl: string = 'https://api.openai.com/v1'

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      model: data.model,
      choices: data.choices.map((choice: any) => ({
        message: choice.message,
        finishReason: choice.finish_reason
      })),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    }
  }
}
