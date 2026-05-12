import axios from 'axios';
import { getBaseURL } from './config';

interface Estadisticas {
  casos: number;
  reportes: number;
  evaluaciones: number;
  periodos: number;
  estudiantes: number;
  users: number;
  paralelos: number;
  sedes: number;
  roles: number;
  user_paralelos: number;
  caso_estudiantes: number;
  caso_usuarios: number;
}

interface LimpiarResponse {
  message: string;
  registros_eliminados: any;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class AdminService {
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

  async limpiarTabla(tabla: string): Promise<ApiResponse<LimpiarResponse>> {
    try {
      const response = await axios.delete(`${this.baseURL}/admin/limpiar-tabla/${tabla}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: `Tabla ${tabla} limpiada exitosamente`
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al limpiar tabla'
      };
    }
  }

  async limpiarTodo(): Promise<ApiResponse<LimpiarResponse>> {
    try {
      const response = await axios.delete(`${this.baseURL}/admin/limpiar-todo`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Base de datos limpiada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al limpiar base de datos'
      };
    }
  }

  async limpiarCasosReportes(): Promise<ApiResponse<LimpiarResponse>> {
    try {
      const response = await axios.delete(`${this.baseURL}/admin/limpiar-casos-reportes`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos y reportes limpiados exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al limpiar casos y reportes'
      };
    }
  }

  async resetSecuencias(): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/admin/reset-secuencias`, {}, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Secuencias reseteadas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al resetear secuencias'
      };
    }
  }

  async getEstadisticas(): Promise<ApiResponse<{ estadisticas: Estadisticas; total_registros: number }>> {
    try {
      const response = await axios.get(`${this.baseURL}/admin/estadisticas`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener estadísticas'
      };
    }
  }

  async getInfo(): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${this.baseURL}/admin/info`);

      return {
        data: response.data,
        status: response.status,
        message: 'Información obtenida exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener información'
      };
    }
  }
}

const adminService = new AdminService();

export default adminService;
export type { Estadisticas, LimpiarResponse, ApiResponse };
