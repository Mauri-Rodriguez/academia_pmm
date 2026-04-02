const request = require('supertest');
const app = require('../src/server'); 
const sequelize = require('../src/config/database'); // 👈 IMPORTAMOS LA CONEXIÓN A LA BD

// 🚩 ANTES DE LAS PRUEBAS: Obligamos a Sequelize a crear las tablas vacías
beforeAll(async () => {
  await sequelize.sync({ force: true }); 
});

// 🚩 DESPUÉS DE LAS PRUEBAS: Cerramos la conexión para que GitHub no se quede congelado
afterAll(async () => {
  await sequelize.close();
});

describe('Pruebas de Autenticación', () => {
  it('Debería denegar el acceso con credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'fake@academia.edu',
        password: 'wrongpassword'
      });
      
    expect(res.statusCode).toEqual(404); // Ahora sí dará 404 porque la tabla ya existe
  });
});