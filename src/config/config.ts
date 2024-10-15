import { config } from 'dotenv';

config();

interface DbConfig {
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    dialect: string;
    dialectOptions: {
        ssl: {
            require: boolean;
            rejectUnauthorized: boolean;
        };
    };
    logging: boolean;
}

const production: DbConfig = {
    username: process.env.DB_USER || 'tu_usuario',
    password: process.env.DB_PASSWORD || 'tu_contraseña',
    database: process.env.DB_NAME || 'nombre_de_tu_base_de_datos',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: false,
            rejectUnauthorized: false,
        },
    },
    logging: false,
};

export default {
    production,
};