import authService from './auth';
import usersService from './users';
import estudianteService from './estudiante';
import paralelosService from './paralelos';
import rolesService from './roles';
import sedesService from './sedes';
import reporteService from './reporte';
import adminService from './admin';
import casosService from './casos';
import casosSancionadosService from './casosSancionados';
import evaluacionesService from './evaluaciones';
import periodosService from './periodos';
import { getBaseURL, setEnvironment, getConfig } from './config';

export type { LoginCredentials, LoginResponse, RegisterData } from './auth';
export type { User, CreateUserData, UpdateUserData, UploadParticipantesResponse } from './users';
export type { Estudiante, CreateEstudianteData, UpdateEstudianteData } from './estudiante';
export type { Paralelo, CreateParaleloData, UpdateParaleloData } from './paralelos';
export type { Rol, CreateRolData, UpdateRolData } from './roles';
export type { Sede, CreateSedeData, UpdateSedeData } from './sedes';
export type { 
  Reporte, 
  ReporteUploadData, 
  ReporteResponse, 
  ReporteUploadResponse,
  CasoSimilitud 
} from './reporte';
export type { Estadisticas, LimpiarResponse } from './admin';
export type { Caso, CasoDetalle, EstudianteCaso, UsuarioAsignado, ComentarioProfesor, FiltrosCasos } from './casos';
export type {
  CasoSancionado,
  EstudianteSancionado,
  CreateCasoSancionadoData,
  UpdateCasoSancionadoData,
} from './casosSancionados';
export type { 
  Evaluacion, 
  CreateEvaluacionData, 
  UpdateEvaluacionData, 
  EvaluacionDetalle,
  ListarEvaluacionesResponse
} from './evaluaciones';
export { isEvaluacionFueraDePlazo } from './evaluaciones';
export type { 
  Periodo, 
  CreatePeriodoData, 
  UpdatePeriodoData,
  ListarPeriodosResponse
} from './periodos';

export {
  authService,
  usersService,
  estudianteService,
  paralelosService,
  rolesService,
  sedesService,
  reporteService,
  adminService,
  casosService,
  casosSancionadosService,
  evaluacionesService,
  periodosService
};

export {
  getBaseURL,
  setEnvironment,
  getConfig
};

export const services = {
  auth: authService,
  users: usersService,
  estudiante: estudianteService,
  paralelos: paralelosService,
  roles: rolesService,
  sedes: sedesService,
  reporte: reporteService,
  admin: adminService,
  casos: casosService,
  casosSancionados: casosSancionadosService,
  evaluaciones: evaluacionesService,
  periodos: periodosService
};

export const switchToProduction = (): void => {
  setEnvironment('production');
  console.log('API configurada para producción:', getBaseURL());
};

export const switchToLocal = (): void => {
  setEnvironment('local');
  console.log('API configurada para desarrollo local:', getBaseURL());
};

export default services;