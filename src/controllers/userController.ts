import { Request, Response } from 'express'

export class UserController {
  async getUser(req: Request, res: Response) {
    res.json({ id: '1', name: 'User' })
  }
  async createUser(req: Request, res: Response) {
    res.json({ ok: true })
  }
}
