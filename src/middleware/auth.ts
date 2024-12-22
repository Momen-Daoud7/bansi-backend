import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      }
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Set the user object with just the necessary data
    req.user = {
      id: decoded.userId, // Changed from userId to id to match interface
      email: decoded.email
      // Removed role since it's not in the interface
    };

    next();
  } catch (error) {
    next(new AppError(401, 'Invalid token'));
  }
};
