# 📋 Documentación de Implementación - Dashboard Jerárquico y Actualización de CRUDs

## 📅 Fecha de Implementación
Marzo 9, 2026

---

## 🎯 Resumen de Cambios

Se implementó un sistema completo de dashboard jerárquico para visualizar estadísticas de casos de plagio por sedes y paralelos, junto con la actualización de todos los servicios CRUD para alinearse con los nuevos endpoints del backend.

### Cambios Principales:
1. ✅ Actualización de 4 servicios CRUD (casos, evaluaciones, reporte, sedes)
2. ✅ Creación de componente `DashboardGridView` reutilizable
3. ✅ Implementación de Dashboard jerárquico con navegación multinivel
4. ✅ Estilos modernos con animaciones y diseño responsive
5. ✅ Integración completa con el sistema de rutas

---

## 📦 1. Actualización de Servicios CRUD

### 1.1 `casos.ts` - Servicio de Casos

#### Interfaces Actualizadas:
```typescript
interface Caso {
  caso_id: number;
  reporte_id?: number;
  similitud: number;
  lineas: number | null;
  url_moss: string | null;
  closed: boolean;          // ✨ NUEVO: Reemplaza 'estado'
  sancion?: string | null;  // ✨ NUEVO
  caso_metadata?: any;      // ✨ NUEVO
  estudiantes?: EstudianteCaso[];
  usuarios_asignados?: UsuarioAsignado[];
}
```

#### Nuevos Métodos Implementados:

**1. `updateEstadoCaso(casoId, closed, sancion?)`**
- **Cambio:** Ahora usa boolean `closed` en lugar de string `estado`
- **Antes:** `estado: 'Pendiente' | 'Revisado' | 'Confirmado' | 'Descartado'`
- **Ahora:** `closed: boolean` + `sancion?: string`
- **Endpoint:** `PUT /casos/estado/{caso_id}`

**2. `getMisCasosByEvaluacionId(evaluacionId)`**
- **Descripción:** Obtiene casos asignados al usuario actual filtrados por evaluación
- **Endpoint:** `GET /casos/GetMisCasosByEvaluacionId/{evaluacion_id}`
- **Retorna:** `{ total_casos: number, casos: Caso[] }`

**3. `getCasosBySedeIdAndEvaluacionId(sedeId, evaluacionId)`**
- **Descripción:** Obtiene todos los casos de una sede específica y evaluación
- **Endpoint:** `GET /casos/GetCasosBySedeIdAndEvaluacionId/{sede_id}/{evaluacion_id}`
- **Uso:** Para listar casos en vistas filtradas por sede

**4. `getCasosByParaleloIdAndEvaluacionId(paraleloId, evaluacionId)`**
- **Descripción:** Obtiene casos de un paralelo específico
- **Endpoint:** `GET /casos/GetCasosByParaleloIdAndEvaluacionId/{paralelo_id}/{evaluacion_id}`
- **Uso:** Para tabla de casos de paralelo (implementación futura)

**5. `getStatsCasosBySedeIdAndEvaluacionId(sedeId, evaluacionId)` ⭐**
- **Descripción:** Obtiene estadísticas agregadas de una sede
- **Endpoint:** `GET /casos/GetStatsCasosBySedeIdAndEvaluacionId/{sede_id}/{evaluacion_id}`
- **Retorna:**
  ```typescript
  {
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
  }
  ```
- **Uso Principal:** Dashboard grid de sedes

**6. `getStatsCasosForParalelosByEvaluacionIdAndSedeId(evaluacionId, sedeId)` ⭐**
- **Descripción:** Obtiene estadísticas de todos los paralelos de una sede
- **Endpoint:** `GET /casos/GetStatsCasosForParalelosByEvaluacionIdAndSedeId/{evaluacion_id}/{sede_id}`
- **Retorna:** Array de estadísticas por paralelo:
  ```typescript
  [{
    paralelo: string;
    paralelo_id: number;
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
    usuarios_asignados: Array<{
      user_id: number;
      username: string;
      email: string;
    }>;
  }]
  ```
- **Uso Principal:** Dashboard grid de paralelos

**7. `actualizarMetadata(casoId, casoMetadata)`**
- **Descripción:** Actualiza el metadata JSON de un caso
- **Endpoint:** `PUT /casos/actualizar-metadata/{caso_id}`
- **Payload:** `{ caso_metadata: any }`

---

### 1.2 `evaluaciones.ts` - Servicio de Evaluaciones

#### Nuevos Métodos:

**1. `obtenerEstadisticas(evaluacionId)`**
- **Endpoint:** `GET /evaluaciones/estadisticas/{evaluacion_id}`
- **Retorna:**
  ```typescript
  {
    evaluacion_id: number;
    nombre: string;
    total_reportes: number;
    total_casos: number;
    estadisticas_casos: {
      cerrados: number;
      abiertos: number;
      con_sancion: number;
    };
    similitud_promedio: number;
    similitud_maxima: number;
    casos_criticos: number; // casos con similitud >= 90%
  }
  ```

**2. `obtenerCasosEvaluacion(evaluacionId, filtros?)`**
- **Endpoint:** `GET /evaluaciones/casos/{evaluacion_id}`
- **Filtros opcionales:**
  ```typescript
  {
    min_similitud?: number;
    max_similitud?: number;
    closed?: boolean;
  }
  ```
- **Uso:** Obtener casos de evaluación con filtrado avanzado

---

### 1.3 `reporte.ts` - Servicio de Reportes

#### Métodos Actualizados/Nuevos:

**1. `getMyReportes()` - Actualizado**
- **Cambio:** Ahora incluye información de evaluación
- **Retorna:**
  ```typescript
  [{
    reporte_id: number;
    titulo: string;
    fecha_creacion: string;
    total_casos: number;
    casos_abiertos: number;
    evaluacion?: {
      evaluacion_id: number;
      nombre: string;
    };
  }]
  ```

**2. `getCasosSimilitud(reporteId)` - Actualizado**
- **Estructura mejorada con más detalles:**
  ```typescript
  {
    reporte: {
      reporte_id: number;
      titulo: string;
      fecha_creacion: string;
    };
    casos: Array<{
      caso_id: number;
      similitud: number;
      lineas: number | null;
      url_moss: string | null;
      closed: boolean;
      sancion?: string | null;
      caso_metadata?: any;
      estudiantes: EstudianteData[];
    }>;
  }
  ```

**3. `getEstadisticasReporte(reporteId)` - Nuevo**
- **Endpoint:** `GET /reportes/estadisticas-reporte/{reporte_id}`
- **Retorna:**
  ```typescript
  {
    reporte_id: number;
    titulo: string;
    total_casos: number;
    estadisticas_casos: {
      cerrados: number;
      abiertos: number;
      con_sancion: number;
      sin_sancion: number;
    };
    estadisticas_similitud: {
      promedio: number;
      maxima: number;
      minima: number;
      por_rango: {
        '90-100%': number;
        '80-89%': number;
        '70-79%': number;
        '60-69%': number;
        '<60%': number;
      };
    };
  }
  ```

**4. `getCasosFiltrados(reporteId, minSimilitud)` - Nuevo**
- **Endpoint:** `GET /reportes/casos-filtrados-reporte/{reporte_id}`
- **Parámetro:** `min_similitud` (default: 0)

---

### 1.4 `sedes.ts` - Corrección de Endpoint

**Método Corregido: `getParalelosBySede(sedeId)`**
- **Antes:** `GET /sedes/GetParalelosBySede/{sede_id}`
- **Ahora:** `GET /sedes/GetEstudiantesBySede/{sede_id}` ✅
- **Razón:** Alineación con endpoint backend correcto

---

### 1.5 `index.ts` - Exportación de Servicios

**Actualización:**
```typescript
export const services = {
  auth: authService,
  users: usersService,
  estudiante: estudianteService,
  paralelos: paralelosService,
  roles: rolesService,
  sedes: sedesService,
  reporte: reporteService,
  admin: adminService,
  casos: casosService,
  evaluaciones: evaluacionesService,  // ✨ AGREGADO
  periodos: periodosService            // ✨ AGREGADO
};
```

---

## 🎨 2. Componente DashboardGridView

### Ubicación:
```
src/views/WebPage/Dashboard/components/
├── DashboardGridView.tsx
└── DashboardGridView.scss
```

### 2.1 Descripción

Componente reutilizable que muestra un grid de cards con estadísticas, capaz de renderizar tanto sedes como paralelos con sus respectivas métricas.

### 2.2 Props Interface

```typescript
interface DashboardGridViewProps {
  type: 'sedes' | 'paralelos';              // Tipo de entidades a mostrar
  evaluacionId: number;                      // ID de evaluación actual
  sedeId?: number;                           // Requerido cuando type='paralelos'
  onSedeClick?: (sede: SedeCardData) => void;      // Callback al click en sede
  onParaleloClick?: (paralelo: ParaleloCardData) => void; // Callback al click en paralelo
}
```

### 2.3 Interfaces de Datos

**SedeCardData:**
```typescript
interface SedeCardData {
  sede_id: number;
  nombre: string;
  total_casos: number;
  total_casos_pendientes: number;
  total_casos_resueltos: number;
}
```

**ParaleloCardData:**
```typescript
interface ParaleloCardData {
  paralelo: string;
  paralelo_id: number;
  total_casos: number;
  total_casos_pendientes: number;
  total_casos_resueltos: number;
  usuarios_asignados: Array<{
    user_id: number;
    username: string;
    email: string;
  }>;
}
```

### 2.4 Características Principales

#### ✨ Carga de Datos Inteligente

**Modo 'sedes':**
1. Obtiene lista de todas las sedes
2. Para cada sede, hace una petición paralela de estadísticas
3. Maneja errores gracefully (sedes sin datos muestran ceros)
4. Usa `Promise.all()` para optimizar rendimiento

```typescript
// Ejemplo de carga optimizada
const sedesWithStats = await Promise.all(
  sedesResponse.data.map(async (sede) => {
    try {
      const statsResponse = await services.casos.getStatsCasosBySedeIdAndEvaluacionId(
        sede.sede_id,
        evaluacionId
      );
      return { ...sede, ...statsResponse.data };
    } catch (error) {
      return { ...sede, total_casos: 0, ... };
    }
  })
);
```

**Modo 'paralelos':**
- Usa endpoint optimizado que trae todos los paralelos con stats en una sola petición
- `GetStatsCasosForParalelosByEvaluacionIdAndSedeId`

#### 🎯 Cálculo de Porcentajes

```typescript
const calculatePercentage = (resolved: number, total: number): string => {
  if (total === 0) return '0';
  return ((resolved / total) * 100).toFixed(1);
};
```

#### 🎨 Renderizado de Cards

**Card de Sede:**
- Badge con tipo "Sede"
- Estadísticas: Total, Pendientes, Resueltos, % Resolución
- Hover effects con elevación
- Gradient border en hover

**Card de Paralelo:**
- Badge con tipo "Paralelo"
- Estadísticas completas
- **Usuarios asignados** como badges con tooltip (email)
- Colores distintivos

### 2.5 Estilos (DashboardGridView.scss)

#### Grid Responsivo
```scss
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  
  // Tablet
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  // Mobile
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

#### Animaciones
- **Hover:** Elevación con `transform: translateY(-6px)`
- **Gradient border:** Aparece desde arriba con `transform: scaleX(0)` → `scaleX(1)`
- **Click:** Feedback táctil con `translateY(-2px)`
- **Spinner:** Rotación continua 360°

#### Estados Visuales
```scss
.stat-value {
  &.pending {
    color: #e74c3c;
    background: rgba(231, 76, 60, 0.1);
  }
  
  &.resolved {
    color: #27ae60;
    background: rgba(39, 174, 96, 0.1);
  }
}
```

### 2.6 Ejemplo de Uso

```typescript
// Vista de sedes
<DashboardGridView
  type="sedes"
  evaluacionId={5}
  onSedeClick={(sede) => {
    console.log(`Sede seleccionada: ${sede.nombre}`);
    navigateToParalelos(sede.sede_id);
  }}
/>

// Vista de paralelos
<DashboardGridView
  type="paralelos"
  evaluacionId={5}
  sedeId={2}
  onParaleloClick={(paralelo) => {
    console.log(`Paralelo seleccionado: ${paralelo.paralelo}`);
    navigateToCasosTable(paralelo.paralelo_id);
  }}
/>
```

---

## 🏗️ 3. Dashboard Principal

### Ubicación:
```
src/views/WebPage/Dashboard/
├── Dashboard.tsx
└── Dashboard.scss
```

### 3.1 Arquitectura de Navegación Jerárquica

```
┌─────────────────────────────────────────────────────────┐
│                    NIVEL 1: SEDES                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Sede 1  │  │  Sede 2  │  │  Sede 3  │   ...       │
│  │  Stats   │  │  Stats   │  │  Stats   │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │ click       │              │                    │
└───────┼─────────────┼──────────────┼────────────────────┘
        │             │              │
        ▼             ▼              ▼
┌─────────────────────────────────────────────────────────┐
│              NIVEL 2: PARALELOS DE SEDE X               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Paralelo │  │ Paralelo │  │ Paralelo │   ...       │
│  │   200    │  │   201    │  │   202    │             │
│  │ + Users  │  │ + Users  │  │ + Users  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │ click       │              │                    │
└───────┼─────────────┼──────────────┼────────────────────┘
        │             │              │
        ▼             ▼              ▼
┌─────────────────────────────────────────────────────────┐
│         NIVEL 3: TABLA DE CASOS (Pendiente)             │
│  ┌───────────────────────────────────────────────┐     │
│  │ Tabla con casos del paralelo seleccionado     │     │
│  │ (Implementación futura)                       │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Estado del Dashboard

```typescript
interface DashboardState {
  currentLevel: 'sedes' | 'paralelos' | 'casos';
  selectedSedeId: number | null;
  selectedSedeName: string;
  selectedParaleloName: string;
  selectedEvaluacionId: number;
  evaluaciones: Evaluacion[];
  breadcrumbs: BreadcrumbItem[];
}
```

### 3.3 Flujo de Navegación

#### 3.3.1 Inicio (Nivel Sedes)
```typescript
// Estado inicial
currentLevel: 'sedes'
breadcrumbs: [{ label: 'Sedes', level: 'sedes' }]

// Renderiza
<DashboardGridView type="sedes" evaluacionId={X} onSedeClick={...} />
```

#### 3.3.2 Click en Sede → Nivel Paralelos
```typescript
const handleSedeClick = (sede: SedeCardData) => {
  setSelectedSedeId(sede.sede_id);
  setSelectedSedeName(sede.nombre);
  setCurrentLevel('paralelos');
  setBreadcrumbs([
    { label: 'Sedes', level: 'sedes' },
    { label: sede.nombre, level: 'paralelos', sedeId: sede.sede_id }
  ]);
};

// Renderiza
<DashboardGridView 
  type="paralelos" 
  evaluacionId={X} 
  sedeId={selectedSedeId}
  onParaleloClick={...} 
/>
```

#### 3.3.3 Click en Paralelo → Nivel Casos (Placeholder)
```typescript
const handleParaleloClick = (paralelo: ParaleloCardData) => {
  setSelectedParaleloName(paralelo.paralelo);
  setCurrentLevel('casos');
  
  // Notificación temporal
  toast.info(
    `Navegando a la tabla de casos del paralelo ${paralelo.paralelo}. 
     Vista de tabla pendiente de implementación.`,
    { autoClose: 3000 }
  );
  
  // TODO: Cuando implementes la tabla
  // navigate(`/dashboard/casos?sede=${sedeId}&paralelo=${paraleloId}&evaluacion=${evaluacionId}`);
};
```

### 3.4 Sistema de Breadcrumbs

#### Interface
```typescript
interface BreadcrumbItem {
  label: string;
  level: DashboardLevel;
  sedeId?: number;
  paraleloId?: number;
}
```

#### Funcionalidad
```typescript
const handleBreadcrumbClick = (item: BreadcrumbItem) => {
  if (item.level === 'sedes') {
    // Volver a vista de sedes
    setCurrentLevel('sedes');
    resetSelections();
    setBreadcrumbs([{ label: 'Sedes', level: 'sedes' }]);
  } else if (item.level === 'paralelos') {
    // Volver a paralelos de esa sede
    setCurrentLevel('paralelos');
    setSelectedSedeId(item.sedeId!);
    resetParaleloSelection();
    setBreadcrumbs([
      { label: 'Sedes', level: 'sedes' },
      { label: item.label, level: 'paralelos', sedeId: item.sedeId }
    ]);
  }
};
```

#### Renderizado
```tsx
<div className="breadcrumbs">
  {breadcrumbs.map((item, index) => (
    <React.Fragment key={index}>
      <span 
        className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
        onClick={() => index !== breadcrumbs.length - 1 && handleBreadcrumbClick(item)}
      >
        {item.label}
      </span>
      {index < breadcrumbs.length - 1 && <span className="breadcrumb-separator">/</span>}
    </React.Fragment>
  ))}
</div>
```

### 3.5 Selector de Evaluación

```tsx
<div className="evaluacion-selector">
  <label>Evaluación:</label>
  <select value={selectedEvaluacionId} onChange={handleEvaluacionChange}>
    {evaluaciones.map((evaluacion) => (
      <option key={evaluacion.evaluacion_id} value={evaluacion.evaluacion_id}>
        {evaluacion.nombre}
      </option>
    ))}
  </select>
</div>
```

**Comportamiento al cambiar evaluación:**
- Reset completo a nivel de sedes
- Limpia todas las selecciones
- Resetea breadcrumbs
- Recarga datos con nueva evaluación

### 3.6 Placeholder de Tabla de Casos

Vista temporal para el nivel 3 mientras se implementa la tabla:

```tsx
<div className="casos-placeholder">
  <div className="placeholder-content">
    <h2>📋 Vista de Tabla de Casos</h2>
    <p>Esta sección mostrará la tabla de casos del paralelo seleccionado.</p>
    <div className="placeholder-info">
      <p><strong>Sede:</strong> {selectedSedeName}</p>
      <p><strong>Paralelo:</strong> {selectedParaleloName}</p>
      <p><strong>Evaluación ID:</strong> {selectedEvaluacionId}</p>
    </div>
    <button onClick={() => volverAParalelos()}>
      Volver a Paralelos
    </button>
  </div>
</div>
```

### 3.7 Estilos del Dashboard (Dashboard.scss)

#### Layout Principal
```scss
.dashboard-container {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
```

#### Header con Gradiente
```scss
.header-content h1 {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### Selector de Evaluación con Hover Effect
```scss
.evaluacion-selector {
  background: #f8f9fa;
  padding: 12px 20px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3498db;
    background: white;
  }
}
```

#### Breadcrumbs Interactivos
```scss
.breadcrumb-item {
  color: #3498db;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover:not(.active) {
    background: #e3f2fd;
    color: #2980b9;
  }

  &.active {
    color: #2c3e50;
    background: #ecf0f1;
    cursor: default;
  }
}
```

---

## 🔌 4. Integración con el Sistema

### 4.1 Rutas (AppRouter.tsx)

**Cambio realizado:**
```typescript
// ANTES
{
  path: '/dashboard',
  element: (
    <ProtectedRoute>
      <ComingSoon title="Dashboard" />
    </ProtectedRoute>
  )
}

// DESPUÉS
import Dashboard from '../views/WebPage/Dashboard/Dashboard';

{
  path: '/dashboard',
  element: (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
```

### 4.2 Navegación desde Navbar

El dashboard es accesible desde:
- URL: `/dashboard`
- Navbar: Botón "Dashboard"
- Redirección automática después del login

---

## 📱 5. Responsive Design

### Breakpoints Implementados

```scss
// Desktop (default)
> 1200px: Grid de 3-4 columnas

// Tablet
768px - 1200px: Grid de 2-3 columnas

// Mobile
< 768px: Grid de 1 columna
```

### Adaptaciones por Dispositivo

#### Mobile (< 768px)
- Grid a 1 columna
- Font sizes reducidos
- Padding ajustado
- Selector de evaluación en modo columna
- Breadcrumbs más compactos

#### Tablet (768px - 1200px)
- Grid de 2-3 columnas según espacio
- Font sizes intermedios
- Espaciado optimizado

---

## 🎨 6. Sistema de Diseño

### Paleta de Colores

```scss
// Primarios
$primary-blue: #3498db;
$primary-purple: #667eea;
$primary-violet: #764ba2;

// Estados
$success-green: #27ae60;
$danger-red: #e74c3c;
$warning-orange: #f39c12;

// Neutros
$dark-text: #2c3e50;
$medium-text: #7f8c8d;
$light-bg: #ecf0f1;
$white: #ffffff;
```

### Gradientes

```scss
// Header principal
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Badge sede
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

// Badge paralelo
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

// Badge usuario
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Background container
background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
```

### Sombras

```scss
// Cards en reposo
box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

// Cards en hover
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

// Botones
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
```

### Animaciones

```scss
// Transiciones suaves
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// Elevación en hover
&:hover {
  transform: translateY(-6px);
}

// Feedback táctil
&:active {
  transform: translateY(-2px);
}
```

---

## 🚀 7. Guía de Uso

### 7.1 Iniciar la Aplicación

```bash
# Terminal 1: Backend
cd DetKIWI-BACKEND
python run.py

# Terminal 2: Frontend
cd DetKIWI-FRONTEND
npm run dev
```

### 7.2 Flujo de Usuario

1. **Login** → `/login`
2. **Redirección automática** → `/dashboard`
3. **Ver sedes** → Grid con todas las sedes y sus estadísticas
4. **Seleccionar evaluación** → Dropdown en header
5. **Click en sede** → Navega a paralelos de esa sede
6. **Breadcrumbs** → "Sedes / {Nombre Sede}"
7. **Click en paralelo** → Mensaje de implementación futura
8. **Volver atrás** → Click en breadcrumb "Sedes" o nombre de sede

### 7.3 Casos de Uso Principales

#### Caso 1: Visualizar estadísticas generales
```
Usuario → Dashboard → Ve todas las sedes con métricas
Puede identificar rápidamente qué sedes tienen más casos pendientes
```

#### Caso 2: Explorar sede específica
```
Usuario → Click en "Sede Campus Santiago" 
→ Ve todos los paralelos de esa sede
→ Observa usuarios asignados a cada paralelo
→ Identifica paralelos con mayor carga de trabajo
```

#### Caso 3: Cambiar de evaluación
```
Usuario → Selector de evaluación → Selecciona "Tarea 2"
→ Dashboard resetea a vista de sedes
→ Carga nuevas estadísticas para Tarea 2
```

#### Caso 4: Navegación con breadcrumbs
```
Usuario está en paralelos de Sede A
→ Click en breadcrumb "Sedes"
→ Vuelve a vista general de sedes
→ Puede explorar otra sede
```

---

## 🔮 8. Próximas Implementaciones Sugeridas

### 8.1 Tabla de Casos (Prioridad Alta)

**Ubicación sugerida:**
```
src/views/WebPage/Dashboard/components/
└── CasosTable.tsx
```

**Props recomendadas:**
```typescript
interface CasosTableProps {
  sedeId: number;
  paraleloId: number;
  evaluacionId: number;
  onCasoClick?: (caso: Caso) => void;
}
```

**Funcionalidades a incluir:**
- Lista paginada de casos
- Columnas: Estudiantes, Similitud, Estado, Acciones
- Filtros: Similitud mínima, Estado (cerrado/abierto)
- Ordenamiento por columnas
- Click en caso → Navegación a detalle
- Asignación masiva de usuarios
- Exportar a Excel

### 8.2 Modal de Detalle de Caso

```typescript
interface CasoDetailModalProps {
  casoId: number;
  onClose: () => void;
  onUpdate: () => void;
}
```

**Características:**
- Ver código similar (iframe de MOSS)
- Cambiar estado (cerrado/abierto)
- Asignar sanción
- Agregar notas en metadata
- Historial de cambios

### 8.3 Filtros Avanzados en Dashboard

- Rango de fechas
- Filtro por similitud mínima
- Solo casos pendientes / resueltos
- Buscar por nombre de sede/paralelo

### 8.4 Gráficos y Visualizaciones

```typescript
// Ejemplo con Chart.js
<LineChart 
  data={casosEvolution} 
  title="Evolución de Casos Resueltos"
/>

<PieChart
  data={casesBySimilarity}
  title="Distribución por Similitud"
/>
```

### 8.5 Exportación de Reportes

```typescript
// Botón en header del dashboard
<ExportButton
  onClick={async () => {
    const data = await services.reporte.exportToExcel(evaluacionId);
    downloadFile(data, 'estadisticas-casos.xlsx');
  }}
/>
```

### 8.6 Notificaciones en Tiempo Real

Integración con WebSockets para:
- Nuevos casos asignados
- Cambios de estado en casos
- Alertas de casos críticos (>90% similitud)

### 8.7 Dashboard Personalizado por Rol

```typescript
// Admin: Ve todas las sedes
// Coordinador: Ve solo sus sedes asignadas
// Profesor: Ve solo sus paralelos asignados

const getDashboardDataByRole = (user: User) => {
  switch (user.rol_id) {
    case 1: return getAllSedes();
    case 2: return getSedesByCoordinador(user.user_id);
    case 3: return getParalelosByProfesor(user.user_id);
  }
};
```

---

## 🧪 9. Testing Recomendado

### 9.1 Unit Tests

```typescript
// DashboardGridView.test.tsx
describe('DashboardGridView', () => {
  test('renders sedes correctly', async () => {
    render(<DashboardGridView type="sedes" evaluacionId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Sede Campus Santiago')).toBeInTheDocument();
    });
  });

  test('calculates percentage correctly', () => {
    const percentage = calculatePercentage(75, 100);
    expect(percentage).toBe('75.0');
  });

  test('handles sede click', () => {
    const mockClick = jest.fn();
    render(<DashboardGridView onSedeClick={mockClick} />);
    fireEvent.click(screen.getByText('Sede 1'));
    expect(mockClick).toHaveBeenCalledWith(expect.objectContaining({
      sede_id: 1
    }));
  });
});
```

### 9.2 Integration Tests

```typescript
// Dashboard.integration.test.tsx
describe('Dashboard Navigation Flow', () => {
  test('navigates from sedes to paralelos', async () => {
    render(<Dashboard />);
    
    // Inicial: debe mostrar sedes
    expect(screen.getByText('Dashboard de Casos')).toBeInTheDocument();
    
    // Click en sede
    fireEvent.click(screen.getByText('Sede Campus Santiago'));
    
    // Debe mostrar paralelos
    await waitFor(() => {
      expect(screen.getByText(/Paralelo/)).toBeInTheDocument();
    });
    
    // Breadcrumb debe actualizarse
    expect(screen.getByText('Sede Campus Santiago')).toHaveClass('active');
  });
});
```

### 9.3 E2E Tests (Cypress)

```javascript
// dashboard.cy.js
describe('Dashboard E2E', () => {
  beforeEach(() => {
    cy.login('admin@test.com', 'password');
    cy.visit('/dashboard');
  });

  it('should navigate through hierarchy', () => {
    // Ver sedes
    cy.contains('Sede Campus Santiago').should('be.visible');
    
    // Click en sede
    cy.contains('Sede Campus Santiago').click();
    
    // Ver paralelos
    cy.contains('Paralelo 200').should('be.visible');
    
    // Click en paralelo
    cy.contains('Paralelo 200').click();
    
    // Ver placeholder de casos
    cy.contains('Vista de Tabla de Casos').should('be.visible');
    
    // Volver con breadcrumb
    cy.contains('Sedes').click();
    cy.contains('Sede Campus Santiago').should('be.visible');
  });
});
```

---

## 📊 10. Optimizaciones de Performance

### 10.1 Implementadas

✅ **Carga paralela de estadísticas de sedes**
```typescript
await Promise.all(sedes.map(async (sede) => fetchStats(sede)));
```

✅ **Endpoint optimizado para paralelos**
- Una sola petición trae todos los paralelos con stats

✅ **React.Fragment para breadcrumbs**
- Evita nodos DOM innecesarios

✅ **useEffect con dependencias específicas**
```typescript
useEffect(() => {
  fetchData();
}, [type, evaluacionId, sedeId]); // Solo recarga cuando cambian
```

### 10.2 Sugerencias Futuras

**1. Implementar React Query / SWR**
```typescript
const { data, isLoading } = useQuery(
  ['sedes-stats', evaluacionId],
  () => fetchSedesStats(evaluacionId),
  { staleTime: 5 * 60 * 1000 } // Cache 5 minutos
);
```

**2. Virtualización para listas largas**
```typescript
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  rowCount={Math.ceil(sedes.length / 3)}
  {...otherProps}
>
  {SedeCard}
</FixedSizeGrid>
```

**3. Lazy loading de componentes**
```typescript
const CasosTable = lazy(() => import('./components/CasosTable'));

<Suspense fallback={<LoadingSpinner />}>
  <CasosTable {...props} />
</Suspense>
```

**4. Debounce en búsquedas/filtros**
```typescript
const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
);
```

**5. Memoización de cálculos costosos**
```typescript
const estadisticasAgregadas = useMemo(() => {
  return calcularEstadisticas(casos);
}, [casos]);
```

---

## 🐛 11. Troubleshooting

### Problema 1: No se cargan las sedes
**Síntoma:** Dashboard muestra "No hay sedes disponibles"

**Solución:**
1. Verificar que el backend esté corriendo
2. Revisar consola del navegador para errores de red
3. Verificar token de autenticación
4. Comprobar que existan sedes en la BD

```bash
# Verificar sedes en BD
curl http://localhost:5000/sedes/GetAllSedes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Problema 2: Estadísticas muestran ceros
**Síntoma:** Todas las métricas en 0 a pesar de haber casos

**Causas posibles:**
- No hay casos para esa evaluación específica
- Casos no están vinculados correctamente a sede/paralelo
- Error en el endpoint de estadísticas

**Solución:**
```bash
# Verificar endpoint
curl http://localhost:5000/casos/GetStatsCasosBySedeIdAndEvaluacionId/1/1
```

### Problema 3: Error de CORS
**Síntoma:** `Access-Control-Allow-Origin error`

**Solución en backend:**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

### Problema 4: Navegación no funciona
**Síntoma:** Click en cards no hace nada

**Verificar:**
1. Callbacks están definidos: `onSedeClick` / `onParaleloClick`
2. Estado se actualiza correctamente en `handleSedeClick`
3. No hay errores en consola

```typescript
// Debug
const handleSedeClick = (sede: SedeCardData) => {
  console.log('Sede clicked:', sede);
  console.log('Current state before:', { currentLevel, selectedSedeId });
  setSelectedSedeId(sede.sede_id);
  console.log('State should update...');
};
```

### Problema 5: Estilos no se aplican
**Síntoma:** Dashboard sin estilos o con apariencia rota

**Solución:**
1. Verificar que los archivos `.scss` existen en las rutas correctas
2. Comprobar imports en los componentes
3. Limpiar cache del navegador (Ctrl + Shift + R)
4. Reiniciar servidor Vite

```bash
# Limpiar y reiniciar
cd DetKIWI-FRONTEND
rm -rf node_modules/.vite
npm run dev
```

---

## 📝 12. Convenciones de Código

### Nomenclatura
- **Componentes:** PascalCase (`DashboardGridView`)
- **Funciones:** camelCase (`handleSedeClick`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_ITEMS_PER_PAGE`)
- **Interfaces:** PascalCase con sufijo descriptivo (`SedeCardData`)
- **Archivos:** Mismo nombre que componente principal

### Estructura de Archivos
```
ComponentName/
├── ComponentName.tsx      # Lógica principal
├── ComponentName.scss     # Estilos
├── ComponentName.test.tsx # Tests
└── index.ts              # Re-export
```

### Imports
```typescript
// 1. React y librerías externas
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Servicios y utils propios
import { services } from '../../../crud';
import { formatDate } from '../../../utils';

// 3. Componentes propios
import DashboardGridView from './components/DashboardGridView';

// 4. Types e interfaces
import type { SedeCardData } from './components/DashboardGridView';

// 5. Estilos
import './Dashboard.scss';
```

### TypeScript
- Siempre tipear props de componentes
- Usar interfaces para objetos complejos
- Usar type para unions o aliases simples
- Evitar `any`, preferir `unknown` si es necesario

---

## 🎓 13. Aprendizajes y Buenas Prácticas

### 1. **Separación de Responsabilidades**
- `DashboardGridView`: Solo renderiza grid y cards
- `Dashboard`: Maneja estado y navegación
- Servicios: Solo comunicación con API

### 2. **Composición sobre Herencia**
- Componentes pequeños y reutilizables
- Props específicas por funcionalidad
- Callbacks para comunicación padre-hijo

### 3. **Estado Mínimo Necesario**
- Solo guardamos IDs y datos críticos
- Datos derivados se calculan en render
- Evitar duplicación de información

### 4. **Manejo de Errores Graceful**
```typescript
try {
  const stats = await fetchStats(sede);
  return { ...sede, ...stats };
} catch (error) {
  // No fallar toda la carga por una sede
  return { ...sede, total_casos: 0, ... };
}
```

### 5. **UX como Prioridad**
- Loading states claros
- Feedback visual inmediato (hover, click)
- Mensajes de error descriptivos
- Animaciones suaves pero rápidas (<300ms)

---

## 📚 14. Referencias y Recursos

### Documentación
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [SCSS Documentation](https://sass-lang.com/documentation)
- [React Router v6](https://reactrouter.com/en/main)

### Librerías Usadas
- `react`: ^18.2.0
- `react-router-dom`: ^6.x
- `axios`: ^1.x
- `react-toastify`: ^9.x
- `sass`: ^1.x

### Endpoints Backend
Documentación completa en: `DetKIWI-BACKEND/README.md`

**Principales:**
- `GET /casos/GetStatsCasosBySedeIdAndEvaluacionId/{sede_id}/{evaluacion_id}`
- `GET /casos/GetStatsCasosForParalelosByEvaluacionIdAndSedeId/{evaluacion_id}/{sede_id}`
- `GET /evaluaciones/listar`
- `GET /sedes/GetAllSedes`

---

## ✅ 15. Checklist de Implementación Completada

### Backend Alignment
- [x] Actualizar interface `Caso` con campos `closed`, `sancion`, `caso_metadata`
- [x] Método `getMisCasosByEvaluacionId`
- [x] Método `getCasosBySedeIdAndEvaluacionId`
- [x] Método `getCasosByParaleloIdAndEvaluacionId`
- [x] Método `getStatsCasosBySedeIdAndEvaluacionId` ⭐
- [x] Método `getStatsCasosForParalelosByEvaluacionIdAndSedeId` ⭐
- [x] Método `actualizarMetadata`
- [x] Métodos de estadísticas en `evaluaciones.ts`
- [x] Métodos mejorados en `reporte.ts`
- [x] Corrección endpoint `getParalelosBySede`
- [x] Exportar `evaluaciones` y `periodos` en index

### Componentes UI
- [x] Crear `DashboardGridView.tsx`
- [x] Crear `DashboardGridView.scss`
- [x] Crear `Dashboard.tsx` principal
- [x] Crear `Dashboard.scss`
- [x] Implementar sistema de navegación jerárquica
- [x] Implementar breadcrumbs interactivos
- [x] Implementar selector de evaluación
- [x] Placeholder para tabla de casos

### Integración
- [x] Actualizar `AppRouter.tsx`
- [x] Importar Dashboard en rutas
- [x] Proteger ruta con autenticación
- [x] Resolver problema de casing en nombre de archivo

### Estilos y UX
- [x] Diseño responsive (mobile, tablet, desktop)
- [x] Animaciones y transiciones
- [x] Loading states
- [x] Hover effects
- [x] Gradientes y sombras
- [x] Sistema de colores consistente

### Documentación
- [x] README de implementación
- [x] Documentar interfaces
- [x] Documentar flujo de navegación
- [x] Sugerencias de próximas implementaciones
- [x] Troubleshooting guide

---

## 🎉 Conclusión

Se ha implementado exitosamente un **sistema de dashboard jerárquico completo** que permite:

1. ✅ Visualizar estadísticas de todas las sedes
2. ✅ Navegar a paralelos de una sede específica
3. ✅ Ver usuarios asignados a cada paralelo
4. ✅ Cambiar entre evaluaciones dinámicamente
5. ✅ Navegación intuitiva con breadcrumbs
6. ✅ Diseño moderno y responsive

**Todos los servicios CRUD** están actualizados y alineados con los endpoints del backend actual.

**El dashboard está listo para producción** y preparado para la futura implementación de la tabla de casos del nivel 3.

---

**Desarrollado por:** GitHub Copilot (Claude Sonnet 4.5)  
**Fecha:** Marzo 9, 2026  
**Versión:** 1.0.0
