import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);



export default router;