export class TokenCounter {
  static estimate(text: string): number {
    return Math.ceil(text.length / 4)
  }

  static estimateMessages(messages: Array<{ content: string }>): number {
    return messages.reduce((total, msg) => total + this.estimate(msg.content), 0)
  }

  static truncate(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimate(text)
    if (estimatedTokens <= maxTokens) {
      return text
    }
    const ratio = maxTokens / estimatedTokens
    const targetLength = Math.floor(text.length * ratio)
    return text.substring(0, targetLength)
  }
}

export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
    return mockEmbedding
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must have same length')
    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}
