import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user';

const router = Router();

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
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
      
        const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '35m' });

        res.json({ token });
    } catch (error) {
      res.status(400).json({ error: 'Error al iniciar sesión' });
    }
  });

export default router;