export class UserService {
  async findById(id: string) {
    return { id, name: 'User' }
  }
  async create(data: any) {
    return { id: '1', ...data }
  }
}
