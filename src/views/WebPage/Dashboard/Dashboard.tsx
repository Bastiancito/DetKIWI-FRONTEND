import React, { useState, useEffect } from 'react';
import { Breadcrumb, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { services } from '../../../crud';
import { toast } from 'react-toastify';
import DashboardGridView from './components/DashboardGridView';
import CasosTable from '../Casos/CasosTable';
import type { SedeCardData, ParaleloCardData } from './components/DashboardGridView';
import type { Caso } from '../../../crud';
import './Dashboard.scss';

type DashboardLevel = 'sedes' | 'paralelos' | 'casos';

interface BreadcrumbItem {
    label: string;
    level: DashboardLevel;
    sedeId?: number;
    paraleloId?: number;
}

const Dashboard: React.FC = () => {
    const [currentLevel, setCurrentLevel] = useState<DashboardLevel>('sedes');
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    const [selectedSedeName, setSelectedSedeName] = useState<string>('');
    const [selectedParaleloId, setSelectedParaleloId] = useState<number | null>(null);
    const [selectedParaleloName, setSelectedParaleloName] = useState<string>('');
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<number>(1); // Default evaluación
    const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
    const [casos, setCasos] = useState<Caso[]>([]);
    const [loadingCasos, setLoadingCasos] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
        { label: 'Sedes', level: 'sedes' }
    ]);

    useEffect(() => {
        loadEvaluaciones();
    }, []);

    useEffect(() => {
        if (currentLevel === 'casos' && selectedParaleloId) {
            loadCasos(selectedParaleloId, selectedEvaluacionId);
        }
    }, [currentLevel, selectedParaleloId, selectedEvaluacionId]);

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
        setBreadcrumbs([
            { label: 'Sedes', level: 'sedes' },
            { label: sede.nombre, level: 'paralelos', sedeId: sede.sede_id }
        ]);
    };

    const handleParaleloClick = (paralelo: ParaleloCardData) => {
        setSelectedParaleloId(paralelo.paralelo_id);
        setSelectedParaleloName(paralelo.paralelo);
        setCurrentLevel('casos');
        setBreadcrumbs([
            { label: 'Sedes', level: 'sedes' },
            { label: selectedSedeName, level: 'paralelos', sedeId: selectedSedeId || undefined },
            {
                label: paralelo.paralelo,
                level: 'casos',
                sedeId: selectedSedeId || undefined,
                paraleloId: paralelo.paralelo_id,
            }
        ]);
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

    const handleBreadcrumbClick = (item: BreadcrumbItem) => {
        if (item.level === 'sedes') {
            setCurrentLevel('sedes');
            setSelectedSedeId(null);
            setSelectedSedeName('');
            setSelectedParaleloId(null);
            setSelectedParaleloName('');
            setCasos([]);
            setBreadcrumbs([{ label: 'Sedes', level: 'sedes' }]);
        } else if (item.level === 'paralelos' && item.sedeId) {
            setCurrentLevel('paralelos');
            setSelectedSedeId(item.sedeId);
            setSelectedParaleloId(null);
            setSelectedParaleloName('');
            setCasos([]);
            setBreadcrumbs([
                { label: 'Sedes', level: 'sedes' },
                { label: item.label, level: 'paralelos', sedeId: item.sedeId }
            ]);
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
        setBreadcrumbs([{ label: 'Sedes', level: 'sedes' }]);
    };

    return (
        <div className="dashboard-view">
            <Card className="surface-card page-hero border-0 mb-4">
                <Card.Body className="p-4 p-lg-5">
                    <Row className="g-4 align-items-end">
                        <Col lg={8}>
                            <h1 className="page-title h2 fw-bold mb-2">Dashboard de casos</h1>
                        </Col>
                        <Col lg={4}>
                            <Form.Group controlId="evaluacion-select">
                                <Form.Label className="fw-semibold">Evaluacion</Form.Label>
                                <Form.Select value={selectedEvaluacionId} onChange={handleEvaluacionChange}>
                                    {evaluaciones.map((evaluacion) => (
                                        <option key={evaluacion.evaluacion_id} value={evaluacion.evaluacion_id}>
                                            {evaluacion.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="surface-card border-0 mb-4">
                <Card.Body className="py-3">
                    <Breadcrumb className="mb-0 app-breadcrumb">
                        {breadcrumbs.map((item, index) => (
                            <Breadcrumb.Item
                                key={`${item.label}-${index}`}
                                active={index === breadcrumbs.length - 1}
                                linkAs="button"
                                onClick={() => index !== breadcrumbs.length - 1 && handleBreadcrumbClick(item)}
                            >
                                {item.label}
                            </Breadcrumb.Item>
                        ))}
                    </Breadcrumb>
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
                    <DashboardGridView
                        type="paralelos"
                        evaluacionId={selectedEvaluacionId}
                        sedeId={selectedSedeId}
                        onParaleloClick={handleParaleloClick}
                    />
                )}

                {currentLevel === 'casos' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center gap-3 mb-4 flex-wrap">
                            <div>
                                <h2 className="h4 fw-bold mb-1">Casos del paralelo {selectedParaleloName}</h2>
                                <p className="text-secondary mb-0">Sede: {selectedSedeName}</p>
                            </div>
                            <Button onClick={() => handleBreadcrumbClick({ label: selectedSedeName, level: 'paralelos', sedeId: selectedSedeId || undefined })}>
                                Volver a paralelos
                            </Button>
                        </div>

                        {loadingCasos ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="text-secondary mt-3 mb-0">Cargando casos...</p>
                            </div>
                        ) : (
                            <CasosTable
                                casos={casos}
                                emptyMessage="No hay casos para este paralelo en la evaluación seleccionada."
                            />
                        )}
                    </>
                )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default Dashboard;

