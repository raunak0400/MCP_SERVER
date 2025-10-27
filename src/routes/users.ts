import { Router } from 'express'
import { UserController } from '../controllers/userController.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = Router()
const userController = new UserController()

// All routes require authentication
router.use(verifyToken)

// User routes
router.get('/', requireRole('admin'), (req, res) => userController.list(req, res))
router.get('/:id', (req, res) => userController.getById(req, res))
router.put('/:id', (req, res) => userController.update(req, res))
router.delete('/:id', requireRole('admin'), (req, res) => userController.delete(req, res))
router.get('/stats/overview', requireRole('admin'), (req, res) => userController.getStats(req, res))

export default router
