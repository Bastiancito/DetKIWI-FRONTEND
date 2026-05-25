
export interface Usuario {
    user_id: number;
    username: string;
    email: string;
    password?: string;
    rol_id: number;
    paralelos?: Paralelo[];
}

export interface Paralelo {
    paralelo_id: number;
    nombre: string;
    sede_id?: number | null;
    sede_nombre?: string | null;
    usuario?: {
        user_id: number;
        username: string;
        email: string;
    };
    usuarios?: Usuario[];
}

export interface Sede {
    sede_id: number;
    nombre: string;
    paralelos?: Paralelo[];
    
}

export interface Estudiante {
    estudiante_id: number;
    nombre: string;
    apellido: string;
    rol_usm: string;
    paralelo_id: number;
    paralelo?: string;
}

export interface UsuarioAsignado {
    user_id: number;
    username: string;
    email: string;
}

export interface Caso {
    caso_id: number;
    reporte_id: number;
    similitud: number;
    lineas: number | null;
    url_moss: string | null;
    estado: string;
    estudiantes?: Estudiante[];
    involucrados?: Estudiante[];
    usuarios_asignados?: UsuarioAsignado[];
}

export interface Periodo {
    periodo_id: number;
    nombre: string;
    anio: number;
    semestre: number;
    activo: boolean;
    total_evaluaciones?: number;
    total_reportes?: number;
    total_casos?: number;
}

export interface Evaluacion {
    evaluacion_id: number;
    nombre: string;
    descripcion?: string;
    fecha_creacion: string;
    fecha_entrega?: string;
    periodo_id: number;
    periodo?: Periodo;
    total_reportes?: number;
    total_casos?: number;
}

export interface Reporte {
    reporte_id: number;
    titulo: string;
    fecha_creacion: string;
    user_id: number;
    evaluacion_id?: number;
    evaluacion?: Evaluacion;
    casos?: Caso[];
    total_casos?: number;
    casos_pendientes?: number;
}

export interface Rol {
    rol_id: number;
    nombre: string;
    descripcion?: string;
}

