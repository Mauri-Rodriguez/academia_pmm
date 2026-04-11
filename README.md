# 🥷 Academia PMM (PMM Interactivo)

> **Plataforma web educativa orientada al aprendizaje de matemáticas, impulsada por Inteligencia Artificial y diseñada con un robusto sistema de gamificación temático.**

![Estado](https://img.shields.io/badge/build-passing-brightgreen)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)
![Versi%C3%B3n](https://img.shields.io/badge/Versi%C3%B3n-1.0.0-orange)

---

##  Descripción General

**Academia PMM** transforma el aprendizaje de las matemáticas en una aventura épica. A través de una temática "Ninja", los estudiantes realizan un examen de diagnóstico impulsado por IA para determinar su rango inicial, completan misiones (módulos), obtienen insignias y consultan al "Oráculo" (Tutor IA de Google Gemini) cuando tienen dudas.

El sistema cuenta con un panel analítico avanzado para **Docentes**, permitiéndoles detectar los puntos débiles de la clase y descargar reportes de rendimiento detallados.

##  Características Principales

###  Gamificación 
- **Rangos Dinámicos:** Genin, Chunin, Jonin y Kage.
- **Misiones y Sellos:** Progresión por módulos protegida por un sistema de "Piso de Cristal".
- **Rachas de Constancia:** Recompensas por días consecutivos de estudio y control de zona horaria (UTC-5).
- **Convalidación Automática:** Los estudiantes avanzados reciben medallas retroactivas según su diagnóstico.

###  Integración con Inteligencia Artificial
- **El Oráculo (Tutor Socrático):** Integración con `gemini-2.5-flash-lite`. Responde dudas guiando al estudiante sin darle la respuesta directa.
- **Feedback Instantáneo:** Generación automática de explicaciones cuando un estudiante se equivoca.
- **Microservicio Flask:** Algoritmo predictivo de asignación de rangos según el examen diagnóstico.

###  Analítica para Docentes
- Dashboard de monitoreo del rendimiento general.
- Detección de **puntos débiles** grupales e individuales.
- Exportación de reportes a archivos Excel (`.xlsx`) generados dinámicamente.

###  Seguridad y Autenticación
- Autenticación híbrida: JWT clásico + **Google OAuth2**.
- Asignación de roles automática (Estudiante/Docente) basada en el dominio del correo.
- Recuperación de contraseñas con flujos seguros y anti-enumeración (OWASP).

---

##  Arquitectura Tecnológica

### Backend (API REST)
- **Entorno:** Node.js + Express
- **Base de Datos:** MySQL
- **ORM:** Sequelize
- **Subida de Archivos:** Multer
- **Notificaciones de Email:** Resend API
- **Generación de Reportes:** ExcelJS

### Frontend (SPA)
- **Librería:** React.js
- **Enrutamiento:** React Router DOM (con protección de rutas por roles)
- **Estilos:** CSS Modules / Tailwind (según implementación)

### Microservicios y APIs
- **Clasificador IA:** Python (Flask)
- **IA Generativa:** Google Generative AI (Gemini)

---

## Guía de Instalación y Despliegue

### 1. Prerrequisitos
Asegúrate de tener instalados:
- Node.js (v18 o superior)
- MySQL (v8.0 o superior)
- Python (v3.9 o superior) *Para el microservicio Flask*

### 2. Clonar el repositorio
```bash
git clone https://github.com/Mauri-Rodriguez/academia_pmm
cd academia_pmm
```

### 3. Configuración de la Base de Datos
Crea una base de datos en MySQL llamada `pmm_interactivo`:
```sql
CREATE DATABASE pmm_interactivo;
```
*Nota: Las tablas se crearán automáticamente gracias a la sincronización de Sequelize o mediante el archivo de volcado SQL incluido.*

### 4. Variables de Entorno (`.env`)
Crea un archivo `.env` en la carpeta `pmm-backend` utilizando el siguiente esquema:

```env
# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Base de Datos MySQL
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=pmm_interactivo
DB_DIALECT=mysql

# Seguridad
JWT_SECRET=tu_secreto_super_seguro

# Integraciones de IA
GEMINI_API_KEY=tu_api_key_de_google_gemini
IA_SERVICE_URL=http://127.0.0.1:5000

# Google OAuth y Correos
GOOGLE_CLIENT_ID=tu_cliente_id_de_google
RESEND_API_KEY=tu_api_key_de_resend
DOMINIOS_DOCENTES=tudominio.edu.co,profesores.com
```

### 5. Instalación de Dependencias
**Para el Backend:**
```bash
cd pmm-backend
npm install
```

**Para el Frontend:**
```bash
cd ../pmm-frontend
npm install
```

**Para el Microservicio IA (Python):**
```bash
cd ../pmm-ia-service
pip install -r requirements.txt
```

### 6. Ejecución del Proyecto
Necesitarás 3 terminales abiertas:

**Terminal 1 (Microservicio IA - Flask):**
```bash
cd pmm-ia-service
python app.py
```

**Terminal 2 (Backend - Express):**
```bash
cd pmm-backend
npm run dev
```

**Terminal 3 (Frontend - React):**
```bash
cd pmm-frontend
npm run dev
```

¡Listo! La Academia PMM estará disponible en `http://localhost:5173`.

---

**Desarrollado con ❤️ para transformar el aprendizaje de las matemáticas.**