import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { services } from '../../../crud';
import RequireRole from '../../../components/RequireRole';
import { toast } from 'react-toastify';
import DashboardGridView from './components/DashboardGridView';
import CasosTable from '../Casos/CasosTable';
import type { SedeCardData, ParaleloCardData } from './components/DashboardGridView';
import type { Caso } from '../../../crud';
import './Dashboard.scss';

type DashboardLevel = 'sedes' | 'paralelos' | 'casos';

const Dashboard: React.FC = () => {
    const [currentLevel, setCurrentLevel] = useState<DashboardLevel>('sedes');
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    const [selectedSedeName, setSelectedSedeName] = useState<string>('');
    const [selectedParaleloId, setSelectedParaleloId] = useState<number | null>(null);
    const [selectedParaleloName, setSelectedParaleloName] = useState<string>('');
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<number>(1); // Default evaluación
    const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
    const [casos, setCasos] = useState<Caso[]>([]);
    const [viewingAllCasos, setViewingAllCasos] = useState(false);
    const [paraleloFilterOptions, setParaleloFilterOptions] = useState<string[]>([]);
    const [selectedParaleloFilter, setSelectedParaleloFilter] = useState<string>('');
    const [loadingCasos, setLoadingCasos] = useState(false);

    useEffect(() => {
        loadEvaluaciones();
    }, []);

    useEffect(() => {
        if (currentLevel === 'casos' && selectedParaleloId) {
            loadCasos(selectedParaleloId, selectedEvaluacionId);
        }
        if (viewingAllCasos) {
            loadAllCasosForEvaluacion(selectedEvaluacionId);
        }
    }, [currentLevel, selectedParaleloId, selectedEvaluacionId, viewingAllCasos]);

    const loadAllCasosForEvaluacion = async (evaluacionId: number) => {
        setLoadingCasos(true);
        try {
            const response = await services.evaluaciones.obtenerCasosEvaluacion(evaluacionId);
            if (response.status === 200) {
                const casosResp = response.data.casos || [];
                setCasos(casosResp as Caso[]);

                const paralelosSet = new Set<string>();
                casosResp.forEach((c: Caso) => {
                    const paralelosCaso = c.paralelos || [];
                    if (paralelosCaso.length === 0) {
                        paralelosSet.add('Sin paralelo');
                        return;
                    }

                    paralelosCaso.forEach((p) => {
                        if (p?.sigla_paralelo) {
                            paralelosSet.add(p.sigla_paralelo);
                        }
                    });
                });
                setParaleloFilterOptions(Array.from(paralelosSet).sort());
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
            if (response.status === 200 && response.data.evaluaciones.length > 0) {
                setEvaluaciones(response.data.evaluaciones);
                setSelectedEvaluacionId(response.data.evaluaciones[0].evaluacion_id);
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
        setSelectedEvaluacionId(Number(e.target.value));
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
                setSelectedParaleloFilter('');
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
                                <Form.Label className="fw-semibold mb-1">Evaluacion</Form.Label>
                                <Form.Select value={selectedEvaluacionId} onChange={handleEvaluacionChange}>
                                    {evaluaciones.map((evaluacion) => (
                                        <option key={evaluacion.evaluacion_id} value={evaluacion.evaluacion_id}>
                                            {evaluacion.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
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
                        evaluacionId={selectedEvaluacionId}
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
                            evaluacionId={selectedEvaluacionId}
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
                                        <p className="text-secondary mb-0">Evaluación seleccionada: {evaluaciones.find(e => e.evaluacion_id === selectedEvaluacionId)?.nombre || ''}</p>
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
                                    <>
                                        <Form.Select
                                            aria-label="Filtrar por paralelo"
                                            value={selectedParaleloFilter}
                                            onChange={(e) => setSelectedParaleloFilter(e.target.value)}
                                        >
                                            <option value="">Todos los paralelos</option>
                                            {paraleloFilterOptions.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </Form.Select>
                                        <Button variant="secondary" onClick={handleBackToPreviousLevel}>
                                            Volver
                                        </Button>
                                    </>
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
                                casos={selectedParaleloFilter ? casos.filter((c: any) => {
                                    const paralelosCaso = c.paralelos || [];
                                    if (paralelosCaso.length === 0) {
                                        return selectedParaleloFilter === 'Sin paralelo';
                                    }
                                    return paralelosCaso.some((p: any) => p.sigla_paralelo === selectedParaleloFilter);
                                }) : casos}
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

