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
  in_process?: boolean;
  sancion?: boolean | null;
  // reason can be a per-user mapping: { userId: { motivo: string, descripcion: string } }
  reason?: Record<string, { motivo?: string; descripcion?: string }> | string | null;
  motivo_sancion?: Record<string, { motivo?: string; descripcion?: string }> | string | null;
  descripcion_sancion?: string | null; // backward-compat synthesized field
  caso_metadata?: any;
  cantidad_usuarios_asignados?: number;
  paralelos?: Array<{
    paralelo_id: number;
    sigla_paralelo: string;
    sede_id?: number | null;
    sede_nombre?: string | null;
  }>;
  estudiantes?: EstudianteCaso[];
  usuarios_asignados?: UsuarioAsignado[];
  comentarios_profes?: ComentarioProfesor[];
  decisiones_profes?: Record<string, boolean | null | undefined>;
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

const DEFAULT_SANCTION_REASON = 'Amonestación por plagio';

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

  

  async cambiarDecision(casoId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/casos/CambiarDecision/${casoId}`, null, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Decisión del caso cambiada exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al cambiar decisión del caso'
      };
    }
  }

  async updateEstadoCaso(
    casoId: number,
    estado: { sancion: boolean; descripcion_sancion?: string; forzar?: boolean; reason?: any }
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

  // New API wrappers: prefer POST endpoints for clarity
  async postSancionarCaso(casoId: number, payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/casos/SancionarCaso/${casoId}`, payload, {
        headers: this.getAuthHeaders()
      });

      return { data: response.data, status: response.status, message: 'Sanción enviada' };
    } catch (error: any) {
      throw { data: null, status: error.response?.status || 500, message: error.response?.data?.msg || error.response?.data?.error || 'Error al sancionar' };
    }
  }

  async postIndultarCaso(casoId: number, payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/casos/IndultarCaso/${casoId}`, payload, {
        headers: this.getAuthHeaders()
      });

      return { data: response.data, status: response.status, message: 'Indulto enviado' };
    } catch (error: any) {
      throw { data: null, status: error.response?.status || 500, message: error.response?.data?.msg || error.response?.data?.error || 'Error al indultar' };
    }
  }

  async postCambiarOpinion(casoId: number, payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/casos/CambiarOpinion/${casoId}`, payload, {
        headers: this.getAuthHeaders()
      });

      return { data: response.data, status: response.status, message: 'Opinión cambiada' };
    } catch (error: any) {
      throw { data: null, status: error.response?.status || 500, message: error.response?.data?.msg || error.response?.data?.error || 'Error al cambiar opinion' };
    }
  }

  async postForzarSancion(casoId: number, payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/casos/ForzarSancion/${casoId}`, payload, {
        headers: this.getAuthHeaders()
      });

      return { data: response.data, status: response.status, message: 'Forzar sanción enviada' };
    } catch (error: any) {
      throw { data: null, status: error.response?.status || 500, message: error.response?.data?.msg || error.response?.data?.error || 'Error al forzar sanción' };
    }
  }

  async postForzarIndulto(casoId: number, payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${this.baseURL}/casos/ForzarIndulto/${casoId}`, payload, {
        headers: this.getAuthHeaders()
      });

      return { data: response.data, status: response.status, message: 'Forzar indulto enviado' };
    } catch (error: any) {
      throw { data: null, status: error.response?.status || 500, message: error.response?.data?.msg || error.response?.data?.error || 'Error al forzar indulto' };
    }
  }

  async indultarCaso(casoId: number): Promise<ApiResponse<any>> {
    return this.postIndultarCaso(casoId, { reason: null });
  }

  async sancionarCaso(casoId: number, descripcionSancion: string, userId?: number): Promise<ApiResponse<any>> {
    const payload: any = { sancion: true };
    if (userId != null) {
      payload.reason = { [String(userId)]: { motivo: descripcionSancion, descripcion: descripcionSancion } };
    } else {
      // fallback to legacy field
      payload.descripcion_sancion = descripcionSancion;
      payload.reason = DEFAULT_SANCTION_REASON;
    }
    return this.postSancionarCaso(casoId, payload);
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

  async getStatsCasosForParalelosByEvaluacionIdMisParalelos(evaluacionId: number): Promise<ApiResponse<Array<{
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
      const response = await axios.get(`${this.baseURL}/casos/ObtenerStatsCasosPorParalelosAndEvaluacionIdMisParalelos/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas de casos por paralelos del usuario obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener estadísticas de casos por paralelos del usuario'
      };
    }
  }

  async getStatsCasosForSedesByEvaluacionId(evaluacionId: number): Promise<ApiResponse<Array<{
    sede_id: number;
    nombre: string;
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
  }>>> {
    try {
      const response = await axios.get(`${this.baseURL}/casos/ObtenerStatsCasosPorSedesAndEvaluacionId/${evaluacionId}`, {
        headers: this.getAuthHeaders()
      });

      return {
        data: response.data,
        status: response.status,
        message: 'Estadísticas de casos por sedes obtenidas exitosamente'
      };
    } catch (error: any) {
      throw {
        data: null,
        status: error.response?.status || 500,
        message: error.response?.data?.msg || error.response?.data?.error || 'Error al obtener estadísticas de casos por sedes'
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
