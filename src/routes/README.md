# Sistema de Autenticación y Rutas - DetKIWI Frontend

Se ha configurado un sistema completo de autenticación y manejo de rutas para la aplicación.

## Archivos Creados/Modificados

### 1. Sistema CRUD
- **[crud/auth.ts](../crud/auth.ts)** - Servicio de autenticación completo
- **[crud/config.ts](../crud/config.ts)** - Configuración de URLs de API

### 2. Sistema de Rutas
- **[src/routes/AppRouter.tsx](AppRouter.tsx)** - Router principal con rutas protegidas
- **[src/routes/routes.ts](routes.ts)** - Configuración de rutas y navegación
- **[src/routes/index.ts](index.ts)** - Exportaciones organizadas

### 3. Componentes Actualizados
- **[src/views/WebPage/Login.tsx](../views/WebPage/Login.tsx)** - Integrado con servicio de auth
- **[src/App.tsx](../App.tsx)** - Configurado para usar el sistema de rutas

## Uso del Sistema de Autenticación

### Login en Componentes

```typescript
import authService from '../../crud/auth';
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await authService.login({
        email: 'user@example.com',
        password: 'password123'
      });
      
      if (response.data.access_token) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error.message);
    }
  };

  return (
    <button onClick={handleLogin}>
      Iniciar Sesión
    </button>
  );
};
```

### Verificar Autenticación

```typescript
import authService from '../../crud/auth';

// Verificar si está autenticado
const isLoggedIn = authService.isAuthenticated();

// Obtener usuario actual
const currentUser = authService.getCurrentUser();

// Logout
const handleLogout = () => {
  authService.logout();
  navigate('/login');
};
```

## Sistema de Rutas

### Rutas Disponibles

- **Públicas** (solo accesibles sin autenticación):
  - `/` - Redirige a login
  - `/login` - Página de inicio de sesión

- **Protegidas** (requieren autenticación):
  - `/dashboard` - Panel principal
  - `/users` - Gestión de usuarios
  - `/estudiantes` - Gestión de estudiantes
  - `/paralelos` - Gestión de paralelos
  - `/roles` - Gestión de roles
  - `/sedes` - Gestión de sedes  
  - `/reportes` - Gestión de reportes

### Uso de Rutas en Componentes

```typescript
import { ROUTES, useNavigate } from '../routes';

const MyComponent = () => {
  const navigate = useNavigate();

  const goToUsers = () => {
    navigate(ROUTES.USERS);
  };

  const goToUserDetail = (userId: number) => {
    navigate(ROUTES.USER_DETAIL(userId));
  };

  return (
    <div>
      <button onClick={goToUsers}>Ver Usuarios</button>
      <button onClick={() => goToUserDetail(123)}>Ver Usuario #123</button>
    </div>
  );
};
```

### Crear Rutas Protegidas

```typescript
import { ProtectedRoute } from '../routes';

const MyProtectedComponent = () => {
  return (
    <ProtectedRoute>
      <div>Este contenido solo es visible para usuarios autenticados</div>
    </ProtectedRoute>
  );
};
```

## Configuración de API

### Cambiar Entorno (Desarrollo/Producción)

Editar [crud/config.ts](../crud/config.ts):

```typescript
const config = {
  environment: 'local', // Cambiar a 'production' para producción
  baseURL: 'http://localhost:5000'
};

const environments = {
  local: 'http://localhost:5000',
  production: 'https://tu-api-de-produccion.com' // Actualizar URL
};
```

O usar las funciones helper:

```typescript
import { switchToProduction, switchToLocal } from '../crud';

// Cambiar a producción
switchToProduction();

// Cambiar a desarrollo
switchToLocal();
```

## Navegación Programática

```typescript
import { useNavigate, ROUTES } from '../routes';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const handleLogout = () => {
    authService.logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div>
      <button onClick={handleLoginSuccess}>Ir al Dashboard</button>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
};
```

## Estados de Autenticación

El sistema maneja automáticamente:
- **Tokens JWT**: Se guardan en localStorage
- **Redirecciones**: Usuario no autenticado va a login
- **Protección de rutas**: Rutas privadas requieren login
- **Limpieza de sesión**: Logout limpia todos los datos

## Próximos Pasos

1. Implementar componentes para cada ruta protegida
2. Crear un Header/Navbar con navegación
3. Añadir guards de roles específicos
4. Implementar refresh token automation
5. Añadir interceptores de axios para manejo global de errores

## Dependencias Instaladas

```bash
npm install react-router-dom
npm install --save-dev @types/react-router-dom
```

Ya están instaladas axios y sus tipos.

## Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación iniciará con el sistema de rutas funcionando. Ve a `/login` para probar la autenticación.