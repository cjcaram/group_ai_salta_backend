import { JwtPayload } from 'jsonwebtoken';

export interface TokenPayload extends JwtPayload {
    id: number;
    username: string;
    iat: number;
    exp: number;
  }