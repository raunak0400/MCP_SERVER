import { Logger } from '../utils/logger.js'

export class SchedulerService {
  private timer: NodeJS.Timer | null = null
  constructor(private logger: Logger) {}
  start() {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.logger.info('scheduler tick')
    }, 60000)
  }
  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
