import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
const authController = new AuthController()

// Public routes
router.post('/register', (req, res) => authController.register(req, res))
router.post('/login', (req, res) => authController.login(req, res))
router.post('/refresh', (req, res) => authController.refreshToken(req, res))

// Protected routes
router.get('/profile', verifyToken, (req, res) => authController.getProfile(req, res))
router.post('/api-key/generate', verifyToken, (req, res) => authController.generateApiKey(req, res))

export default router
