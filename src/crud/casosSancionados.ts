import axios from 'axios';
import { getBaseURL } from './config';

interface EstudianteSancionado {
  nombre?: string;
  apellido?: string;
  rol_usm?: string;
  paralelo?: string | null;
}

interface ProfesorInvolucrado {
  username?: string;
  email?: string;
}

interface CasoSancionado {
  sancion_id: number;
  caso_id: number;
  estudiantes_involucrados: Record<string, EstudianteSancionado>;
  profesores_involucrados?: Record<string, ProfesorInvolucrado>;
  descripcion_sancion: string;
  fecha_sancion: string | null;
}

interface CreateCasoSancionadoData {
  caso_id: number;
  descripcion_sancion: string;
  estudiantes_involucrados?: Record<string, EstudianteSancionado>;
}

interface UpdateCasoSancionadoData {
  descripcion_sancion?: string;
  estudiantes_involucrados?: Record<string, EstudianteSancionado>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class CasosSancionadosService {
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
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  async getCasosSancionados(casoId?: number): Promise<ApiResponse<{ total: number; sanciones: CasoSancionado[] }>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos_sancionados/ObtenerCasosSancionados`, {
        headers: this.getAuthHeaders(),
        params: casoId ? { caso_id: casoId } : undefined,
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos sancionados obtenidos exitosamente',
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos sancionados',
      };
    }
  }

  async getCasoSancionadoById(sancionId: number): Promise<ApiResponse<CasoSancionado>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos_sancionados/ObtenerCasoSancionadoPorId/${sancionId}`, {
        headers: this.getAuthHeaders(),
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Detalle de sancion obtenido exitosamente',
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener detalle de sancion',
      };
    }
  }

  async createCasoSancionado(payload: CreateCasoSancionadoData): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/casos_sancionados/CrearCasoSancionado`, payload, {
        headers: this.getAuthHeaders(),
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Caso sancionado creado exitosamente',
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al crear caso sancionado',
      };
    }
  }

  async updateCasoSancionado(sancionId: number, payload: UpdateCasoSancionadoData): Promise<ApiResponse<any>> {
    try {
      const response = await axios.put(`${this.baseURL}/casos_sancionados/ActualizarCasoSancionado/${sancionId}`, payload, {
        headers: this.getAuthHeaders(),
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Caso sancionado actualizado exitosamente',
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al actualizar caso sancionado',
      };
    }
  }

  async deleteCasoSancionado(sancionId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/casos_sancionados/EliminarCasoSancionado/${sancionId}`, {
        headers: this.getAuthHeaders(),
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Caso sancionado eliminado exitosamente',
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al eliminar caso sancionado',
      };
    }
  }
}

const casosSancionadosService = new CasosSancionadosService();

export default casosSancionadosService;
export type {
  CasoSancionado,
  EstudianteSancionado,
  ProfesorInvolucrado,
  CreateCasoSancionadoData,
  UpdateCasoSancionadoData,
  ApiResponse,
};
