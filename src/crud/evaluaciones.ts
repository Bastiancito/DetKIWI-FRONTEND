import axios from 'axios';
import { getBaseURL } from './config';

interface Evaluacion {
  evaluacion_id: number;
  nombre: string;
  descripcion?: string;
  fecha_creacion: string;
  fecha_entrega?: string;
  periodo_id?: number;
  activo?: boolean;
  periodo?: {
    periodo_id: number;
    nombre: string;
    activo?: boolean;
  };
  total_reportes?: number;
  total_casos?: number;
}

interface CreateEvaluacionData {
  nombre: string;
  descripcion?: string;
  fecha_entrega?: string;
  periodo_id: number;
}

interface UpdateEvaluacionData {
  nombre?: string;
  descripcion?: string;
  fecha_entrega?: string;
  activo?: boolean;
}

interface EvaluacionDetalle extends Evaluacion {
  reportes: Array<{
    reporte_id: number;
    titulo: string;
    fecha_creacion: string;
    total_casos: number;
    casos_pendientes: number;
  }>;
}

interface ListarEvaluacionesResponse {
  total: number;
  evaluaciones: Evaluacion[];
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class EvaluacionesService {
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

  async crearEvaluacion(evaluacionData: CreateEvaluacionData): Promise<ApiResponse<{ msg: string; evaluacion: Evaluacion }>> {
    try {
      const response = await axios.post(`${this.baseURL}/evaluaciones/CrearEvaluacion`, evaluacionData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Evaluación creada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al crear evaluación'
      };
    }
  }

  async listarEvaluaciones(params?: { periodo_id?: number; solo_activo?: boolean }): Promise<ApiResponse<ListarEvaluacionesResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.periodo_id) {
        queryParams.append('periodo_id', params.periodo_id.toString());
      }
      if (params?.solo_activo) {
        queryParams.append('solo_activo', 'true');
      }

      const url = queryParams.toString() 
        ? `${this.baseURL}/evaluaciones/listar?${queryParams.toString()}`
        : `${this.baseURL}/evaluaciones/listar`;

      const response = await axios.get(url, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Evaluaciones obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al listar evaluaciones'
      };
    }
  }

  async obtenerEvaluacion(evaluacionId: number): Promise<ApiResponse<EvaluacionDetalle>> {
    try {
      const response = await axios.get(`${this.baseURL}/evaluaciones/ObtenerEvaluacionPorEvaluacionId/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Evaluación obtenida exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener evaluación'
      };
    }
  }

  async actualizarEvaluacion(evaluacionId: number, evaluacionData: UpdateEvaluacionData): Promise<ApiResponse<{ msg: string; evaluacion: Evaluacion }>> {
    try {
      const response = await axios.put(`${this.baseURL}/evaluaciones/ActualizarEvaluacionPorEvaluacionId/${evaluacionId}`, evaluacionData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Evaluación actualizada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al actualizar evaluación'
      };
    }
  }

  async toggleEstadoEvaluacion(evaluacionId: number): Promise<ApiResponse<{ msg: string; evaluacion: Evaluacion }>> {
    try {
      const response = await axios.get(`${this.baseURL}/evaluaciones/ToggleActivoByEvaluacionId/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estado de evaluación actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al actualizar estado de evaluación'
      };
    }
  }

  async eliminarEvaluacion(evaluacionId: number): Promise<ApiResponse<{ msg: string }>> {
    try {
      const response = await axios.delete(`${this.baseURL}/evaluaciones/EliminarEvaluacionPorEvaluacionId/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Evaluación eliminada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al eliminar evaluación'
      };
    }
  }

  async obtenerEstadisticas(evaluacionId: number): Promise<ApiResponse<{
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
    casos_criticos: number;
  }>> {
    try {
      const response = await axios.get(`${this.baseURL}/evaluaciones/ObtenerEstadisticasPorEvaluacionId/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas de evaluación obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener estadísticas'
      };
    }
  }

  async obtenerCasosEvaluacion(evaluacionId: number, filtros?: {
    min_similitud?: number;
    max_similitud?: number;
    closed?: boolean;
  }): Promise<ApiResponse<{
    total: number;
    casos: any[];
  }>> {
    try {
      const params = new URLSearchParams();
      if (filtros?.min_similitud !== undefined) {
        params.append('min_similitud', filtros.min_similitud.toString());
      }
      if (filtros?.max_similitud !== undefined) {
        params.append('max_similitud', filtros.max_similitud.toString());
      }
      if (filtros?.closed !== undefined) {
        params.append('closed', filtros.closed.toString());
      }

      const url = params.toString()
        ? `${this.baseURL}/evaluaciones/ObtenerCasosPorEvaluacionId/${evaluacionId}?${params.toString()}`
        : `${this.baseURL}/evaluaciones/ObtenerCasosPorEvaluacionId/${evaluacionId}`;

      const response = await axios.get(url, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos de evaluación obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos de evaluación'
      };
    }
  }
}

export type {
  Evaluacion,
  CreateEvaluacionData,
  UpdateEvaluacionData,
  EvaluacionDetalle,
  ListarEvaluacionesResponse,
  ApiResponse
};

const evaluacionesService = new EvaluacionesService();
export default evaluacionesService;
