import axios from 'axios';
import { getBaseURL } from './config';

interface Sede {
  sede_id: number;
  nombre: string;
}

interface CreateSedeData {
  nombre: string;
}

interface UpdateSedeData {
  nombre?: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class SedesService {
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

  async getAllSedes(): Promise<ApiResponse<Sede[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/sedes/ObtenerSedes`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Sedes obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener sedes'
      };
    }
  }

  async getSedeById(sedeId: number): Promise<ApiResponse<Sede>> {
    try {
      const response = await axios.get(`${this.baseURL}/sedes/ObtenerSedePorId/${sedeId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Sede obtenida exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener sede'
      };
    }
  }

  async createSede(sedeData: CreateSedeData): Promise<ApiResponse<Sede>> {
    try {
      const response = await axios.post(`${this.baseURL}/sedes/CrearSede`, sedeData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Sede creada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al crear sede'
      };
    }
  }

  async updateSede(sedeId: number, sedeData: UpdateSedeData): Promise<ApiResponse<Sede>> {
    try {
      const response = await axios.put(`${this.baseURL}/sedes/ActualizarSede/${sedeId}`, sedeData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Sede actualizada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al actualizar sede'
      };
    }
  }

  async deleteSede(sedeId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/sedes/EliminarSede/${sedeId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Sede eliminada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al eliminar sede'
      };
    }
  }

  async getParalelosBySede(sedeId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/sedes/ObtenerParalelosPorSede/${sedeId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelos de la sede obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener paralelos de la sede'
      };
    }
  }

  async getEstudiantesBySede(sedeId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/sedes/ObtenerParalelosPorSede/${sedeId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estudiantes de la sede obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener estudiantes de la sede'
      };
    }
  }
}

const sedesService = new SedesService();

export default sedesService;
export type { Sede, CreateSedeData, UpdateSedeData, ApiResponse };