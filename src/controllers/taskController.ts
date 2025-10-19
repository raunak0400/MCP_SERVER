import { Request, Response } from 'express'

export class TaskController {
  async getTasks(req: Request, res: Response) {
    res.json([])
  }
  async createTask(req: Request, res: Response) {
    res.json({ ok: true })
  }
}
