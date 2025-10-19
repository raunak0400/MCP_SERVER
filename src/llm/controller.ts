import { LLMService } from './service.js'
import { PromptBuilder } from './promptBuilder.js'
import { Logger } from '../utils/logger.js'

export class LLMController {
  constructor(private llm: LLMService, private logger: Logger) {}

  async processPrompt(prompt: string): Promise<string> {
    try {
      this.logger.info(`Processing prompt: ${prompt.substring(0, 50)}...`)
      const result = await this.llm.generateCompletion(prompt)
      this.logger.info('Prompt processed successfully')
      return result
    } catch (error) {
      this.logger.error(`LLM error: ${error}`)
      throw error
    }
  }

  async analyzeText(text: string, task: string): Promise<string> {
    const messages = new PromptBuilder()
      .system(PromptBuilder.createSystemPrompt(task))
      .user(text)
      .build()
    
    const response = await this.llm.chat({ messages })
    return response.choices[0].message.content
  }

  async chatSession(userMessage: string, history: Array<{ role: 'user' | 'assistant', content: string }>): Promise<string> {
    return await this.llm.chatWithHistory(userMessage, history)
  }
}
