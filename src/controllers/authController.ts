import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        throw new AppError(400, 'Missing required fields');
      }

      const result = await this.authService.register(email, password, name);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new AppError(400, 'Missing required fields');
      }

      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}