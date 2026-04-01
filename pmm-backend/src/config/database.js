const { Sequelize } = require('sequelize');
require('dotenv').config();

// Inicializamos Sequelize con las variables de entorno
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false, // Ponlo en 'console.log' si quieres ver el SQL crudo que se ejecuta
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Función para probar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos MySQL (pmm_interactivo) establecida con éxito.');
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
    }
};

testConnection();

module.exports = sequelize;