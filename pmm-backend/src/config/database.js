const { Sequelize } = require('sequelize');
require('dotenv').config();

// Inicializamos Sequelize con las variables de entorno y el "Fix" de Zona Horaria
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false, 
    }
);

// Función para probar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos MySQL establecida con éxito.');
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
};

testConnection();

module.exports = sequelize;a