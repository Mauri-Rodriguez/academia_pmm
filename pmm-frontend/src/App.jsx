import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Diagnostico from './pages/Diagnostico';
import ResultadoDiagnostico from './pages/ResultadoDiagnostico';
import DashboardEstudiante from './pages/DashboardEstudiante';
import ModuloEstudio from './pages/ModuloEstudio';
import PerfilEstudiante from './pages/PerfilEstudiante';
import LibroDeBingo from './pages/LibroDeBingo';
import Biblioteca from './pages/Biblioteca';
import HistorialErrores from './pages/HistorialErrores';
import ForoComunidad from './pages/ForoComunidad';
import NotFoundNinja from './components/NotFoundNinja';
import SolicitarRecuperacion from './pages/SolicitarRecuperacion';
import ResetPassword from './pages/ResetPassword';


// 🚩 IMPORTACIÓN FALTANTE: El nuevo componente de verificación
import VerificarCorreo from './pages/VerificarCorreo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-password" element={<SolicitarRecuperacion />} />
        {/* 🚩 RUTA DE ACTIVACIÓN (Debe ser pública para que entren desde el correo) */}
        <Route path="/verificar-correo/:token" element={<VerificarCorreo />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* RUTAS PRIVADAS DEL ESTUDIANTE */}
        <Route path="/estudiante/diagnostico" element={<Diagnostico />} />
        <Route path="/estudiante/resultado" element={<ResultadoDiagnostico />} />
        <Route path="/estudiante/historial-errores" element={<HistorialErrores />} />
        <Route path="/estudiante/dashboard" element={<DashboardEstudiante />} />
        <Route path="/estudiante/modulo/:id_modulo" element={<ModuloEstudio />} />
        <Route path="/estudiante/perfil" element={<PerfilEstudiante />} />
        <Route path="/estudiante/ranking" element={<LibroDeBingo />} />
        <Route path="/estudiante/biblioteca" element={<Biblioteca />} />
        <Route path="/estudiante/foro" element={<ForoComunidad />} />

        {/* REDIRECCIÓN DE SEGURIDAD: SIEMPRE AL FINAL */}
        <Route path="*" element={<NotFoundNinja />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;