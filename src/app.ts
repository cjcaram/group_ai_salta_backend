import express from 'express';
import apiRoutes from './routes/api.ts';
import authRoutes from './routes/auth.ts';
import sequelize from './config/database';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

sequelize.sync().then(() => {
    console.log('Base de datos sincronizada!');
  });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});


 // npx tsx src/app.ts