export interface LLMConfig {
  provider: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    message: ChatMessage
    finishReason: string
  }>
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}
