
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  
  DASHBOARD: '/dashboard',
  USERS: '/users',
  ESTUDIANTES: '/estudiantes',
  PARALELOS: '/paralelos',
  EVALUACIONES: '/evaluaciones',
  CASOS_SANCIONADOS: '/casos-sancionados',
  ROLES: '/roles',
  SEDES: '/sedes',
  REPORTES: '/reportes',
  UPLOAD_EXCEL: '/upload-excel',
  
  USER_DETAIL: (id: number | string) => `/users/${id}`,
  ESTUDIANTE_DETAIL: (id: number | string) => `/estudiantes/${id}`,
  PARALELO_DETAIL: (id: number | string) => `/paralelos/${id}`,
  REPORTE_DETAIL: (id: number | string) => `/reportes/${id}`,
  
} as const;

export const NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: 'dashboard',
    requiresAuth: true
  },
  {
    name: 'Usuarios',
    path: ROUTES.USERS,
    icon: 'users',
    requiresAuth: true
  },
  {
    name: 'Estudiantes',
    path: ROUTES.ESTUDIANTES,
    icon: 'academic-cap',
    requiresAuth: true
  },
  {
    name: 'Mis casos',
    path: ROUTES.PARALELOS,
    icon: 'user-group',
    requiresAuth: true
  },
  {
    name: 'Evaluaciones',
    path: ROUTES.EVALUACIONES,
    icon: 'clipboard-document-check',
    requiresAuth: true
  },
  {
    name: 'Casos sancionados',
    path: ROUTES.CASOS_SANCIONADOS,
    icon: 'exclamation-triangle',
    requiresAuth: true
  },
  {
    name: 'Reportes',
    path: ROUTES.REPORTES,
    icon: 'document-chart-bar',
    requiresAuth: true
  },
  {
    name: 'Subir Excel',
    path: ROUTES.UPLOAD_EXCEL,
    icon: 'arrow-up-tray',
    requiresAuth: true
  }
] as const;

export default ROUTES;