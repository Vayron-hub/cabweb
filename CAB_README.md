# CAB Web - Sistema de Gestión de Residuos

## 📋 Descripción
Aplicación web desarrollada en Angular 20 con PrimeNG para la gestión y monitoreo de residuos ambientales. El sistema incluye autenticación, dashboards con gráficos y panel de administración.

## 🚀 Características Principales

### 🏠 Landing Page
- Página principal con tres cards principales:
  - **Zona Popular**: Estadísticas por zonas geográficas
  - **Basura Popular**: Clasificación de tipos de residuos
  - **Horario Popular**: Análisis de horarios de recolección
- Redirección inteligente: login si no está autenticado, dashboard si ya está logueado

### 🔐 Sistema de Autenticación
- Login con validación de formularios reactivos
- Usuarios de prueba:
  - **Admin**: `admin` / `123456`
  - **Usuarios**: `jose`, `maria`, `priv` / `123456`
- Persistencia de sesión con localStorage
- Guards para protección de rutas

### 📊 Dashboard de Usuario
- **Vista personalizada** según el tipo seleccionado (zona/basura/horario)
- **Gráficos interactivos** con Chart.js
- **Estadísticas en tiempo real**:
  - Tarjetas con métricas principales
  - Indicadores de tendencia
- **Actividades recientes** con timestamps
- **Diseño responsivo** con tema verde corporativo

### 👥 Panel de Administración
- **Lista completa de usuarios** con roles y estados
- **Clasificaciones de residuos** con contadores
- **Filtros y búsqueda** en tiempo real
- **Acciones por usuario**: ver, editar, suspender
- **Acceso restringido** solo para administradores

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular 20.1.x** - Framework principal
- **PrimeNG 20.0.0** - Componentes UI
- **PrimeIcons** - Iconografía
- **Chart.js** - Gráficos y visualizaciones
- **TypeScript** - Lenguaje de programación
- **CSS3** - Estilos con Flexbox/Grid

## 👤 Usuarios de Prueba

| Usuario | Contraseña | Rol | Acceso |
|---------|------------|-----|---------|
| admin | 123456 | Administrador | Todas las secciones |
| jose | 123456 | Usuario | Dashboard personal |
| maria | 123456 | Usuario | Dashboard personal |
| priv | 123456 | Usuario | Dashboard personal |

## 🗺️ Flujo de Navegación

1. **Inicio** (`/`) → Landing page con 3 cards
2. **Login** (`/login`) → Si no está autenticado
3. **Dashboard** (`/dashboard`) → Vista principal del usuario
4. **Admin** (`/admin`) → Solo para administradores

## 🔧 Instalación y Uso

### Pasos de instalación
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm start

# 3. Abrir navegador
http://localhost:4200
```

---

**Desarrollado para CAB - Gestión Ambiental**
