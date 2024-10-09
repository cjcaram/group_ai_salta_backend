import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
import { TokenPayload } from 'dto/TokenPayload.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = Router();

const accessTokenOptions = {
  httpOnly: true,
  secure: true, // Solo en HTTPS
  maxAge: 60 * 60 * 1000, // 60 minutos en milisegundos
  sameSite: 'strict' as const, // Previene CSRF
};

const refreshTokenOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
  sameSite: 'strict' as const,
};

router.post('/register', authenticateToken,
  [
    body('username')
      .isAlphanumeric()
      .withMessage('El nombre de usuario debe ser alfanumérico')
      .isLength({ min: 3 })
      .withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        password: hashedPassword,
      });

      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
      res.status(400).json({ error: 'Error al registrar el usuario' });
    }
});

router.post('/login', 
  [
    body('username').notEmpty().withMessage('El nombre de usuario es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await User.findOne({ where: { username } });
      
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.get('password'));
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const payload = {
        id: user.get('id'),
        username: user.get('username'),
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '60m' });
      
      const refreshToken = jwt.sign(
        { id: user.get('id') }, 
        process.env.JWT_REFRESH_SECRET!, 
        { expiresIn: '7d' }
      );
      
      user.set('refreshToken', refreshToken);
      await user.save();

      res.cookie('accessToken', token, accessTokenOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenOptions);

      res.json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
      console.error('Error al refrescar token:', error);
      return res.status(403).json({ error: 'Refresh token inválido' });
    }
});

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ error: 'Token no proporcionado' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;

    const user = await User.findByPk(payload.id);

    if (!user || user.get('refreshToken') !== refreshToken) {
      return res.status(403).json({ error: 'Refresh token inválido' });
    }

    const newAccessToken = jwt.sign(
      { id: user.get('id'), username: user.get('username') },
      process.env.JWT_SECRET!,
      { expiresIn: '60m' }
    );

    // Establecer la nueva cookie de access token
    res.cookie('accessToken', newAccessToken, accessTokenOptions);

    res.json({ message: 'Access token renovado' });
  } catch (error) {
    console.error('Error al refrescar token:', error);
    return res.status(403).json({ error: 'Refresh token inválido' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user?.id);

    if (user) {
      user.set('refreshToken', null);
      await user.save();

      // Limpiar las cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({ message: 'Sesión cerrada exitosamente' });
    } else {
      res.status(400).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

router.get('/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;