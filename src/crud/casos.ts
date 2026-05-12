import axios from 'axios';
import { getBaseURL } from './config';

interface EstudianteCaso {
  estudiante_id: number;
  nombre: string;
  apellido: string;
  rol_usm: string;
  paralelo?: string;
}

interface UsuarioAsignado {
  user_id: number;
  username: string;
  email?: string;
}

interface ComentarioProfesor {
  user_id: number;
  username: string;
  comentario: string;
  timestamp: string;
}

interface Caso {
  caso_id: number;
  reporte_id?: number;
  similitud: number;
  lineas: number | null;
  url_moss: string | null;
  closed: boolean;
  sancion?: boolean | null;
  caso_metadata?: any;
  estudiantes?: EstudianteCaso[];
  usuarios_asignados?: UsuarioAsignado[];
  comentarios_profes?: ComentarioProfesor[];
}

interface CasoDetalle extends Caso {
  reporte_id: number;
}

interface FiltrosCasos {
  estado?: string;
  min_similitud?: number;
  max_similitud?: number;
  reporte_id?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class CasosService {
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

  async getCasosPorReporte(reporteId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerCasosPorReporteId/${reporteId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos'
      };
    }
  }

  async getCasoDetalle(casoId: number): Promise<ApiResponse<CasoDetalle>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerDetalleCaso/${casoId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Detalle del caso obtenido exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener detalle del caso'
      };
    }
  }

  async updateEstadoCaso(
    casoId: number,
    estado: { sancion: boolean; descripcion_sancion?: string }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await axios.put(`${this.baseURL}/casos/ActualizarEstadoCaso/${casoId}`, 
        estado,
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

  async indultarCaso(casoId: number): Promise<ApiResponse<any>> {
    return this.updateEstadoCaso(casoId, { sancion: false });
  }

  async sancionarCaso(casoId: number, descripcionSancion: string): Promise<ApiResponse<any>> {
    return this.updateEstadoCaso(casoId, {
      sancion: true,
      descripcion_sancion: descripcionSancion,
    });
  }

  async asignarUsuariosCaso(casoId: number, userIds: number[]): Promise<ApiResponse<any>> {
    try {
      const response = await axios.put(`${this.baseURL}/casos/AsignarCaso/${casoId}`, 
        { user_ids: userIds },
        { headers: this.getAuthHeaders() }
      );

      return {
        data: response.data,
        status: response.status,
        message: 'Usuarios asignados al caso exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al asignar usuarios al caso'
      };
    }
  }

  async getMisCasosByEvaluacionId(evaluacionId: number): Promise<ApiResponse<{ total_casos: number; casos: Caso[] }>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerMisCasosPorEvaluacionId/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos asignados obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos asignados'
      };
    }
  }

  async getCasosBySedeIdAndEvaluacionId(sedeId: number, evaluacionId: number): Promise<ApiResponse<{ total_casos: number; casos: Caso[] }>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerCasosPorSedeIdAndEvaluacionId/${sedeId}/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos por sede y evaluación obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos por sede y evaluación'
      };
    }
  }

  async getCasosByParaleloIdAndEvaluacionId(paraleloId: number, evaluacionId: number): Promise<ApiResponse<{ total_casos: number; casos: Caso[] }>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerCasosPorParaleloIdAndEvaluacionId/${paraleloId}/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Casos por paralelo y evaluación obtenidos exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener casos por paralelo y evaluación'
      };
    }
  }

  async getStatsCasosBySedeIdAndEvaluacionId(sedeId: number, evaluacionId: number): Promise<ApiResponse<{
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
  }>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerStatsCasosPorSedeIdAndEvaluacionId/${sedeId}/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas de casos obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener estadísticas de casos'
      };
    }
  }

  async getStatsCasosForParalelosByEvaluacionIdAndSedeId(evaluacionId: number, sedeId: number): Promise<ApiResponse<Array<{
    paralelo: string;
    paralelo_id: number;
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
    usuarios_asignados: Array<{
      user_id: number;
      username: string;
      email: string;
    }>;
  }>>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerStatsCasosPorParalelosPorEvaluacionIdAndSedeId/${evaluacionId}/${sedeId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas de casos por paralelos obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener estadísticas de casos por paralelos'
      };
    }
  }

  async getStatsCasosForParalelosByEvaluacionId(evaluacionId: number): Promise<ApiResponse<Array<{
    paralelo: string;
    paralelo_id: number;
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
    usuarios_asignados: Array<{
      user_id: number;
      username: string;
      email: string;
    }>;
  }>>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerStatsCasosPorParalelosAndEvaluacionId/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas de casos por paralelos y evaluación obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener estadísticas de casos por paralelos y evaluación'
      };
    }
  }

  async actualizarMetadata(casoId: number, casoMetadata: any): Promise<ApiResponse<any>> {
    try {
      const response = await axios.put(`${this.baseURL}/casos/ActualizarMetadata/${casoId}`, 
        { caso_metadata: casoMetadata },
        { headers: this.getAuthHeaders() }
      );

      return {
        data: response.data,
        status: response.status,
        message: 'Metadata del caso actualizado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al actualizar metadata del caso'
      };
    }
  }

  async agregarComentarioCaso(
    casoId: number,
    comentario: string
  ): Promise<ApiResponse<{ msg: string; caso_id: number; comentarios_profes: ComentarioProfesor[] }>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/casos/AgregarComentario/${casoId}`,
        { comentario },
        { headers: this.getAuthHeaders() }
      );

      return {
        data: response.data,
        status: response.status,
        message: 'Comentario agregado exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al agregar comentario al caso'
      };
    }
  }

  async filtrarCasos(filtros: FiltrosCasos): Promise<ApiResponse<{ total_casos: number; casos: Caso[] }>> {
    try {
      const params: any = {};
      
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.min_similitud !== undefined) params.min_similitud = filtros.min_similitud;
      if (filtros.max_similitud !== undefined) params.max_similitud = filtros.max_similitud;
      if (filtros.reporte_id) params.reporte_id = filtros.reporte_id;

      const response = await axios.get(`${this.baseURL}/casos/filtrar`, {
        headers: this.getAuthHeaders(),
        params
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
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al filtrar casos'
      };
    }
  }
}

const casosService = new CasosService();

export default casosService;
export type { Caso, CasoDetalle, EstudianteCaso, UsuarioAsignado, ComentarioProfesor, FiltrosCasos, ApiResponse };
