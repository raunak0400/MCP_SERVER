export class TaskService {
  async findAll() {
    return []
  }
  async create(data: any) {
    return { id: '1', ...data }
  }
}
