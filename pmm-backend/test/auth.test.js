const request = require('supertest');
const app = require('../src/server'); // Asegúrate de exportar 'app' en tu server.js

describe('Pruebas de Autenticación', () => {
  it('Debería denegar el acceso con credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'fake@academia.edu',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toEqual(404); // O el código que definimos para error
  });
});