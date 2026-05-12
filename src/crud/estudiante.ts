import axios from 'axios';
import { getBaseURL } from './config';

interface Estudiante {
  estudiante_id: number;
  nombre: string;
  apellido: string;
  rol_usm?: string;
  paralelo_id?: number;
  paralelo_sigla?: string;
  paralelo?: string;
  paralelo_nombre?: string;
  sigla_paralelo?: string;
  sanciones?: any[];
  num_sanciones?: number;
}

interface CreateEstudianteData {
  nombre: string;
  apellido: string;
  rol_usm?: string;
  paralelo_id?: number;
}

interface UpdateEstudianteData {
  nombre?: string;
  apellido?: string;
  rol_usm?: string;
  paralelo_id?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class EstudianteService {
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

  private normalizeEstudiante(raw: any): Estudiante {
    const sanciones = Array.isArray(raw?.sanciones) ? raw.sanciones : [];
    return {
      estudiante_id: raw?.estudiante_id,
      nombre: raw?.nombre || '',
      apellido: raw?.apellido || '',
      rol_usm: raw?.rol_usm ?? undefined,
      paralelo_id: raw?.paralelo_id ?? undefined,
      paralelo_sigla: raw?.paralelo_sigla ?? undefined,
      paralelo: raw?.paralelo ?? undefined,
      paralelo_nombre: raw?.paralelo_nombre ?? undefined,
      sigla_paralelo: raw?.sigla_paralelo ?? undefined,
      sanciones,
      num_sanciones: typeof raw?.num_sanciones === 'number' ? raw.num_sanciones : sanciones.length,
    };
  }

  async getAllEstudiantes(): Promise<ApiResponse<Estudiante[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/estudiante/ObtenerEstudiantes`, {
        headers: this.getAuthHeaders()
      });

      const estudiantes: Estudiante[] = Array.isArray(response.data)
        ? response.data.map((estudiante) => this.normalizeEstudiante(estudiante))
        : [];

      return {
        data: estudiantes,
        status: response.status,
        message: 'Estudiantes obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener estudiantes'
      };
    }
  }

  async getEstudianteById(estudianteId: number): Promise<ApiResponse<Estudiante>> {
    try {
      const response = await axios.get(`${this.baseURL}/estudiante/ObtenerEstudiantePorEstudianteId/${estudianteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: this.normalizeEstudiante(response.data),
        status: response.status,
        message: 'Estudiante obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener estudiante'
      };
    }
  }

  async createEstudiante(estudianteData: CreateEstudianteData): Promise<ApiResponse<Estudiante>> {
    try {
      const response = await axios.post(`${this.baseURL}/estudiante/CrearEstudiante`, estudianteData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: this.normalizeEstudiante(response.data),
        status: response.status,
        message: 'Estudiante creado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al crear estudiante'
      };
    }
  }

  async updateEstudiante(estudianteId: number, estudianteData: UpdateEstudianteData): Promise<ApiResponse<Estudiante>> {
    try {
      const response = await axios.put(`${this.baseURL}/estudiante/ActualizarEstudiantePorEstudianteId/${estudianteId}`, estudianteData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: this.normalizeEstudiante(response.data),
        status: response.status,
        message: 'Estudiante actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al actualizar estudiante'
      };
    }
  }

  async deleteEstudiante(estudianteId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/estudiante/EliminarEstudiantePorEstudianteId/${estudianteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estudiante eliminado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al eliminar estudiante'
      };
    }
  }
}

const estudianteService = new EstudianteService();

export default estudianteService;
export type { Estudiante, CreateEstudianteData, UpdateEstudianteData, ApiResponse };