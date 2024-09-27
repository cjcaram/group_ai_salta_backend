import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenPayload } from 'dto/TokenPayload';

dotenv.config();

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    req.user = { id: payload.id, username: payload.username };

    next();
  } catch (error) {
    return res.status(401).json({ status: 'session expired' });
  }
};
