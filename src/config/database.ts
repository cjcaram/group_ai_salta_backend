import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('group_ai_salta', 'root', 'admin123', {
  host: 'localhost',
  dialect: 'postgres',
});

export default sequelize;