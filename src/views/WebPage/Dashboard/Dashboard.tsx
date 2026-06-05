import React, { useState, useEffect } from 'react';
import { Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { services, isEvaluacionFueraDePlazo } from '../../../crud';
import RequireRole from '../../../components/RequireRole';
import { toast } from 'react-toastify';
import DashboardGridView from './components/DashboardGridView';
import CasosTable from '../Casos/CasosTable';
import type { SedeCardData, ParaleloCardData } from './components/DashboardGridView';
import type { Caso, Evaluacion } from '../../../crud';
import './Dashboard.scss';

type DashboardLevel = 'sedes' | 'paralelos' | 'casos';

const Dashboard: React.FC = () => {
    const [currentLevel, setCurrentLevel] = useState<DashboardLevel>('sedes');
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    const [selectedSedeName, setSelectedSedeName] = useState<string>('');
    const [selectedParaleloId, setSelectedParaleloId] = useState<number | null>(null);
    const [selectedParaleloName, setSelectedParaleloName] = useState<string>('');
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<number | ''>('');
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
    const [casos, setCasos] = useState<Caso[]>([]);
    const [viewingAllCasos, setViewingAllCasos] = useState(false);
    const [loadingCasos, setLoadingCasos] = useState(false);

    const selectedEvaluacionIdValue = typeof selectedEvaluacionId === 'number' ? selectedEvaluacionId : null;
    const selectedEvaluacion = evaluaciones.find((evaluacion) => evaluacion.evaluacion_id === selectedEvaluacionId);
    const selectedEvaluacionFueraDePlazo = isEvaluacionFueraDePlazo(selectedEvaluacion?.fecha_entrega);

    useEffect(() => {
        loadEvaluaciones();
    }, []);

    useEffect(() => {
        if (currentLevel === 'casos' && selectedParaleloId && selectedEvaluacionIdValue !== null) {
            loadCasos(selectedParaleloId, selectedEvaluacionIdValue);
        }
        if (viewingAllCasos && selectedEvaluacionIdValue !== null) {
            loadAllCasosForEvaluacion(selectedEvaluacionIdValue);
        }
    }, [currentLevel, selectedParaleloId, selectedEvaluacionIdValue, viewingAllCasos]);

    const loadAllCasosForEvaluacion = async (evaluacionId: number) => {
        setLoadingCasos(true);
        try {
            const response = await services.evaluaciones.obtenerCasosEvaluacion(evaluacionId);
            if (response.status === 200) {
                const casosResp = response.data.casos || [];
                setCasos(casosResp as Caso[]);
            }
        } catch (error: any) {
            console.error('Error loading all casos:', error);
            toast.error('Error al cargar casos de la evaluación');
            setCasos([]);
        } finally {
            setLoadingCasos(false);
        }
    };

    const loadEvaluaciones = async () => {
        try {
            const response = await services.evaluaciones.listarEvaluaciones();
            if (response.status === 200) {
                setEvaluaciones(response.data.evaluaciones);
                if (response.data.evaluaciones.length > 0) {
                    setSelectedEvaluacionId(response.data.evaluaciones[0].evaluacion_id);
                } else {
                    setSelectedEvaluacionId('');
                }
            }
        } catch (error: any) {
            console.error('Error loading evaluaciones:', error);
            toast.error('Error al cargar evaluaciones');
        }
    };

    const handleSedeClick = (sede: SedeCardData) => {
        setSelectedSedeId(sede.sede_id);
        setSelectedSedeName(sede.nombre);
        setSelectedParaleloId(null);
        setCurrentLevel('paralelos');
    };

    const handleParaleloClick = (paralelo: ParaleloCardData) => {
        setSelectedParaleloId(paralelo.paralelo_id);
        setSelectedParaleloName(paralelo.paralelo);
        setCurrentLevel('casos');
    };

    const loadCasos = async (paraleloId: number, evaluacionId: number) => {
        setLoadingCasos(true);
        try {
            const response = await services.casos.getCasosByParaleloIdAndEvaluacionId(paraleloId, evaluacionId);
            if (response.status === 200) {
                setCasos(response.data.casos || []);
            }
        } catch (error: any) {
            console.error('Error loading casos:', error);
            toast.error(error.message || 'Error al cargar casos del paralelo');
            setCasos([]);
        } finally {
            setLoadingCasos(false);
        }
    };

    const handleEvaluacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEvaluacionId(e.target.value ? Number(e.target.value) : '');
        setCurrentLevel('sedes');
        setSelectedSedeId(null);
        setSelectedSedeName('');
        setSelectedParaleloId(null);
        setSelectedParaleloName('');
        setCasos([]);
    };

    const handleBackToPreviousLevel = () => {
        if (currentLevel === 'casos') {
            if (viewingAllCasos) {
                setViewingAllCasos(false);
                setCasos([]);
                setCurrentLevel('sedes');
                return;
            }

            setCurrentLevel('paralelos');
            setSelectedParaleloId(null);
            setSelectedParaleloName('');
            setCasos([]);
            return;
        }

        if (currentLevel === 'paralelos') {
            setCurrentLevel('sedes');
            setSelectedSedeId(null);
            setSelectedSedeName('');
            setSelectedParaleloId(null);
            setSelectedParaleloName('');
            setCasos([]);
        }
    };

    return (
        <RequireRole allowedRoles={[1]}>
        <div className="dashboard-view">
            <Card className="surface-card page-hero border-0 mb-4">
                <Card.Body className="p-3 p-lg-4">
                    <Row className="g-3 align-items-center">
                        <Col lg={8}>
                            <h1 className="page-title h3 fw-bold mb-0">Dashboard de casos</h1>
                        </Col>
                        <Col lg={4} className="d-flex flex-column align-items-stretch gap-2">
                            <Form.Group controlId="evaluacion-select">
                                <div className="d-flex align-items-center justify-content-between gap-2 mb-1 flex-wrap">
                                    <Form.Label className="fw-semibold mb-0">Evaluacion</Form.Label>
                                    {selectedEvaluacion && selectedEvaluacionFueraDePlazo && (
                                        <Badge bg="danger" pill>Fuera de plazo</Badge>
                                    )}
                                </div>
                                <Form.Select value={selectedEvaluacionId} onChange={handleEvaluacionChange} disabled={evaluaciones.length === 0}>
                                    {evaluaciones.length === 0 ? (
                                        <option value="">No hay evaluaciones disponibles</option>
                                    ) : (
                                        evaluaciones.map((evaluacion) => (
                                            <option key={evaluacion.evaluacion_id} value={evaluacion.evaluacion_id}>
                                                {evaluacion.nombre}
                                            </option>
                                        ))
                                    )}
                                </Form.Select>
                                {selectedEvaluacion && selectedEvaluacionFueraDePlazo && selectedEvaluacion.fecha_entrega && (
                                    <div className="small text-danger mt-1">
                                        La fecha de entrega venció el {new Date(selectedEvaluacion.fecha_entrega).toLocaleString()}.
                                    </div>
                                )}
                            </Form.Group>
                            <div className="w-100 d-flex justify-content-center">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setViewingAllCasos(true);
                                        setCurrentLevel('casos');
                                        setSelectedParaleloId(null);
                                        setSelectedParaleloName('');
                                    }}
                                >
                                    Ver todos los casos
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            

            <Card className="surface-card border-0">
                <Card.Body className="p-3 p-lg-4">
                {currentLevel === 'sedes' && (
                    <DashboardGridView
                        type="sedes"
                            evaluacionId={selectedEvaluacionIdValue ?? 0}
                        onSedeClick={handleSedeClick}
                    />
                )}

                {currentLevel === 'paralelos' && selectedSedeId && (
                    <>
                        <div className="d-flex justify-content-between align-items-center gap-3 mb-4 flex-wrap">
                            <div>
                                <h2 className="h4 fw-bold mb-1">Paralelos de {selectedSedeName}</h2>
                                <p className="text-secondary mb-0">Selecciona un paralelo para ver sus casos.</p>
                            </div>
                            <Button variant="outline-secondary" onClick={handleBackToPreviousLevel}>
                                Volver a sedes
                            </Button>
                        </div>

                        <DashboardGridView
                            type="paralelos"
                            evaluacionId={selectedEvaluacionIdValue ?? 0}
                            sedeId={selectedSedeId}
                            onParaleloClick={handleParaleloClick}
                        />
                    </>
                )}

                {currentLevel === 'casos' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center gap-3 mb-4 flex-wrap">
                            <div>
                                {viewingAllCasos ? (
                                    <>
                                        <h2 className="h4 fw-bold mb-1">Casos - Evaluación</h2>
                                        <p className="text-secondary mb-0 d-flex flex-wrap align-items-center gap-2">
                                            <span>Evaluación seleccionada: {selectedEvaluacion?.nombre || ''}</span>
                                            {selectedEvaluacionFueraDePlazo && <Badge bg="danger" pill>Fuera de plazo</Badge>}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="h4 fw-bold mb-1">Casos del paralelo {selectedParaleloName}</h2>
                                        <p className="text-secondary mb-0">Sede: {selectedSedeName}</p>
                                    </>
                                )}
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                                {viewingAllCasos ? (
                                    <Button variant="secondary" onClick={handleBackToPreviousLevel}>
                                        Volver
                                    </Button>
                                ) : (
                                    <Button variant="outline-secondary" onClick={handleBackToPreviousLevel}>
                                        Volver a paralelos
                                    </Button>
                                )}
                            </div>
                        </div>

                        {loadingCasos ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="text-secondary mt-3 mb-0">Cargando casos...</p>
                            </div>
                        ) : (
                            <CasosTable
                                casos={casos}
                                enableParaleloFilter={viewingAllCasos}
                                emptyMessage={viewingAllCasos ? "No hay casos para la evaluación seleccionada." : "No hay casos para este paralelo en la evaluación seleccionada."}
                            />
                        )}
                    </>
                )}
                </Card.Body>
            </Card>
        </div>
        </RequireRole>
    );
};

export default Dashboard;

