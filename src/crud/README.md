# Servicios CRUD para DetKIWI Frontend

Esta carpeta contiene todos los servicios para realizar llamadas a las APIs del backend de DetKIWI. Cada archivo corresponde a un blueprint del backend y maneja las operaciones CRUD correspondientes.

## Estructura de Archivos

- **config.ts**: Configuración de URLs y entornos (local/producción)
- **auth.ts**: Servicio de autenticación (login, registro, manejo de tokens)
- **users.ts**: Operaciones CRUD para usuarios
- **estudiante.ts**: Operaciones CRUD para estudiantes
- **paralelos.ts**: Operaciones CRUD para paralelos
- **roles.ts**: Operaciones CRUD para roles
- **sedes.ts**: Operaciones CRUD para sedes
- **reporte.ts**: Operaciones para reportes (incluyendo upload de archivos)
- **index.ts**: Exporta todos los servicios de manera organizada

## Configuración

### Cambiar entre Entornos

```typescript
import { setEnvironment, switchToProduction, switchToLocal } from './crud';

// Cambiar a producción
switchToProduction();

// Cambiar a desarrollo local
switchToLocal();

// O directamente
setEnvironment('production'); // o 'local'
```

### Configurar URLs

Editar el archivo `config.ts` para cambiar las URLs:

```typescript
const environments = {
  local: 'http://localhost:5000',
  production: 'https://tu-api-de-produccion.com'
};
```

## Uso de los Servicios

### Importación

```typescript
// Importar servicios individuales
import { authService, usersService, estudianteService } from './crud';

// O importar el objeto completo
import services from './crud';
```

### Autenticación

```typescript
import { authService } from './crud';

// Login
try {
  const response = await authService.login({
    email: 'usuario@example.com',
    password: 'contraseña'
  });
  console.log('Login exitoso:', response.data);
} catch (error) {
  console.error('Error en login:', error.message);
}

// Verificar si está autenticado
if (authService.isAuthenticated()) {
  console.log('Usuario autenticado');
}

// Logout
authService.logout();
```

### Operaciones CRUD

#### Usuarios
```typescript
import { usersService } from './crud';

// Obtener todos los usuarios
const users = await usersService.getAllUsers();

// Obtener usuario por ID
const user = await usersService.getUserById(1);

// Crear usuario
const newUser = await usersService.createUser({
  username: 'nuevo_usuario',
  email: 'nuevo@example.com',
  password: 'contraseña'
});
```

#### Estudiantes
```typescript
import { estudianteService } from './crud';

// Obtener todos los estudiantes
const estudiantes = await estudianteService.getAllEstudiantes();

// Crear estudiante
const newEstudiante = await estudianteService.createEstudiante({
  nombre: 'Juan',
  apellido: 'Pérez'
});
```

#### Reportes (con Upload de Archivos)
```typescript
import { reporteService } from './crud';

// Upload de archivo
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  try {
    const response = await reporteService.uploadReporte({
      file: file,
      titulo: 'Mi Reporte MOSS'
    });
    console.log('Reporte subido:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Obtener mis reportes
const misReportes = await reporteService.getMyReportes();
```

## Manejo de Errores

Todos los servicios lanzan errores con la siguiente estructura:

```typescript
try {
  const result = await someService.someMethod();
} catch (error) {
  console.error('Status:', error.status);
  console.error('Message:', error.message);
}
```

## Tipos TypeScript

Todos los servicios incluyen tipos TypeScript completos:

```typescript
import type { User, CreateUserData } from './crud';

const userData: CreateUserData = {
  username: 'ejemplo',
  email: 'ejemplo@test.com',
  password: 'password123'
};
```

## Autenticación Automática

Los servicios manejan automáticamente:
- Guardado/recuperación de tokens JWT
- Inclusión de headers de autorización
- Limpieza de tokens al hacer logout

Los tokens se guardan en `localStorage` con las keys:
- `access_token`: Token de acceso
- `refresh_token`: Token de renovación

## Ejemplo Completo en un Componente React

```typescript
import React, { useEffect, useState } from 'react';
import { authService, usersService, type User } from '../crud';

const UsuariosComponent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (authService.isAuthenticated()) {
          const response = await usersService.getAllUsers();
          setUsers(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching users:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Usuarios</h1>
      {users.map(user => (
        <div key={user.user_id}>
          <p>{user.username} - {user.email}</p>
        </div>
      ))}
    </div>
  );
};

export default UsuariosComponent;
```