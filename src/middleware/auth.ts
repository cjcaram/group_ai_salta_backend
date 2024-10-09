import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenPayload } from 'dto/TokenPayload.js';

dotenv.config();

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If token is not provided, then obtain from cookies
  if (!token) {
    token = req.cookies.accessToken;
  }

  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    req.user = { id: payload.id, username: payload.username };

    next();
  } catch (error) {
    return res.status(401).json({ status: 'session expired' });
  }
};
