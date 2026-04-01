import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Diagnostico from './pages/Diagnostico';
import ResultadoDiagnostico from './pages/ResultadoDiagnostico'; // 🚩 1. IMPORTAR RESULTADO
import DashboardEstudiante from './pages/DashboardEstudiante';
import ModuloEstudio from './pages/ModuloEstudio';
import PerfilEstudiante from './pages/PerfilEstudiante';
import LibroDeBingo from './pages/LibroDeBingo';
import Biblioteca from './pages/Biblioteca';
import HistorialErrores from './pages/HistorialErrores';
import ForoComunidad from './pages/ForoComunidad'; // 🚩 NUEVA IMPORTACIÓN
import NotFoundNinja from './components/NotFoundNinja'; // 👈 Importa el componente
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* RUTAS PRIVADAS DEL ESTUDIANTE */}
        <Route path="/estudiante/diagnostico" element={<Diagnostico />} />

        {/* 🚩 2. RUTA DE REVELACIÓN DE RANGO (Sección 4.10.3 de la Tesis) */}
        <Route path="/estudiante/resultado" element={<ResultadoDiagnostico />} />
        <Route path="/estudiante/historial-errores" element={<HistorialErrores />} />
        <Route path="/estudiante/dashboard" element={<DashboardEstudiante />} />
        <Route path="/estudiante/modulo/:id_modulo" element={<ModuloEstudio />} />
        <Route path="/estudiante/perfil" element={<PerfilEstudiante />} />
        <Route path="/estudiante/ranking" element={<LibroDeBingo />} />
        <Route path="/estudiante/biblioteca" element={<Biblioteca />} />
        {/* 🚩 RUTA DEL FORO DE COMUNIDAD */}
        <Route path="/estudiante/foro" element={<ForoComunidad />} />

        {/* REDIRECCIÓN DE SEGURIDAD: SIEMPRE AL FINAL */}
        <Route path="*" element={<NotFoundNinja />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;