import axios from 'axios';
import { getBaseURL } from './config';

interface Periodo {
  periodo_id: number;
  nombre: string;
  anio: number;
  semestre: number;
  activo: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  total_evaluaciones?: number;
  total_reportes?: number;
  total_casos?: number;
}

interface CreatePeriodoData {
  nombre: string;
  anio: number;
  semestre: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
}

interface UpdatePeriodoData {
  nombre?: string;
  anio?: number;
  semestre?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface ListarPeriodosResponse {
  total: number;
  periodos: Periodo[];
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class PeriodosService {
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

  async crearPeriodo(periodoData: CreatePeriodoData): Promise<ApiResponse<{ msg: string; periodo: Periodo }>> {
    try {
      const response = await axios.post(`${this.baseURL}/periodos/CrearPeriodo`, periodoData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Periodo creado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al crear periodo'
      };
    }
  }

  async listarPeriodos(): Promise<ApiResponse<ListarPeriodosResponse>> {
    try {
      const response = await axios.get(`${this.baseURL}/periodos/listar`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Periodos obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al listar periodos'
      };
    }
  }

  async obtenerPeriodoActivo(): Promise<ApiResponse<Periodo | { msg: string; periodo: null }>> {
    try {
      const response = await axios.get(`${this.baseURL}/periodos/ObtenerPeriodoActivo`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Periodo activo obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener periodo activo'
      };
    }
  }

  async toggleEstadoPeriodo(periodoId: number): Promise<ApiResponse<{ msg: string; periodo: Periodo }>> {
    try {
      const response = await axios.put(`${this.baseURL}/periodos/ToggleActivarPeriodo/${periodoId}`, {}, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estado de periodo actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al actualizar estado del periodo'
      };
    }
  }

  async activarPeriodo(periodoId: number): Promise<ApiResponse<{ msg: string; periodo: Periodo }>> {
    return this.toggleEstadoPeriodo(periodoId);
  }

  async obtenerPeriodo(periodoId: number): Promise<ApiResponse<Periodo>> {
    try {
      const response = await axios.get(`${this.baseURL}/periodos/ObtenerPeriodo/${periodoId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Periodo obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener periodo'
      };
    }
  }

  async actualizarPeriodo(periodoId: number, periodoData: UpdatePeriodoData): Promise<ApiResponse<{ msg: string; periodo: Periodo }>> {
    try {
      const response = await axios.put(`${this.baseURL}/periodos/ActualizarPeriodo/${periodoId}`, periodoData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Periodo actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al actualizar periodo'
      };
    }
  }

  async eliminarPeriodo(periodoId: number): Promise<ApiResponse<{ msg: string }>> {
    try {
      const response = await axios.delete(`${this.baseURL}/periodos/EliminarPeriodo/${periodoId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Periodo eliminado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al eliminar periodo'
      };
    }
  }
}

export type {
  Periodo,
  CreatePeriodoData,
  UpdatePeriodoData,
  ListarPeriodosResponse,
  ApiResponse
};

const periodosService = new PeriodosService();
export default periodosService;
