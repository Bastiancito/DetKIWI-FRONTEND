import axios from 'axios';
import { getBaseURL } from './config';

interface Rol {
  rol_id: number;
  nombre: string;
  descripcion?: string;
}

interface CreateRolData {
  nombre: string;
  descripcion?: string;
}

interface UpdateRolData {
  nombre?: string;
  descripcion?: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class RolesService {
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

  async getAllRoles(): Promise<ApiResponse<Rol[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/roles/GetAllRoles`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Roles obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener roles'
      };
    }
  }

  async createRol(rolData: CreateRolData): Promise<ApiResponse<Rol>> {
    try {
      const response = await axios.post(`${this.baseURL}/roles/CreateRol`, rolData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Rol creado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al crear rol'
      };
    }
  }

  async updateRol(rolId: number, rolData: UpdateRolData): Promise<ApiResponse<Rol>> {
    try {
      const response = await axios.put(`${this.baseURL}/roles/UpdateRol/${rolId}`, rolData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Rol actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al actualizar rol'
      };
    }
  }

  async deleteRol(rolId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/roles/DeleteRol/${rolId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Rol eliminado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al eliminar rol'
      };
    }
  }
}

const rolesService = new RolesService();

export default rolesService;
export type { Rol, CreateRolData, UpdateRolData, ApiResponse };