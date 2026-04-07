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
        
        // CONFIGURACIÓN DE ZONA HORARIA (Colombia UTC-5)
        // Esto evita que los tokens expiren antes de tiempo y que los logs digan "Hace 1 día"
        timezone: '-05:00', 
        dialectOptions: {
            dateStrings: true,
            typeCast: true,
            timezone: '-05:00', // Sincroniza la sesión de MySQL con la app
        },

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
        console.log('✅ Conexión a la base de datos MySQL establecida con éxito.');
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
};

testConnection();

module.exports = sequelize;