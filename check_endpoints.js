const fs = require('fs');
const path = require('path');

const backend_output = \
@admin_bp.route('/limpiar-tabla/<string:tabla>', methods=['DELETE']) (admin.py:8)
@admin_bp.route('/limpiar-todo', methods=['DELETE']) (admin.py:46)
@admin_bp.route('/limpiar-casos-reportes', methods=['DELETE']) (admin.py:99)
@admin_bp.route('/reset-secuencias', methods=['POST']) (admin.py:125)
@admin_bp.route('/estadisticas', methods=['GET']) (admin.py:151)
@admin_bp.route('/info', methods=['GET']) (admin.py:187)
@auth_bp.route('/login', methods=['POST']) (auth.py:9)
@auth_bp.route('/register', methods=['POST']) (auth.py:44)
@casos_bp.route('/ObtenerCasosPorReporteId/<int:reporte_id>', methods=['GET']) (casos.py:10)
@casos_bp.route('/ObtenerDetalleCaso/<int:caso_id>', methods=['GET']) (casos.py:65)
@casos_bp.route('/AsignarCaso/<int:caso_id>', methods=['PUT']) (casos.py:116)
@casos_bp.route('/ObtenerMisCasosPorEvaluacionId/<int:evaluacion_id>', methods=['GET']) (casos.py:160)
@casos_bp.route('/ObtenerCasosPorSedeIdAndEvaluacionId/<int:sede_id>/<int:evaluacion_id>', methods=['GET']) (casos.py:213)
@casos_bp.route('/ObtenerCasosPorParaleloIdAndEvaluacionId/<int:paralelo_id>/<int:evaluacion_id>', methods=['GET']) (casos.py:254)
@casos_bp.route('/ObtenerStatsCasosPorSedeIdAndEvaluacionId/<int:sede_id>/<int:evaluacion_id>', methods=['GET']) (casos.py:303)
@casos_bp.route('/ObtenerStatsCasosPorParalelosPorEvaluacionIdAndSedeId/<int:evaluacion_id>/<int:sede_id>', methods=['GET']  ) (casos.py:342)
@casos_bp.route('/ObtenerStatsCasosPorParalelosAndEvaluacionId/<int:evaluacion_id>', methods=['GET']) (casos.py:411)
@casos_bp.route('/AgregarComentario/<int:caso_id>', methods=['POST']) (casos.py:478)
@casos_bp.route('/filtrar', methods=['GET']) (casos.py:521)
@casos_bp.route('/ActualizarMetadata/<int:caso_id>', methods=['PUT']) (casos.py:584)
@casos_bp.route('/ActualizarEstadoCaso/<int:caso_id>', methods=['PUT']) (casos.py:625)
@casos_sancionados_bp.route('/ObtenerCasosSancionados', methods=['GET']) (casos_sancionados.py:31)
@casos_sancionados_bp.route('/ObtenerCasoSancionadoPorId/<int:sancion_id>', methods=['GET']) (casos_sancionados.py:58)
@casos_sancionados_bp.route('/CrearCasoSancionado', methods=['POST']) (casos_sancionados.py:78)
@casos_sancionados_bp.route('/ActualizarCasoSancionado/<int:sancion_id>', methods=['PUT']) (casos_sancionados.py:132)
@casos_sancionados_bp.route('/EliminarCasoSancionado/<int:sancion_id>', methods=['DELETE']) (casos_sancionados.py:166)
@estudiante_bp.route('/ObtenerEstudiantes', methods=['GET']) (estudiante.py:19)
@estudiante_bp.route('/ObtenerEstudiantePorEstudianteId/<int:estudiante_id>', methods=['GET']) (estudiante.py:33)
@estudiante_bp.route('/CrearEstudiante', methods=['POST']) (estudiante.py:49)
@estudiante_bp.route('/ActualizarEstudiantePorEstudianteId/<int:estudiante_id>', methods=['PUT']) (estudiante.py:88)
@estudiante_bp.route('/EliminarEstudiantePorEstudianteId/<int:estudiante_id>', methods=['DELETE']) (estudiante.py:127)
@evaluaciones_bp.route('/CrearEvaluacion', methods=['POST']) (evaluaciones.py:10)
@evaluaciones_bp.route('/listar', methods=['GET']) (evaluaciones.py:64)
@evaluaciones_bp.route('/ObtenerEvaluacionPorEvaluacionId/<int:evaluacion_id>', methods=['GET']) (evaluaciones.py:107)
@evaluaciones_bp.route('/ActualizarEvaluacionPorEvaluacionId/<int:evaluacion_id>', methods=['PUT']) (evaluaciones.py:139)
@evaluaciones_bp.route('/EliminarEvaluacionPorEvaluacionId/<int:evaluacion_id>', methods=['DELETE']) (evaluaciones.py:175)
@evaluaciones_bp.route('/ObtenerEstadisticasPorEvaluacionId/<int:evaluacion_id>', methods=['GET']) (evaluaciones.py:198)
@evaluaciones_bp.route('/ObtenerCasosPorEvaluacionId/<int:evaluacion_id>', methods=['GET']) (evaluaciones.py:238)
@evaluaciones_bp.route('/ToggleActivoByEvaluacionId/<int:evaluacion_id>', methods=['GET']) (evaluaciones.py:318)
@paralelos_bp.route('/ObtenerParalelos', methods=['GET']) (paralelos.py:8)
@paralelos_bp.route('/ObtenerParaleloPorId/<int:paralelo_id>', methods=['GET']) (paralelos.py:31)
@paralelos_bp.route('/CrearParalelo', methods=['POST']) (paralelos.py:45)
@paralelos_bp.route('/CrearListadoDeParalelos', methods=['POST']) (paralelos.py:98)
@paralelos_bp.route('/ActualizarParaleloPorParaleloId/<int:paralelo_id>', methods=['PUT']) (paralelos.py:148)
@paralelos_bp.route('/EliminarParaleloPorParaleloId/<int:paralelo_id>', methods=['DELETE']) (paralelos.py:178)
@paralelos_bp.route('/AsignarUsuarioPorParaleloId/<int:paralelo_id>', methods=['POST']) (paralelos.py:193)
@paralelos_bp.route('/RemoverUsuarioPorParaleloId/<int:paralelo_id>', methods=['DELETE']) (paralelos.py:227)
@paralelos_bp.route('/ObtenerTodosLosUsuariosPorParaleloId/<int:paralelo_id>', methods=['GET']) (paralelos.py:260)
@paralelos_bp.route('/ObtenerParalelosPorUserId/<int:user_id>', methods=['GET']) (paralelos.py:281)
@periodos_bp.route('/CrearPeriodo', methods=['POST']) (periodos.py:9)
@periodos_bp.route('/listar', methods=['GET']) (periodos.py:54)
@periodos_bp.route('/ObtenerPeriodoActivo', methods=['GET']) (periodos.py:80)
@periodos_bp.route('/ToggleActivarPeriodo/<int:periodo_id>', methods=['PUT']) (periodos.py:99)
@periodos_bp.route('/ObtenerPeriodo/<int:periodo_id>', methods=['GET']) (periodos.py:131)
@periodos_bp.route('/ActualizarPeriodo/<int:periodo_id>', methods=['PUT']) (periodos.py:163)
@periodos_bp.route('/EliminarPeriodo/<int:periodo_id>', methods=['DELETE']) (periodos.py:188)
@reportes_bp.route('/upload', methods=['POST']) (reporte.py:35)
@reportes_bp.route('/reportes', methods=['GET']) (reporte.py:235)
@reportes_bp.route('/casos-reporte/<int:reporte_id>', methods=['GET']) (reporte.py:260)
@reportes_bp.route('/estadisticas-reporte/<int:reporte_id>', methods=['GET']) (reporte.py:305)
@reportes_bp.route('/detalle-reporte/<int:reporte_id>', methods=['GET']) (reporte.py:357)
@reportes_bp.route('/eliminar-reporte/<int:reporte_id>', methods=['DELETE']) (reporte.py:377)
@reportes_bp.route('/casos-filtrados-reporte/<int:reporte_id>', methods=['GET']) (reporte.py:395)
@reportes_bp.route('/paralelos-reporte/<int:reporte_id>', methods=['GET']) (reporte.py:437)
@reportes_bp.route('/validate', methods=['POST'])   (reporte.py:486)
@reportes_bp.route('/debug/preview', methods=['POST', 'GET']) (reporte.py:553)
@roles_bp.route('/GetAllRoles', methods=['GET']) (roles.py:8)
@roles_bp.route('/CreateRol', methods=['POST']) (roles.py:15)
@roles_bp.route('/DeleteRol/<int:rol_id>', methods=['DELETE']) (roles.py:46)
@roles_bp.route('/UpdateRol/<int:rol_id>', methods=['PUT']) (roles.py:59)
@sedes_bp.route('/ObtenerSedes', methods=['GET']) (sedes.py:8)
@sedes_bp.route('/ObtenerSedePorId/<int:sede_id>', methods=['GET']) (sedes.py:14)
@sedes_bp.route('/CrearSede', methods=['POST']) (sedes.py:27)
@sedes_bp.route('/ActualizarSede/<int:sede_id>', methods=['PUT']) (sedes.py:54)
@sedes_bp.route('/EliminarSede/<int:sede_id>', methods=['DELETE']) (sedes.py:77)
@sedes_bp.route('/ObtenerParalelosPorSede/<int:sede_id>', methods=['GET']) (sedes.py:90)
@users_bp.route('/ObtenerUsuarios', methods=['GET']) (users.py:7)
@users_bp.route('/ObtenerUsuarioPorId/<int:user_id>', methods=['GET']) (users.py:13)
@users_bp.route('/ObtenerUsuarioPorEmail/<string:email>', methods=['GET']) (users.py:35)
@users_bp.route('/ObtenerUsuariosPorRolId/<int:rol_id>', methods=['GET']) (users.py:57)
@users_bp.route('/ObtenerUsuariosPorSedeId/<int:sede_id>', methods=['GET']) (users.py:63)
@users_bp.route('/ObtenerUsuariosPorParaleloId/<int:paralelo_id>', methods=['GET']) (users.py:83)
@users_bp.route('/CrearUsuario', methods=['POST']) (users.py:99)
@users_bp.route('/EliminarUsuario/<int:user_id>', methods=['DELETE']) (users.py:157)
@users_bp.route('/ActualizarUsuario/<int:user_id>', methods=['PUT']) (users.py:170)
\;

const rutas = [];
const lines = backend_output.trim().split('\n');
lines.forEach(line => {
  const match = line.match(/\.route\('([^']+)'/);
  if (match) {
    rutas.push(match[1]);
  }
});

const used = new Set();

function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      searchDir(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      const content = fs.readFileSync(p, 'utf8');
      rutas.forEach(ruta => {
        const base = ruta.replace(/\/<[^>]+>/g, '');
        if (content.includes(base)) {
          used.add(ruta);
        }
      });
    }
  }
}

searchDir('src/crud');
searchDir('src/views');

const unused = rutas.filter(r => !used.has(r));
console.log('--- USED ---');
used.forEach(r => console.log(r));
console.log('\n--- UNUSED ---');
unused.forEach(r => console.log(r));
