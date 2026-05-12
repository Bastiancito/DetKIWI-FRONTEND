import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { evaluacionesService, reporteService } from "../../../crud";
import type { Evaluacion } from "../../../crud";

import "./UploadExcel.scss";


interface UploadResponse {
    msg: string;
    reporte_id: number;
    casos_creados: number;
    total_filas_procesadas: number;
    advertencias?: {
        casos_invalidos: number;
        detalles_casos_invalidos: Array<{
            fila: number | string;
            errores: string[];
        }>;
    };
}

const UploadExcel: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [titulo, setTitulo] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<number | ''>('');
    const [paralelosNoRegistrados, setParalelosNoRegistrados] = useState<any[]>([]);

    useEffect(() => {
        fetchEvaluaciones();
    }
    , []);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        setFile(selectedFile);
        setError('');
        setParalelosNoRegistrados([]);
        setUploadResult(null);
        
        if (selectedFile) {
            await validateFile(selectedFile);
        }
    };

    const validateFile = async (fileToValidate: File) => {
        setValidating(true);

        try {
            const response = await reporteService.validateReporte(fileToValidate);
            const data = response.data;

            toast.success('Archivo válido y listo para procesar');
            if (data.muestra_casos_invalidos > 0) {
                toast.warning(`Se detectaron ${data.muestra_casos_invalidos} casos con errores en la muestra`);
            }
        } catch (err: any) {
            console.error('Error validating file:', err);
            const errorData = err.data;
            
            if (errorData) {
                setError(errorData.msg || 'Archivo inválido');
                if (errorData.columnas_faltantes) {
                    toast.error(`Columnas faltantes: ${errorData.columnas_faltantes.join(', ')}`);
                }
            } else {
                toast.warning('No se pudo validar el archivo, pero puedes intentar subirlo');
            }
        } finally {
            setValidating(false);
        }
    };

    const uploadFile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setParalelosNoRegistrados([]);
        setUploadResult(null);
        
        if (!file) {
            setError('Por favor selecciona un archivo');
            setLoading(false);
            toast.error('Por favor selecciona un archivo');
            return;
        }

        if (!selectedEvaluacionId) {
            setError('Selecciona una evaluacion antes de subir el archivo');
            setLoading(false);
            toast.error('Selecciona una evaluacion antes de subir el archivo');
            return;
        }

        try {
            const response = await reporteService.uploadReporte({
                file: file,
                titulo: titulo || undefined,
                evaluacion_id: Number(selectedEvaluacionId)
            });

            const result = response.data as unknown as UploadResponse;
            setUploadResult(result);
            
            console.log('File uploaded successfully:', result);
            toast.success(`¡Reporte creado! ${result.casos_creados} casos procesados`);
            
            if (result.advertencias && result.advertencias.casos_invalidos > 0) {
                toast.warning(
                    `${result.advertencias.casos_invalidos} casos no pudieron ser procesados`,
                    { autoClose: 5000 }
                );
            }
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            
        } catch (err: any) {
            console.error('Error uploading file:', err);
            const errorMsg = err.message || 'Error al cargar el archivo';
            setError(errorMsg);
            setParalelosNoRegistrados(err.data?.paralelos_no_registrados || []);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-view">
            <Row className="g-4">
                <Col xs={12} xl={8}>
                    <Card className="surface-card page-hero border-0 h-100">
                        <Card.Body className="p-4 p-lg-5">
                            <h1 className="page-title h2 fw-bold mb-2">Subir reporte MOSS</h1>
                            <p className="text-secondary mb-0">
                                Sube un archivo Excel o CSV y asiocia el reporte a una evaluacion existente.
                            </p>
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
                                    <div className="fw-semibold text-break">{file ? file.name : 'Ninguno'}</div>
                                </div>
                                <div>
                                    <div className="text-secondary small text-uppercase fw-semibold mb-1">Estado</div>
                                    <Badge bg={validating ? 'warning' : uploadResult ? 'success' : 'secondary'} className="px-3 py-2">
                                        {validating ? 'Validando' : uploadResult ? 'Listo' : 'Pendiente'}
                                    </Badge>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12}>
                    <Card className="surface-card border-0">
                        <Card.Body className="p-4 p-lg-5">
                            <Form onSubmit={uploadFile} className="d-grid gap-4">
                                <Row className="g-4">
                                    <Col md={6}>
                                        <Form.Group controlId="evaluacion">
                                            <Form.Label className="fw-semibold">Evaluacion</Form.Label>
                                            <Form.Select
                                                value={selectedEvaluacionId}
                                                onChange={(e) => setSelectedEvaluacionId(Number(e.target.value))}
                                                disabled={loading || evaluaciones.length === 0}
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
                                                disabled={loading}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group controlId="file">
                                    <Form.Label className="fw-semibold">Archivo</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                    />
                                    <Form.Text className="text-secondary">
                                        Formatos soportados: .xlsx, .xls y .csv.
                                    </Form.Text>
                                    {validating && (
                                        <div className="d-flex align-items-center gap-2 text-warning-emphasis mt-2">
                                            <Spinner animation="border" size="sm" />
                                            <span>Validando archivo...</span>
                                        </div>
                                    )}
                                </Form.Group>

                                {error &&
                                <>
                                <Alert variant="danger" className="mb-0">{error}</Alert>
                                {paralelosNoRegistrados.length > 0 && <Alert variant="danger" className="mb-0">
                                    Paralelos no registrados:
                                    <ul>
                                        {paralelosNoRegistrados.map((paralelo, index) => (
                                            <li key={index}>{paralelo}</li>
                                        ))}
                                    </ul>
                                </Alert>}
                                </>
                                }
                                

                                {uploadResult && (
                                    <Alert variant="success" className="mb-0">
                                        <Alert.Heading className="h6 fw-bold">Carga exitosa</Alert.Heading>
                                        <div className="d-grid gap-1">
                                            <span><strong>Reporte ID:</strong> {uploadResult.reporte_id}</span>
                                            <span><strong>Casos creados:</strong> {uploadResult.casos_creados}</span>
                                            <span><strong>Filas procesadas:</strong> {uploadResult.total_filas_procesadas}</span>
                                            {uploadResult.advertencias && (
                                                <span><strong>Casos con errores:</strong> {uploadResult.advertencias.casos_invalidos}</span>
                                            )}
                                        </div>
                                    </Alert>
                                )}

                                <div className="d-flex flex-column flex-md-row gap-3 justify-content-end">
                                    <Button type="button" variant="outline-secondary" onClick={() => navigate('/dashboard')} disabled={loading}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading || !file || validating || evaluaciones.length === 0} className="fw-semibold px-4">
                                        {loading ? (
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
        </div>
    );
};

export default UploadExcel;
