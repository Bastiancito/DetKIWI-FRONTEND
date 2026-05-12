import axios from 'axios';
import { getBaseURL } from './config';

interface Paralelo {
  paralelo_id: number;
  nombre: string;
  sede_id: number;
  sede_nombre?: string;
}

interface CreateParaleloData {
  nombre: string;
  sede_id: number;
}

interface UpdateParaleloData {
  nombre?: string;
  sede_id?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class ParalelosService {
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

  async getAllParalelos(): Promise<ApiResponse<Paralelo[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/paralelos/ObtenerParalelos`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelos obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener paralelos'
      };
    }
  }

 

  async CrearListadoDeParalelos(paralelosData: CreateParaleloData[]): Promise<ApiResponse<Paralelo[]>> {
    try {
      const response = await axios.post(`${this.baseURL}/paralelos/CrearListadoDeParalelos`, paralelosData, {
        headers: this.getAuthHeaders()
      });
      return {
        data: response.data,
        status: response.status,
        message: 'Listado de paralelos creado exitosamente'
        };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al crear listado de paralelos'
      };
    }
  }
  
  
  async getParaleloById(paraleloId: number): Promise<ApiResponse<Paralelo>> {
    try {
      const response = await axios.get(`${this.baseURL}/paralelos/ObtenerParaleloPorId/${paraleloId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelo obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener paralelo'
      };
    }
  }

  async createParalelo(paraleloData: CreateParaleloData): Promise<ApiResponse<Paralelo>> {
    try {
      const response = await axios.post(`${this.baseURL}/paralelos/CrearParalelo`, paraleloData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelo creado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al crear paralelo'
      };
    }
  }

  async updateParalelo(paraleloId: number, paraleloData: UpdateParaleloData): Promise<ApiResponse<Paralelo>> {
    try {
      const response = await axios.put(`${this.baseURL}/paralelos/ActualizarParaleloPorParaleloId/${paraleloId}`, paraleloData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelo actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al actualizar paralelo'
      };
    }
  }

  async deleteParalelo(paraleloId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/paralelos/EliminarParaleloPorParaleloId/${paraleloId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelo eliminado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al eliminar paralelo'
      };
    }
  }

  async asignarUsuarioParalelo(paraleloId: number, userId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/paralelos/AsignarUsuarioPorParaleloId/${paraleloId}`, 
        { user_id: userId },
        { headers: this.getAuthHeaders() }
      );

      return {
        data: response.data,
        status: response.status,
        message: 'Usuario asignado al paralelo exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al asignar usuario al paralelo'
      };
    }
  }

  async removerUsuarioParalelo(paraleloId: number, userId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/paralelos/RemoverUsuarioPorParaleloId/${paraleloId}`, {
        headers: this.getAuthHeaders(),
        data: { user_id: userId }
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuario removido del paralelo exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al remover usuario del paralelo'
      };
    }
  }


  async getUsuariosParalelo(paraleloId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${this.baseURL}/paralelos/ObtenerTodosLosUsuariosPorParaleloId/${paraleloId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuarios del paralelo obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener usuarios del paralelo'
      };
    }
  }

  async getParalelosUsuario(userId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${this.baseURL}/paralelos/ObtenerParalelosPorUserId/${userId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Paralelos del usuario obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener paralelos del usuario'
      };
    }
  }
}

const paralelosService = new ParalelosService();

export default paralelosService;
export type { Paralelo, CreateParaleloData, UpdateParaleloData, ApiResponse };