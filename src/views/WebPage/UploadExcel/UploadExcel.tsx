import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { evaluacionesService, reporteService } from "../../../crud";
import type { Evaluacion } from "../../../crud";

import "./UploadExcel.scss";
import RequireRole from '../../../components/RequireRole';

interface ReportUploadResponse {
    msg: string;
    reporte_id: number;
    casos_creados: number;
    total_filas_procesadas: number;
    url_global_moss?: string | null;
    url_padre_moss?: string | null;
    matches_encontrados?: number;
    paralelos_creados_sin_sede?: string[];
    casos_sin_encargado_count?: number;
    paralelos_sin_encargado_count?: number;
    casos_sin_encargado?: Array<{
        fila_original: number | string;
        similitud: number;
        estudiante1: {
            nombre: string;
            apellido: string;
            paralelo: string;
        };
        estudiante2: {
            nombre: string;
            apellido: string;
            paralelo: string;
        };
        paralelos_sin_encargado: Array<{
            paralelo_id?: number | null;
            sigla_paralelo: string;
            registrado: boolean;
            sede_id?: number | null;
            sede_nombre?: string | null;
            tiene_encargado: boolean;
            usuarios_asignados: Array<{
                user_id: number;
                username: string;
                email: string;
            }>;
            user_ids: number[];
            estado: 'con_encargado' | 'sin_encargado';
        }>;
    }>;
    paralelos_sin_encargado?: Array<{
        paralelo_id?: number | null;
        sigla_paralelo: string;
            registrado: boolean;
        sede_id?: number | null;
        sede_nombre?: string | null;
        tiene_encargado: boolean;
        usuarios_asignados: Array<{
            user_id: number;
            username: string;
            email: string;
        }>;
        user_ids: number[];
        estado: 'con_encargado' | 'sin_encargado';
    }>;
    alumnos_creados_count?: number;
    alumnos_creados?: Array<{
        estudiante_id: number | null;
        rol_usm: string;
        nombre: string;
        apellido: string;
        paralelo?: string | null;
        sede?: string | null;
        estado: 'creado' | 'existente';
        tiene_encargado_paralelo: boolean;
    }>;
    paralelos_creados_count?: number;
    paralelos_creados?: Array<{
        paralelo_id?: number | null;
        sigla_paralelo: string;
        sede_id?: number | null;
        sede_nombre?: string | null;
        tiene_encargado: boolean;
        usuarios_asignados: Array<{
            user_id: number;
            username: string;
            email: string;
        }>;
        user_ids: number[];
        estado: 'con_encargado' | 'sin_encargado';
    }>;
    advertencias?: {
        casos_invalidos: number;
        detalles_casos_invalidos: Array<{
            fila: number | string;
            errores: string[];
        }>;
    };
    advertencias_sin_encargado?: {
        codigo: string;
        msg: string;
        casos_sin_encargado_count: number;
        paralelos_sin_encargado_count: number;
        casos_sin_encargado: NonNullable<ReportUploadResponse['casos_sin_encargado']>;
        paralelos_sin_encargado: NonNullable<ReportUploadResponse['paralelos_sin_encargado']>;
    };
    advertencias_duplicados?: {
        codigo: string;
        msg: string;
        casos_duplicados_count: number;
        detalles_casos_duplicados: Array<{
            fila_original: number | string;
            similitud: number;
            lineas: number;
            url_moss?: string | null;
            estudiante1: {
                nombre: string;
                apellido: string;
                paralelo: string;
            };
            estudiante2: {
                nombre: string;
                apellido: string;
                paralelo: string;
            };
        }>;
    };
    casos_creados_detalle?: Array<{
        fila_original: number | string;
        similitud: number;
        lineas: number;
        url_moss?: string | null;
        tiene_encargados: boolean;
    }>;
    requiere_confirmacion?: boolean;
}

interface PendingReportUpload {
    file: File;
    titulo: string;
    evaluacionId: number;
    confirmarSinEncargado?: boolean;
    confirmarDuplicados?: boolean;
}

interface ConfirmationData {
    message: string;
    confirmationType: 'sin_encargado' | 'duplicados';
    casosSinEncargadoCount: number;
    paralelosSinEncargadoCount: number;
    casosSinEncargado: NonNullable<ReportUploadResponse['casos_sin_encargado']>;
    paralelosSinEncargado: NonNullable<ReportUploadResponse['paralelos_sin_encargado']>;
    casosDuplicadosCount: number;
    casosDuplicados: NonNullable<ReportUploadResponse['advertencias_duplicados']>['detalles_casos_duplicados'];
}

const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv'];

const isAllowedFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return !!extension && ALLOWED_EXTENSIONS.includes(extension);
};

const UploadExcel: React.FC = () => {
    const navigate = useNavigate();

    const [reportFile, setReportFile] = useState<File | null>(null);
    const [titulo, setTitulo] = useState('');
    const [reportError, setReportError] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportResult, setReportResult] = useState<ReportUploadResponse | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingUpload, setPendingUpload] = useState<PendingReportUpload | null>(null);
    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<number | ''>('');

    useEffect(() => {
        fetchEvaluaciones();
    }, []);

    const fetchEvaluaciones = async () => {
        try {
            const response = await evaluacionesService.listarEvaluaciones();
            if (response.status === 200) {
                setEvaluaciones(response.data.evaluaciones);
                if (response.data.evaluaciones.length > 0) {
                    setSelectedEvaluacionId(response.data.evaluaciones[0].evaluacion_id);
                }
            }
        } catch (error: any) {
            console.error('Error fetching evaluaciones:', error);
            toast.error('Error al cargar evaluaciones');
        }
    };

    const submitReportUpload = async (confirmarSinEncargado = false, overrideUpload?: PendingReportUpload, confirmarDuplicados = false) => {
        const fileToUpload = overrideUpload?.file || reportFile;
        const tituloToUpload = overrideUpload?.titulo ?? titulo.trim();
        const evaluacionIdToUpload = overrideUpload?.evaluacionId ?? Number(selectedEvaluacionId);
        const confirmarSinEncargadoFinal = overrideUpload?.confirmarSinEncargado ?? confirmarSinEncargado;
        const confirmarDuplicadosFinal = overrideUpload?.confirmarDuplicados ?? confirmarDuplicados;

        if (!fileToUpload) {
            setReportError('Por favor selecciona un archivo');
            toast.error('Por favor selecciona un archivo');
            return;
        }

        if (!evaluacionIdToUpload) {
            setReportError('Selecciona una evaluacion antes de subir el archivo');
            toast.error('Selecciona una evaluacion antes de subir el archivo');
            return;
        }

        setReportLoading(true);
        setReportError('');
        setReportResult(null);

        try {
            const response = await reporteService.uploadReporte({
                file: fileToUpload,
                titulo: tituloToUpload || undefined,
                evaluacion_id: evaluacionIdToUpload,
                confirmar_sin_encargado: confirmarSinEncargadoFinal,
                confirmar_duplicados: confirmarDuplicadosFinal
            });

            const result = response.data as unknown as ReportUploadResponse;
            setReportResult(result);
            setPendingUpload(null);
            setConfirmationData(null);
            setShowConfirmModal(false);

            const advertenciasSinEncargado = result.advertencias_sin_encargado;
            const casosSinEncargadoCount = advertenciasSinEncargado?.casos_sin_encargado_count
                ?? result.casos_sin_encargado?.length
                ?? result.casos_sin_encargado_count
                ?? 0;

            toast.success(`Reporte creado: ${result.casos_creados} casos procesados`);

            if (casosSinEncargadoCount > 0) {
                toast.warning(`${casosSinEncargadoCount} casos quedaron sin encargado`);
            }

            if (result.paralelos_creados_sin_sede && result.paralelos_creados_sin_sede.length > 0) {
                toast.warning(`${result.paralelos_creados_sin_sede.length} paralelos fueron creados sin sede`);
            }

            if (result.advertencias && result.advertencias.casos_invalidos > 0) {
                toast.warning(
                    `${result.advertencias.casos_invalidos} casos no pudieron ser procesados`,
                    { autoClose: 5000 }
                );
            }
        } catch (err: any) {
            console.error('Error uploading report file:', err);
            const errorData = err.data || err.response?.data;
            const status = err.status || err.response?.status;

            if (status === 409 && errorData?.requiere_confirmacion) {
                const isDuplicados = errorData?.codigo === 'MOSS_DUPLICATE_CASES_DETECTED';
                setPendingUpload({
                    file: fileToUpload,
                    titulo: tituloToUpload,
                    evaluacionId: evaluacionIdToUpload,
                    confirmarSinEncargado: confirmarSinEncargadoFinal,
                    confirmarDuplicados: false
                });
                setConfirmationData({
                    message: errorData.msg || 'Se requiere confirmación para continuar.',
                    confirmationType: isDuplicados ? 'duplicados' : 'sin_encargado',
                    casosSinEncargadoCount: errorData.casos_sin_encargado_count || 0,
                    paralelosSinEncargadoCount: errorData.paralelos_sin_encargado_count || 0,
                    casosSinEncargado: errorData.casos_sin_encargado || [],
                    paralelosSinEncargado: errorData.paralelos_sin_encargado || [],
                    casosDuplicadosCount: errorData.casos_duplicados_count || 0,
                    casosDuplicados: errorData.casos_duplicados || []
                });
                setShowConfirmModal(true);
                return;
            }

            const errorMsg = err.message || errorData?.msg || 'Error al cargar el archivo';
            setReportError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setReportLoading(false);
        }
    };

    const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        setReportFile(selectedFile);
        setReportError('');
        setReportResult(null);

        if (selectedFile && !isAllowedFile(selectedFile)) {
            setReportFile(null);
            setReportError('Formato inválido. Usa .xlsx, .xls o .csv.');
            toast.error('Formato inválido. Usa .xlsx, .xls o .csv.');
        }
    };

    const handleReportUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        await submitReportUpload(false);
    };

    const handleConfirmUpload = async () => {
        if (!pendingUpload) {
            setShowConfirmModal(false);
            return;
        }

        const confirmarDuplicados = confirmationData?.confirmationType === 'duplicados';
        setShowConfirmModal(false);
        await submitReportUpload(
            pendingUpload.confirmarSinEncargado ?? false,
            {
                ...pendingUpload,
                confirmarDuplicados
            },
            confirmarDuplicados
        );
    };

    const handleCancelConfirmation = () => {
        setShowConfirmModal(false);
        setConfirmationData(null);
        setPendingUpload(null);
    };

    const activeStatusBadge = reportLoading ? 'warning' : reportResult ? 'success' : 'secondary';

    const activeStatusLabel = reportLoading ? 'Procesando' : reportResult ? 'Completado' : 'Pendiente';
    const alumnosCreadosPreview = reportResult?.alumnos_creados || [];
    const paralelosCreadosPreview = reportResult?.paralelos_creados || [];
    const casosSinEncargadoPreview = reportResult?.advertencias_sin_encargado?.casos_sin_encargado || reportResult?.casos_sin_encargado || [];
    const paralelosSinEncargadoPreview = reportResult?.advertencias_sin_encargado?.paralelos_sin_encargado || reportResult?.paralelos_sin_encargado || [];
    const casosSinEncargadoCount = reportResult?.advertencias_sin_encargado?.casos_sin_encargado_count
        ?? reportResult?.casos_sin_encargado_count
        ?? casosSinEncargadoPreview.length;
    const paralelosSinEncargadoCount = reportResult?.advertencias_sin_encargado?.paralelos_sin_encargado_count
        ?? reportResult?.paralelos_sin_encargado_count
        ?? paralelosSinEncargadoPreview.length;
    const hasCasosSinEncargado = casosSinEncargadoCount > 0;

    return (
        <RequireRole allowedRoles={[1]}>
        <div className="upload-view">
            <Row className="g-4">
                <Col xs={12} xl={8}>
                    <Card className="surface-card page-hero border-0 h-100">
                        <Card.Body className="p-4 p-lg-5">
                            
                            <h1 className="page-title h2 fw-bold mb-2">Subir reporte MOSS</h1>
                            
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12} xl={4}>
                    <Card className="surface-card border-0 h-100">
                        <Card.Body className="p-4">
                            <h2 className="h5 fw-bold mb-3">Resumen</h2>
                            <div className="d-grid gap-3">
                                <div>
                                    <div className="text-secondary small text-uppercase fw-semibold mb-1">Evaluaciones disponibles</div>
                                    <div className="fw-semibold">{evaluaciones.length}</div>
                                </div>
                                <div>
                                    <div className="text-secondary small text-uppercase fw-semibold mb-1">Archivo seleccionado</div>
                                    <div className="fw-semibold text-break">{reportFile ? reportFile.name : 'Ninguno'}</div>
                                </div>
                                <div>
                                    <div className="text-secondary small text-uppercase fw-semibold mb-1">Estado</div>
                                    <Badge bg={activeStatusBadge} className="px-3 py-2">
                                        {activeStatusLabel}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-secondary small text-uppercase fw-semibold mb-1">Último resultado</div>
                                    <div className="fw-semibold">{reportResult ? `Reporte ${reportResult.reporte_id}` : 'Pendiente'}</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12}>
                    <Card className="surface-card border-0">
                        <Card.Body className="p-4 p-lg-5">
                            <Form onSubmit={handleReportUpload} className="d-grid gap-4">
                                <Row className="g-4">
                                    <Col md={6}>
                                        <Form.Group controlId="evaluacion">
                                            <Form.Label className="fw-semibold">Evaluacion</Form.Label>
                                            <Form.Select
                                                value={selectedEvaluacionId}
                                                onChange={(e) => setSelectedEvaluacionId(Number(e.target.value))}
                                                disabled={reportLoading || evaluaciones.length === 0}
                                            >
                                                {evaluaciones.length === 0 ? (
                                                    <option>No hay evaluaciones disponibles</option>
                                                ) : (
                                                    evaluaciones.map((evaluacion) => (
                                                        <option key={evaluacion.evaluacion_id} value={evaluacion.evaluacion_id}>
                                                            {evaluacion.nombre}
                                                        </option>
                                                    ))
                                                )}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group controlId="titulo">
                                            <Form.Label className="fw-semibold">Titulo del reporte</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ej: Tarea 1 - Semestre 2025-1"
                                                value={titulo}
                                                onChange={(e) => setTitulo(e.target.value)}
                                                disabled={reportLoading}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group controlId="fileReporte">
                                    <Form.Label className="fw-semibold">Archivo</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleReportFileChange}
                                        disabled={reportLoading}
                                    />
                                    <Form.Text className="text-secondary">
                                        Formatos soportados: .xlsx, .xls y .csv.
                                    </Form.Text>
                                </Form.Group>

                                {reportError && <Alert variant="danger" className="mb-0">{reportError}</Alert>}

                                {reportResult && (
                                    <div className="d-grid gap-4">
                                        <Alert variant="success" className="mb-0">
                                            <Alert.Heading className="h6 fw-bold">Carga exitosa</Alert.Heading>
                                            <div className="d-grid gap-1">
                                                <span><strong>Reporte ID:</strong> {reportResult.reporte_id}</span>
                                                <span><strong>Casos creados:</strong> {reportResult.casos_creados}</span>
                                                <span><strong>Filas procesadas:</strong> {reportResult.total_filas_procesadas}</span>
                                                <span><strong>Alumnos creados:</strong> {reportResult.alumnos_creados_count ?? alumnosCreadosPreview.length}</span>
                                                <span><strong>Paralelos creados:</strong> {reportResult.paralelos_creados_count ?? paralelosCreadosPreview.length}</span>
                                                {(reportResult.casos_sin_encargado_count !== undefined || reportResult.advertencias_sin_encargado) && (
                                                    <span><strong>Casos sin encargado:</strong> {casosSinEncargadoCount}</span>
                                                )}
                                                {(reportResult.paralelos_sin_encargado_count !== undefined || reportResult.advertencias_sin_encargado) && (
                                                    <span><strong>Paralelos sin encargado:</strong> {paralelosSinEncargadoCount}</span>
                                                )}
                                                {reportResult.matches_encontrados !== undefined && (
                                                    <span><strong>Matches encontrados:</strong> {reportResult.matches_encontrados}</span>
                                                )}
                                                {reportResult.url_global_moss && (
                                                    <span className="text-break"><strong>URL MOSS:</strong> {reportResult.url_global_moss}</span>
                                                )}
                                                {reportResult.advertencias && (
                                                    <span><strong>Casos con errores:</strong> {reportResult.advertencias.casos_invalidos}</span>
                                                )}
                                            </div>
                                            <div className="d-flex flex-column flex-md-row gap-2 mt-3">
                                                <Button type="button" variant="outline-primary" onClick={() => navigate('/paralelos')}>
                                                    Ver paralelos
                                                </Button>
                                                <Button type="button" variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                                                    Ir al dashboard
                                                </Button>
                                            </div>
                                        </Alert>

                                        {hasCasosSinEncargado && (
                                            <>
                                                <Alert variant="warning" className="mb-0">
                                                    Hay casos que se procesaron sin encargado. Revisa los paralelos sin usuario asignado antes de avanzar.
                                                </Alert>

                                                <div className="mt-3 d-flex gap-2">
                                                    <Button variant="outline-secondary" onClick={() => navigate('/paralelos')}>
                                                        Revisar paralelos
                                                    </Button>
                                                </div>
                                            </>
                                        )}

                                        {reportResult.advertencias_duplicados && reportResult.advertencias_duplicados.casos_duplicados_count > 0 && (
                                            <Alert variant="info" className="mb-0">
                                                Se omitieron {reportResult.advertencias_duplicados.casos_duplicados_count} casos duplicados detectados en el archivo.
                                            </Alert>
                                        )}

                                        <Row className="g-4">
                                            <Col xs={12} xl={6}>
                                                <Card className="surface-card border-0 h-100">
                                                    <Card.Body className="p-4">
                                                        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                                                            <h2 className="h5 fw-bold mb-0">Alumnos creados</h2>
                                                            <Badge bg="primary" pill>{reportResult.alumnos_creados_count ?? alumnosCreadosPreview.length}</Badge>
                                                        </div>

                                                        {alumnosCreadosPreview.length === 0 ? (
                                                            <div className="text-secondary">No se crearon alumnos en esta importación.</div>
                                                        ) : (
                                                            <ListGroup variant="flush" className="border rounded">
                                                                {alumnosCreadosPreview.slice(0, 10).map((alumno) => (
                                                                    <ListGroup.Item key={`${alumno.rol_usm}-${alumno.nombre}-${alumno.apellido}`} className="d-flex justify-content-between align-items-start gap-3">
                                                                        <div>
                                                                            <div className="fw-semibold">
                                                                                {alumno.nombre} {alumno.apellido}
                                                                            </div>
                                                                            <div className="text-secondary small">{alumno.rol_usm}</div>
                                                                            <div className="small mt-1">
                                                                                <span className="fw-semibold">Paralelo:</span> {alumno.paralelo || 'Sin paralelo'}
                                                                                {alumno.sede && <span> · {alumno.sede}</span>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-end d-grid gap-2 justify-items-end">
                                                                            <Badge bg="success">Creado</Badge>
                                                                            <Badge bg={alumno.tiene_encargado_paralelo ? 'primary' : 'warning'} text={alumno.tiene_encargado_paralelo ? undefined : 'dark'}>
                                                                                {alumno.tiene_encargado_paralelo ? 'Con encargado' : 'Sin encargado'}
                                                                            </Badge>
                                                                        </div>
                                                                    </ListGroup.Item>
                                                                ))}
                                                            </ListGroup>
                                                        )}

                                                        {alumnosCreadosPreview.length > 10 && (
                                                            <div className="text-secondary small mt-2">Mostrando 10 de {alumnosCreadosPreview.length} alumnos creados.</div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>

                                            <Col xs={12} xl={6}>
                                                <Card className="surface-card border-0 h-100">
                                                    <Card.Body className="p-4">
                                                        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                                                            <h2 className="h5 fw-bold mb-0">Paralelos creados</h2>
                                                            <Badge bg="info" pill>{reportResult.paralelos_creados_count ?? paralelosCreadosPreview.length}</Badge>
                                                        </div>

                                                        {paralelosCreadosPreview.length === 0 ? (
                                                            <div className="text-secondary">No se crearon paralelos en esta importación.</div>
                                                        ) : (
                                                            <ListGroup variant="flush" className="border rounded">
                                                                {paralelosCreadosPreview.slice(0, 10).map((paralelo) => (
                                                                    <ListGroup.Item key={paralelo.sigla_paralelo} className="d-grid gap-2">
                                                                        <div className="d-flex justify-content-between align-items-start gap-2">
                                                                            <div>
                                                                                <div className="fw-semibold">{paralelo.sigla_paralelo}</div>
                                                                                <div className="text-secondary small">{paralelo.sede_nombre || 'Sin sede'}</div>
                                                                            </div>
                                                                            <Badge bg={paralelo.tiene_encargado ? 'success' : 'warning'} text={paralelo.tiene_encargado ? undefined : 'dark'}>
                                                                                {paralelo.tiene_encargado ? 'Con encargado' : 'Sin encargado'}
                                                                            </Badge>
                                                                        </div>
                                                                        {paralelo.usuarios_asignados.length > 0 ? (
                                                                            <div className="d-flex flex-wrap gap-1">
                                                                                {paralelo.usuarios_asignados.map((usuario) => (
                                                                                    <Badge key={usuario.user_id} bg="light" text="dark" pill className="border">
                                                                                        {usuario.username} ({usuario.user_id})
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="small text-secondary">Sin user_id asociado todavía.</div>
                                                                        )}
                                                                    </ListGroup.Item>
                                                                ))}
                                                            </ListGroup>
                                                        )}

                                                        {paralelosCreadosPreview.length > 10 && (
                                                            <div className="text-secondary small mt-2">Mostrando 10 de {paralelosCreadosPreview.length} paralelos creados.</div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {casosSinEncargadoPreview.length > 0 && (
                                            <Card className="surface-card border-0">
                                                <Card.Body className="p-4">
                                                    <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                                                        <h2 className="h5 fw-bold mb-0">Casos sin encargado</h2>
                                                        <Badge bg="warning" text="dark" pill>{casosSinEncargadoCount}</Badge>
                                                    </div>

                                                    <ListGroup variant="flush" className="border rounded">
                                                        {casosSinEncargadoPreview.slice(0, 5).map((caso, index) => (
                                                            <ListGroup.Item key={`${caso.fila_original}-${index}`} className="d-grid gap-2">
                                                                <div className="d-flex justify-content-between align-items-start gap-2">
                                                                    <div>
                                                                        <div className="fw-semibold">Fila {caso.fila_original}</div>
                                                                        <div className="text-secondary small">Similitud: {caso.similitud}%</div>
                                                                    </div>
                                                                    <Badge bg="warning" text="dark">Sin encargado</Badge>
                                                                </div>

                                                                <div className="small">
                                                                    <div><strong>Estudiante 1:</strong> {caso.estudiante1.nombre} {caso.estudiante1.apellido} · {caso.estudiante1.paralelo || 'Sin paralelo'}</div>
                                                                    <div><strong>Estudiante 2:</strong> {caso.estudiante2.nombre} {caso.estudiante2.apellido} · {caso.estudiante2.paralelo || 'Sin paralelo'}</div>
                                                                </div>

                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {caso.paralelos_sin_encargado.map((paralelo) => (
                                                                        <Badge key={`${caso.fila_original}-${paralelo.sigla_paralelo}`} bg="light" text="dark" pill className="border">
                                                                            {paralelo.sigla_paralelo} {paralelo.registrado ? '' : '(nuevo)'}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                </Card.Body>
                                            </Card>
                                        )}
                                    </div>
                                )}

                                <div className="d-flex flex-column flex-md-row gap-3 justify-content-end">
                                    <Button type="button" variant="outline-secondary" onClick={() => navigate('/dashboard')} disabled={reportLoading}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={reportLoading || !reportFile || evaluaciones.length === 0} className="fw-semibold px-4">
                                        {reportLoading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Procesando...
                                            </>
                                        ) : 'Subir reporte'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal show={showConfirmModal} onHide={handleCancelConfirmation} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar carga</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning" className="mb-3">
                        {confirmationData?.message || 'Se requiere confirmación para continuar.'}
                    </Alert>

                    {confirmationData && (
                        <div className="d-grid gap-3">
                            {confirmationData.confirmationType === 'duplicados' ? (
                                <>
                                    <div>
                                        <div className="fw-semibold">Casos duplicados detectados</div>
                                        <div className="text-secondary small">{confirmationData.casosDuplicadosCount} casos serán omitidos si continúas.</div>
                                    </div>

                                    <div>
                                        <div className="fw-semibold mb-2">Primeros duplicados detectados</div>
                                        <ListGroup>
                                            {confirmationData.casosDuplicados.slice(0, 5).map((caso, idx) => (
                                                <ListGroup.Item key={`${caso.fila_original}-${idx}`}>
                                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                                        <div>
                                                            <div className="fw-semibold">Fila {caso.fila_original}</div>
                                                            <div className="text-secondary small">Similitud: {caso.similitud}% · Líneas: {caso.lineas}</div>
                                                        </div>
                                                        <Badge bg="info">Duplicado</Badge>
                                                    </div>
                                                    <div className="small text-secondary">
                                                        <div><strong>Estudiante 1:</strong> {caso.estudiante1.nombre} {caso.estudiante1.apellido} · {caso.estudiante1.paralelo}</div>
                                                        <div><strong>Estudiante 2:</strong> {caso.estudiante2.nombre} {caso.estudiante2.apellido} · {caso.estudiante2.paralelo}</div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <div className="fw-semibold">Casos afectados</div>
                                        <div className="text-secondary small">{confirmationData.casosSinEncargadoCount} casos y {confirmationData.paralelosSinEncargadoCount} paralelos sin encargado.</div>
                                    </div>

                                    <div>
                                        <div className="fw-semibold mb-2">Paralelos sin encargado</div>
                                        <ListGroup>
                                            {confirmationData.paralelosSinEncargado.slice(0, 5).map((paralelo) => (
                                                <ListGroup.Item key={paralelo.sigla_paralelo} className="d-flex justify-content-between align-items-center gap-3">
                                                    <div>
                                                        <div className="fw-semibold">{paralelo.sigla_paralelo}</div>
                                                        <div className="text-secondary small">{paralelo.sede_nombre || 'Sin sede'}</div>
                                                    </div>
                                                    <Badge bg={paralelo.registrado ? 'warning' : 'secondary'} text={paralelo.registrado ? 'dark' : undefined}>
                                                        {paralelo.registrado ? 'Sin encargado' : 'No registrado'}
                                                    </Badge>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </div>

                                    <div>
                                        <div className="fw-semibold mb-2">Primeros casos afectados</div>
                                        <ListGroup>
                                            {confirmationData.casosSinEncargado.slice(0, 2).map((caso) => (
                                                <ListGroup.Item key={`${caso.fila_original}-${caso.similitud}`}>
                                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                                        <div>
                                                            <div className="fw-semibold">Fila {caso.fila_original}</div>
                                                            <div className="text-secondary small">Similitud: {caso.similitud}%</div>
                                                        </div>
                                                        <Badge bg="warning" text="dark">Sin encargado</Badge>
                                                    </div>
                                                    <div className="small text-secondary">
                                                        <div><strong>Estudiante 1:</strong> {caso.estudiante1.nombre} {caso.estudiante1.apellido} · {caso.estudiante1.paralelo}</div>
                                                        <div><strong>Estudiante 2:</strong> {caso.estudiante2.nombre} {caso.estudiante2.apellido} · {caso.estudiante2.paralelo}</div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleCancelConfirmation} disabled={reportLoading}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={handleConfirmUpload} disabled={reportLoading}>
                        {reportLoading ? 'Procesando...' : 'Continuar'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
        </RequireRole>
    );
};

export default UploadExcel;
