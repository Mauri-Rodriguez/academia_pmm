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
import DashboardDocente from './pages/DashboardDocente';
import ReporteDetalladoEstudiante from './pages/ReporteDetalladoEstudiante';
import VerificarCorreo from './pages/VerificarCorreo';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 RUTAS PÚBLICAS (Cualquiera entra) */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/verificar-correo/:token" element={<VerificarCorreo />} />
        <Route path="/recuperar-password" element={<SolicitarRecuperacion />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* 🛡️ RUTAS PROTEGIDAS: SOLO ESTUDIANTES */}
        <Route element={<ProtectedRoute allowedRoles={['estudiante']} />}>
            <Route path="/estudiante/diagnostico" element={<Diagnostico />} />
            <Route path="/estudiante/resultado" element={<ResultadoDiagnostico />} />
            <Route path="/estudiante/dashboard" element={<DashboardEstudiante />} />
            <Route path="/estudiante/modulo/:id_modulo" element={<ModuloEstudio />} />
            <Route path="/estudiante/perfil" element={<PerfilEstudiante />} />
            <Route path="/estudiante/ranking" element={<LibroDeBingo />} />
            <Route path="/estudiante/biblioteca" element={<Biblioteca />} />
            <Route path="/estudiante/foro" element={<ForoComunidad />} />
            <Route path="/estudiante/historial-errores" element={<HistorialErrores />} />
        </Route>

        {/* 🛡️ RUTAS PROTEGIDAS: SOLO DOCENTES */}
        <Route element={<ProtectedRoute allowedRoles={['docente']} />}>
            <Route path="/docente/dashboard" element={<DashboardDocente />} />
            <Route path="/docente/reporte-estudiante/:id" element={<ReporteDetalladoEstudiante />} />
        </Route>

        {/* 🚫 RUTA NOT FOUND */}
        <Route path="*" element={<NotFoundNinja />} />
      </Routes>
    </BrowserRouter>
  );
}