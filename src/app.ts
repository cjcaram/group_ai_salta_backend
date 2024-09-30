import express from 'express';
import apiRoutes from './routes/api.ts';
import authRoutes from './routes/auth.ts';
import sequelize from './config/database';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:5173', // URL de tu frontend
    credentials: true,
  }));
app.use(express.json());
app.use(cookieParser());
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

sequelize.sync().then(() => {
    console.log('Base de datos sincronizada!');
  });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});

const httpsOptions = {
    key: fs.readFileSync(process.env.KEY_PATH),
    cert: fs.readFileSync(process.env.CERT_PATH),
};
  
https.createServer(httpsOptions, app).listen(3000, () => {
    console.log(`Servidor escuchando en el puerto ${PORT} con HTTPS`);
});


 // npx tsx src/app.ts