import { Router } from 'express'
import { TaskController } from '../controllers/taskController.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
const taskController = new TaskController()

// All routes require authentication
router.use(verifyToken)

// Task routes
router.get('/', (req, res) => taskController.list(req, res))
router.post('/', (req, res) => taskController.create(req, res))
router.get('/stats', (req, res) => taskController.getStats(req, res))
router.get('/:id', (req, res) => taskController.getById(req, res))
router.put('/:id', (req, res) => taskController.update(req, res))
router.delete('/:id', (req, res) => taskController.delete(req, res))
router.post('/:id/execute', (req, res) => taskController.execute(req, res))

export default router
