import axios from 'axios';
import { getBaseURL } from './config';

interface Reporte {
  reporte_id: number;
  titulo: string;
  fecha_creacion: string;
  user_id: number;
  evaluacion_id: number;
}

interface ReporteUploadData {
  file: File;
  titulo?: string;
  evaluacion_id: number;
  confirmar_sin_encargado?: boolean;
  confirmar_duplicados?: boolean;
}

interface EncargadoResumen {
  user_id: number;
  username: string;
  email: string;
}

interface ParaleloResumen {
  paralelo_id?: number | null;
  sigla_paralelo: string;
  sede_id?: number | null;
  sede_nombre?: string | null;
  tiene_encargado: boolean;
  usuarios_asignados: EncargadoResumen[];
  user_ids: number[];
  estado: 'con_encargado' | 'sin_encargado';
}

interface EstudianteResumen {
  estudiante_id: number | null;
  rol_usm: string;
  nombre: string;
  apellido: string;
  paralelo?: string | null;
  sede?: string | null;
  estado: 'creado' | 'existente';
  tiene_encargado_paralelo: boolean;
}

interface CasoSinEncargadoResumen {
  fila_original: number | string;
  similitud: number;
  estudiante1: {
    nombre: string;
    apellido: string;
    paralelo: string;
  };
  estudiante2: {
    nombre: string;
    apellido: string;
    paralelo: string;
  };
  paralelos_sin_encargado: ParaleloResumen[];
}

interface ReporteUploadResponse {
  msg: string;
  reporte_id: number;
  casos_creados: number;
  total_filas_procesadas: number;
  url_global_moss?: string | null;
  url_padre_moss?: string | null;
  matches_encontrados?: number;
  paralelos_creados_sin_sede?: string[];
  casos_sin_encargado_count?: number;
  paralelos_sin_encargado_count?: number;
  casos_sin_encargado?: CasoSinEncargadoResumen[];
  paralelos_sin_encargado?: ParaleloResumen[];
  estudiantes_creados_count?: number;
  estudiantes_creados?: EstudianteResumen[];
  paralelos_creados_count?: number;
  paralelos_creados?: ParaleloResumen[];
  advertencias?: {
    casos_invalidos: number;
    detalles_casos_invalidos: Array<{
      fila: number | string;
      errores: string[];
    }>;
  };
  casos_creados_detalle?: Array<{
    fila_original: number | string;
    similitud: number;
    lineas: number;
    url_moss?: string | null;
    tiene_encargados: boolean;
  }>;
  advertencias_sin_encargado?: {
    codigo: string;
    msg: string;
    casos_sin_encargado_count: number;
    paralelos_sin_encargado_count: number;
    casos_sin_encargado: CasoSinEncargadoResumen[];
    paralelos_sin_encargado: ParaleloResumen[];
  };
  advertencias_duplicados?: {
    codigo: string;
    msg: string;
    casos_duplicados_count: number;
    detalles_casos_duplicados: CasoSinEncargadoResumen[];
  };
  requiere_confirmacion?: boolean;
}

interface ReporteResponse {
  reporte_id: number;
  titulo: string;
  fecha_creacion: string;
  total_casos: number;
  casos_alta_similitud: number;
}

interface CasoSimilitud {
  caso_id: number;
  estudiante1: string;
  estudiante2: string;
  similitud: number;
  lineas_similares: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class ReporteService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = getBaseURL();
  }

  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private getFileUploadHeaders() {
    const token = this.getToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async validateReporte(file: File): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${this.baseURL}/reportes/validate`, formData, {
        headers: this.getFileUploadHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Archivo validado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: error.response?.data || null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || 'Error al validar archivo'
      };
    }
  }

  async uploadReporte(uploadData: ReporteUploadData): Promise<ApiResponse<ReporteUploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('evaluacion_id', uploadData.evaluacion_id.toString());
      
      if (uploadData.titulo) {
        formData.append('titulo', uploadData.titulo);
      }

      if (uploadData.confirmar_sin_encargado) {
        formData.append('confirmar_sin_encargado', 'true');
      }

      if (uploadData.confirmar_duplicados) {
        formData.append('confirmar_duplicados', 'true');
      }

      const response = await axios.post(`${this.baseURL}/reportes/upload`, formData, {
        headers: this.getFileUploadHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Reporte subido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: error.response?.data || null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al subir reporte'
      };
    }
  }

  async getMyReportes(): Promise<ApiResponse<Array<{
    reporte_id: number;
    titulo: string;
    fecha_creacion: string;
    total_casos: number;
    casos_abiertos: number;
    evaluacion?: {
      evaluacion_id: number;
      nombre: string;
    };
  }>>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/reportes`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Reportes obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener reportes'
      };
    }
  }

  async getReporteById(reporteId: number): Promise<ApiResponse<ReporteResponse>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/detalle-reporte/${reporteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Reporte obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener reporte'
      };
    }
  }

  async getCasosSimilitud(reporteId: number): Promise<ApiResponse<{
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
      estudiantes: Array<{
        estudiante_id: number;
        nombre: string;
        apellido: string;
        rol_usm: string;
        paralelo?: string;
      }>;
    }>;
  }>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/casos-reporte/${reporteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos de similitud obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos de similitud'
      };
    }
  }

  async getEstadisticasReporte(reporteId: number): Promise<ApiResponse<{
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
  }>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/estadisticas-reporte/${reporteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas del reporte obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener estadísticas del reporte'
      };
    }
  }

  async getCasosFiltrados(reporteId: number, minSimilitud: number = 0): Promise<ApiResponse<any[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/casos-filtrados-reporte/${reporteId}`, {
        headers: this.getAuthHeaders(),
        params: { min_similitud: minSimilitud }
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos filtrados obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos filtrados'
      };
    }
  }

  async deleteReporte(reporteId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/reportes/eliminar-reporte/${reporteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Reporte eliminado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al eliminar reporte'
      };
    }
  }

  async getCasosByMinSimilitud(reporteId: number, minSimilitud: number): Promise<ApiResponse<CasoSimilitud[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/casos-filtrados-reporte/${reporteId}`, {
        headers: this.getAuthHeaders(),
        params: { min_similitud: minSimilitud }
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos filtrados obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al filtrar casos'
      };
    }
  }

  async exportReporteToExcel(reporteId: number): Promise<ApiResponse<Blob>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/export_excel/${reporteId}`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Reporte exportado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al exportar reporte'
      };
    }
  }

  async updateEstadoCaso(casoId: number, estado: string): Promise<ApiResponse<any>> {
    try {
      const sancion = estado === 'con_sancion' || estado === 'sancion' || estado === 'true';
      const response = await axios.put(`${this.baseURL}/casos/ActualizarEstadoCaso/${casoId}`, 
        { sancion },
        { headers: this.getAuthHeaders() }
      );

      return {
        data: response.data,
        status: response.status,
        message: 'Estado del caso actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al actualizar estado del caso'
      };
    }
  }

  async getParalelosReporte(reporteId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${this.baseURL}/reportes/paralelos-reporte/${reporteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelos del reporte obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener paralelos del reporte'
      };
    }
  }
}

const reporteService = new ReporteService();

export default reporteService;
export type { Reporte, ReporteUploadData, ReporteResponse, CasoSimilitud, ApiResponse, ReporteUploadResponse };