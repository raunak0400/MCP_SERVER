import { ChatMessage } from './types.js'

export class PromptBuilder {
  private messages: ChatMessage[] = []

  system(content: string): this {
    this.messages.push({ role: 'system', content })
    return this
  }

  user(content: string): this {
    this.messages.push({ role: 'user', content })
    return this
  }

  assistant(content: string): this {
    this.messages.push({ role: 'assistant', content })
    return this
  }

  build(): ChatMessage[] {
    return this.messages
  }

  static createSystemPrompt(task: string, context?: string): string {
    let prompt = `You are a helpful AI assistant. Your task is to ${task}.`
    if (context) {
      prompt += ` Context: ${context}`
    }
    return prompt
  }

  static createFewShotPrompt(examples: Array<{ input: string, output: string }>, query: string): string {
    let prompt = 'Here are some examples:\n\n'
    examples.forEach((ex, i) => {
      prompt += `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n\n`
    })
    prompt += `Now, process this input:\n${query}`
    return prompt
  }
}
