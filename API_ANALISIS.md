# Análisis de Endpoints de la API Backend vs Frontend

Este documento presenta un análisis y catastro de todas las rutas definidas en el proyecto backend (`DetKIWI-BACKEND`) y contrasta su uso actual con el código del frontend (`DetKIWI-FRONTEND`). La finalidad es detectar endpoints "huérfanos" (no consumidos), categorizándolos según su posible utilidad futura o si resultan redundantes.

---

## 1. Endpoints Identificados y Su Estado

Se analizaron todos los controladores (blueprints) de Flask (`app/blueprints/*.py`) encontrando decenas de rutas disponibles. Luego, al revisar las llamadas realizadas a través de `axios` en la carpeta `src/crud/*.ts` y su consumo real en los componentes de React (`src/views` y `src/components`), logramos identificar que hay una cantidad sustancial de endpoints implementados que, al día de hoy, **no tienen uso en la interfaz gráfica**.

### Endpoints con Uso Confirmado ✅
Rutas como login (`/login`), listado de casos principales, tablas paramétricas (`/ObtenerSedes`, `/listar` de periodos y evaluaciones, listado de usuarios), subida de reportes (`/upload`) y obtención de reportes, sí se están consumiendo de forma activa en secciones como `Dashboard`, `CasosTable`, `Usuarios`, etc.

---

## 2. Endpoints No Utilizados en el Frontend (Huérfanos) ❌

La siguiente lista muestra los endpoints que fueron expuestos por el backend y mapeados (o comentados) en el frontend, pero que **no se llaman ni se usan en ningún componente del proyecto (UI)**.

### Blueprint `admin`:
- `/limpiar-tabla/<string:tabla>` (DELETE)
- `/limpiar-todo` (DELETE)
- `/limpiar-casos-reportes` (DELETE)
- `/reset-secuencias` (POST)
- `/estadisticas` (GET)
- `/info` (GET)

### Blueprint `auth`:
- `/register` (POST)

### Blueprint `casos`:
- `/ObtenerCasosPorReporteId/<int:reporte_id>` (GET)
- `/ActualizarEstadoCaso/<int:caso_id>` (PUT)
- `/AsignarCaso/<int:caso_id>` (PUT)
- `/ObtenerMisCasosPorEvaluacionId/<int:evaluacion_id>` (GET)
- `/ObtenerCasosPorSedeIdAndEvaluacionId/<param...>` (GET)
- `/ActualizarMetadata/<int:caso_id>` (PUT)
- `/filtrar` (GET)

### Blueprint `casos_sancionados`:
- `/CrearCasoSancionado` (POST)
- `/ActualizarCasoSancionado/<int:sancion_id>` (PUT)
- `/EliminarCasoSancionado/<int:sancion_id>` (DELETE)

### Blueprint `estudiante`, `evaluaciones`, `periodos`, `sedes`:
- Endpoints de obtención individual: `/ObtenerEstudiantePorEstudianteId`, `/ObtenerEvaluacionPorEvaluacionId`, `/ObtenerPeriodo`, `/ObtenerSedePorId`, etc. (GET)
- `/ObtenerEstadisticasPorEvaluacionId/<int:evaluacion_id>` (GET)
- `/ObtenerCasosPorEvaluacionId/<int:evaluacion_id>` (GET)
- `/ToggleActivarPeriodo/<int:periodo_id>` (PUT)
- Eliminación de estructuras mayores (`EliminarParaleloPorParaleloId`, `EliminarSede`) y creación mutada (`CrearListadoDeParalelos`).

### Blueprint `paralelos`:
- Asignaciones cruzadas: `/AsignarUsuarioPorParaleloId`, `/RemoverUsuarioPorParaleloId`, `/ObtenerTodosLosUsuariosPorParaleloId` (POST/DELETE/GET).

### Blueprint `reportes`:
- `/detalle-reporte/<int:reporte_id>` (GET)
- `/casos-reporte/<int:reporte_id>` (GET)
- `/estadisticas-reporte/<int:reporte_id>` (GET)
- `/casos-filtrados-reporte/<int:reporte_id>` (GET)
- `/eliminar-reporte/<int:reporte_id>` (DELETE)
- `/debug/preview` (POST/GET) - *(Ni siquiera existe un wrapper de Axios, abandonado en el script puro)*.

### Blueprint `roles` y `users`:
- CRUD Base roles: `/CreateRol`, `/UpdateRol`, `/DeleteRol` (POST/PUT/DELETE)
- Queries condicionales de users: `/ObtenerUsuarioPorEmail`, `/ObtenerUsuariosPorRolId`, `/ObtenerUsuariosPorSedeId`, `/ObtenerUsuariosPorParaleloId`.
- Eliminación: `/EliminarUsuario` (DELETE) *(Probablemente manejado lógicamente con un campo activo/inactivo)*

---

## 3. Categorización y Análisis

### 🔹 Podrían ser útiles y por qué

Múltiples de estas rutas representan "funcionalidades avanzadas" o utilidades que un sistema maduro necesita y a las que el frontend aún no les ha construido ventana/modal:

1. **Dashboard Administrativo / Sysadmin (`admin.py`)**:
   Las rutas de `limpiar-*` y `reset-secuencias` son **sumamente útiles para ambientes de Desarrollo/QA**, permitiendo purgar bases de datos y simular subidas en limpio en frontend de forma fácil o para realizar un mantenedor de configuración interno al SuperAdministrador.
2. **Reportería Analítica y Resúmenes (`estadisticas-reporte`, `ObtenerEstadisticasPorEvaluacionId`)**:
   Alimentarían perfectmente una vista nueva o un *Widget* integrado en el Home, entregando al profesor/administrador una vista con gráficos de torta o barras sobre el impacto de plagio en una evaluación sin que deba mirar caso por caso.
3. **Distribución Carga e Intervención Específica (`AsignarCaso`, `/AsignarUsuarioPorParaleloId`)**:
   Serían útiles para una vista de "Coordinador" donde un Supervisor puede reasignar manualmente ayudantes a casos o paralelos en base a la sobrecarga.
4. **Opciones Avanzadas de Filtros (`/filtrar`, `/casos-filtrados-reporte`)**:
   Podrían aprovecharse para vistas de tablas avanzadas si la actual datatable de clientes (`CasosTable`) comenzara a fallar de rendimiento (si son millones de reportes).

### 🔸 Están de sobra (redundantes / obsoletas)

Tienen altas probabilidades de ser _endpoint debt_ (deuda técnica), agregando peso y mantenimiento innecesario:

1. **El modelo CRUD Completo para `roles.py`**:
   Las rutas `/CreateRol`, `/UpdateRol`, y `/DeleteRol` casi nunca se consumen en sistemas institucionales con roles fijos (Administrador, Profesor, Ayudante). Esto es propenso a inyectar bugs de seguridad o romper integridad referencial; la base casi siempre sembrará los 3 o 4 estáticos requeridos.
2. **Endpoints Modificadores de `casos_sancionados.py`**:
   Si el "sancionar" a un estudiante se consolida simplemente con `/ActualizarEstadoCaso` (pasando el enum a "Sancionado"), tener entidades que lo creen, eliminen y manipulen aparte agrega redundancia y desvíos lógicos en CRUDs distintos que harían fallar la app.
3. **Puntos "Get By Id" Individuales No Aprovechados**:
   Rutas como `getEstudianteById`, `obtenerEvaluacion`, `getSedeById`, `ObtenerUsuarioPorEmail`. Hoy en día, **React prefiere cargar el store global (`zustand`, estado de cache de axios o props de DataTable)**. Si la interfaz ya consumió `/listar` en la pantalla anterior, al hacer doble clic para ver los detalles, la interfaz no necesita "ir a buscar 1 registro" al backend porque el modelo completo ya está en memoria local del Frontend listado, desaprovechando estas optimizaciones al 100%.
4. **Endponits de Debugging olvidados**:
   Rutas como `/debug/preview` están en desuso extremo que no cuentan ni siquiera con un mapeo en los ficheros Typescript. Constituyen un potencial riesgo de seguridad u olvido que debiesen ser removidas del router Flask.
5. **Abarrotes Multi-condicionales**:
   Endpoints que unen muchos joins duros: `/ObtenerStatsCasosPorParalelosPorEvaluacionIdAndSedeId`. Muchos de estos ya se podrían abstraer en un endpoint general en `/casos` con _Query Params_, pero su repetición constante con firmas largas mancha el router de Flask y genera entropía (redundancia alta si se compara a un buen `api/casos?sede=1&evaluacion=2&limit=stats`).