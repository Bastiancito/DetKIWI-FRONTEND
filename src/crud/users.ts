import axios from 'axios';
import { getBaseURL } from './config';

interface User {
  user_id: number;
  username: string;
  email: string;
  rol_id?: number;
  paralelos?: Array<{
    paralelo_id: number;
    nombre: string;
    sede_id?: number | null;
    sede_nombre?: string | null;
  }>;
}

interface UploadParticipantesResponse {
  msg: string;
  total_procesados: number;
  usuarios_creados: number;
  usuarios_actualizados: number;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  rol_id: number;
  paralelo_ids?: number[];
}

interface UpdateUserData {
  username?: string;
  email?: string;
  rol_id?: number;
  password?: string;
  paralelo_ids?: number[];
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class UsersService {
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

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/users/ObtenerUsuarios`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuarios obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener usuarios'
      };
    }
  }

  async getUserById(userId: number): Promise<ApiResponse<User>> {
    try {
      const response = await axios.get(`${this.baseURL}/users/ObtenerUsuarioPorId/${userId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuario obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener usuario'
      };
    }
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      const response = await axios.get(`${this.baseURL}/users/ObtenerUsuarioPorEmail/${email}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuario obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener usuario'
      };
    }
  }

  async getUsersByRolId(rolId: number): Promise<ApiResponse<User[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/users/ObtenerUsuariosPorRolId/${rolId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuarios obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener usuarios por rol'
      };
    }
  }

  async getUsersBySedeId(sedeId: number): Promise<ApiResponse<User[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/users/ObtenerUsuariosPorSedeId/${sedeId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuarios obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener usuarios por sede'
      };
    }
  }

  async getUsersByParaleloId(paraleloId: number): Promise<ApiResponse<User[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/users/ObtenerUsuariosPorParaleloId/${paraleloId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuarios obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al obtener usuarios por paralelo'
      };
    }
  }

  async createUser(userData: CreateUserData): Promise<ApiResponse<User>> {
    try {
      const response = await axios.post(`${this.baseURL}/users/CrearUsuario`, userData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuario creado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al crear usuario'
      };
    }
  }

  async updateUser(userId: number, userData: UpdateUserData): Promise<ApiResponse<User>> {
    try {
      const response = await axios.put(`${this.baseURL}/users/ActualizarUsuario/${userId}`, userData, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuario actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al actualizar usuario'
      };
    }
  }

  async deleteUser(userId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(`${this.baseURL}/users/EliminarUsuario/${userId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Usuario eliminado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.error || 'Error al eliminar usuario'
      };
    }
  }

  async uploadParticipantes(file: File): Promise<ApiResponse<UploadParticipantesResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${this.baseURL}/users/upload_participantes`, formData, {
        headers: this.getFileUploadHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Participantes cargados exitosamente'
      };
    } catch (error: any) {
      throw {
        data: error.response?.data || null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al cargar participantes'
      };
    }
  }
}

const usersService = new UsersService();

export default usersService;
export type { User, CreateUserData, UpdateUserData, ApiResponse, UploadParticipantesResponse };