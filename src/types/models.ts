export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Task {
  id: string
  title: string
  status: string
  userId: string
}
