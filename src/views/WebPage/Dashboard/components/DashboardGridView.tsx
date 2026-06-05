import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { services } from '../../../../crud';
import { toast } from 'react-toastify';
import './DashboardGridView.scss';

export interface SedeCardData {
    sede_id: number;
    nombre: string;
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
}

export interface ParaleloCardData {
    paralelo: string;
    paralelo_id: number;
    total_casos: number;
    total_casos_pendientes: number;
    total_casos_resueltos: number;
    usuarios_asignados?: Array<{
        user_id: number;
        username: string;
        email: string;
    }>;
    usuario?: {
        user_id: number;
        username: string;
        email?: string;
    };
}

export interface DashboardGridViewProps {
    type: 'sedes' | 'paralelos';
    evaluacionId: number;
    sedeId?: number; // Required when type is 'paralelos'
    onSedeClick?: (sede: SedeCardData) => void;
    onParaleloClick?: (paralelo: ParaleloCardData) => void;
}

const DashboardGridView: React.FC<DashboardGridViewProps> = ({ 
    type, 
    evaluacionId, 
    sedeId,
    onSedeClick,
    onParaleloClick
}) => {
    const [loading, setLoading] = useState(true);
    const [sedesData, setSedesData] = useState<any[]>([]);
    const [paralelosData, setParalelosData] = useState<ParaleloCardData[]>([]);
    const [selectedParaleloStatusFilter, setSelectedParaleloStatusFilter] = useState<'todos' | 'pendiente' | 'completado'>('todos');
    const [selectedParaleloIdFilter, setSelectedParaleloIdFilter] = useState<string>('todos');

    useEffect(() => {
        fetchData();
    }, [type, evaluacionId, sedeId]);

    useEffect(() => {
        console.log('Paralelos data:', paralelosData);
    }, [paralelosData]);

    const paralelosFiltrados = useMemo(() => {
        return paralelosData.filter((paralelo) => {
            const completado = paralelo.total_casos > 0 && paralelo.total_casos_pendientes === 0;

            if (selectedParaleloStatusFilter === 'completado' && !completado) {
                return false;
            }

            if (selectedParaleloStatusFilter === 'pendiente' && completado) {
                return false;
            }

            if (selectedParaleloIdFilter !== 'todos' && String(paralelo.paralelo_id) !== selectedParaleloIdFilter) {
                return false;
            }

            return true;
        });
    }, [paralelosData, selectedParaleloStatusFilter, selectedParaleloIdFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (type === 'sedes') {
                // Obtener sedes y stats por sede en batch desde backend (endpoint nuevo).
                const [sedesResponse, statsSedesResponse] = await Promise.all([
                    services.sedes.getAllSedes(),
                    services.casos.getStatsCasosForSedesByEvaluacionId(evaluacionId)
                ]);

                if (sedesResponse.status === 200 && statsSedesResponse.status === 200) {
                    const sedes = sedesResponse.data as any[];
                    const statsList = statsSedesResponse.data as any[];

                    const statsBySede = new Map<number, any>();
                    statsList.forEach((s: any) => statsBySede.set(s.sede_id, s));

                    const sedesWithStats = sedes.map((sede: any) => {
                        const st = statsBySede.get(sede.sede_id) || { total_casos: 0, total_casos_pendientes: 0, total_casos_resueltos: 0 };
                        return {
                            sede_id: sede.sede_id,
                            nombre: sede.nombre,
                            total_casos: st.total_casos || 0,
                            total_casos_pendientes: st.total_casos_pendientes || 0,
                            total_casos_resueltos: st.total_casos_resueltos || 0,
                        };
                    });

                    setSedesData(sedesWithStats);
                }
            } else if (type === 'paralelos' && sedeId) {
                const response = await services.casos.getStatsCasosForParalelosByEvaluacionIdAndSedeId(
                    evaluacionId,
                    sedeId
                );
                if (response.status === 200) {
                    console.log('Paralelos response:', response.data);
                    setParalelosData(response.data);
                }
            }
            setLoading(false);
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar datos del panel');
            console.error('Error cargando datos del panel:', error);
            setLoading(false);
        }
    };

    const calculatePercentage = (resolved: number, total: number): string => {
        if (total === 0) return '0';
        return ((resolved / total) * 100).toFixed(1);
    };

    const handleSedeClick = (sede: SedeCardData) => {
        if (onSedeClick) {
            onSedeClick(sede);
        }
    };

    const handleParaleloClick = (paralelo: ParaleloCardData) => {
        if (onParaleloClick) {
            onParaleloClick(paralelo);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-secondary mt-3 mb-0">Cargando estadisticas...</p>
            </div>
        );
    }

    const renderSedeCard = (sede: SedeCardData) => (
        <Col key={sede.sede_id} md={6} xl={4}>
        <Card 
            key={sede.sede_id} 
            className="dashboard-grid-card sede-card interactive-card h-100 border-0"
            onClick={() => handleSedeClick(sede)}
        >
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                    <div>
                        <h3 className="h5 fw-bold mb-1">{sede.nombre}</h3>
                        <p className="text-secondary small mb-0">Resumen de casos por sede</p>
                    </div>
                    <Badge pill bg="danger-subtle" text="danger-emphasis" className="card-type-badge">Sede</Badge>
                </div>

                <div className="stat-row">
                    <span className="stat-label">Total de casos</span>
                    <span className="stat-value">{sede.total_casos}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">Pendientes</span>
                    <span className="stat-value pending">{sede.total_casos_pendientes}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">Resueltos</span>
                    <span className="stat-value resolved">{sede.total_casos_resueltos}</span>
                </div>
                <div className="stat-row stat-highlight">
                    <span className="stat-label">Porcentaje resuelto</span>
                    <span className="stat-value">{calculatePercentage(sede.total_casos_resueltos, sede.total_casos)}%</span>
                </div>
            </Card.Body>
        </Card>
        </Col>
    );

    const renderParaleloCard = (paralelo: ParaleloCardData) => {
        console.log('Paralelo:', paralelo);
        const displayedUser = paralelo.usuario?.user_id ? paralelo.usuario : paralelo.usuarios_asignados?.[0];
        const completado = paralelo.total_casos > 0 && paralelo.total_casos_pendientes === 0;

        return (
            <Col key={paralelo.paralelo_id} md={6} xl={4}>
            <Card 
                key={paralelo.paralelo_id} 
                className="dashboard-grid-card paralelo-card interactive-card h-100 border-0"
                onClick={() => handleParaleloClick(paralelo)}
            >
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                        <div>
                            <h3 className="h5 fw-bold mb-1">{paralelo.paralelo}</h3>
                            <p className="text-secondary small mb-0">Resumen del paralelo seleccionado</p>
                        </div>
                        <Badge pill bg="info-subtle" text="info-emphasis" className="card-type-badge">Paralelo</Badge>
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Total de casos</span>
                        <span className="stat-value">{paralelo.total_casos}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Pendientes</span>
                        <span className="stat-value pending">{paralelo.total_casos_pendientes}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Resueltos</span>
                        <span className="stat-value resolved">{paralelo.total_casos_resueltos}</span>
                    </div>
                    <div className="stat-row stat-highlight">
                        <span className="stat-label">Porcentaje resuelto</span>
                        <span className="stat-value">{calculatePercentage(paralelo.total_casos_resueltos, paralelo.total_casos)}%</span>
                    </div>
                    <div className="stat-row stat-highlight">
                        <span className="stat-label">Estado del paralelo</span>
                        <span className="stat-value">
                            <Badge bg={completado ? 'success' : 'warning'} text={completado ? 'light' : 'dark'} pill>
                                {completado ? 'Completado' : 'Pendiente'}
                            </Badge>
                        </span>
                    </div>
                    {/* Mostrar solo el encargado del paralelo si está disponible en `paralelo.usuario`.
                        Si no existe, mostrar la lista `usuarios_asignados` (fallback). */}
                    {displayedUser && (
                        <div className="users-panel mt-4">
                            <span className="stat-label d-block mb-2">Usuarios asignado</span>
                            <div className="usuarios-list">
                                <Badge
                                    key={displayedUser.user_id}
                                    bg="light"
                                    text="dark"
                                    pill
                                    className="usuario-badge border"
                                    title={displayedUser.email}
                                >
                                    {displayedUser.username}
                                </Badge>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
            </Col>
        );
    };

    const noDataMessage = type === 'sedes' 
        ? 'No hay sedes disponibles'
        : 'No hay paralelos con casos en esta sede';

    return (
        <div className="dashboard-grid-view">
            {type === 'paralelos' && paralelosData.length > 0 && (
                <Row className="g-3 mb-4 align-items-end">
                    <Col xs={12} md={6} lg={4}>
                        <Form.Group controlId="filtro-paralelo-estado-dashboard">
                            <Form.Label className="fw-semibold">Filtrar estado del paralelo</Form.Label>
                            <Form.Select
                                value={selectedParaleloStatusFilter}
                                onChange={(e) => setSelectedParaleloStatusFilter(e.target.value as 'todos' | 'pendiente' | 'completado')}
                            >
                                <option value="todos">Todos</option>
                                <option value="completado">Completados</option>
                                <option value="pendiente">Pendientes</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                        <Form.Group controlId="filtro-paralelo-nombre-dashboard">
                            <Form.Label className="fw-semibold">Filtrar por paralelo</Form.Label>
                            <Form.Select
                                value={selectedParaleloIdFilter}
                                onChange={(e) => setSelectedParaleloIdFilter(e.target.value)}
                            >
                                <option value="todos">Todos los paralelos</option>
                                {paralelosData.map((paralelo) => (
                                    <option key={paralelo.paralelo_id} value={paralelo.paralelo_id}>
                                        {paralelo.paralelo}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
            )}

            {type === 'sedes' && sedesData.length > 0 && (
                <Row className="g-4">
                    {sedesData.map(renderSedeCard)}
                </Row>
            )}

            {type === 'paralelos' && paralelosFiltrados.length > 0 && (
                <Row className="g-4">
                    {paralelosFiltrados.map(renderParaleloCard)}
                </Row>
            )}

            {((type === 'sedes' && sedesData.length === 0) || 
              (type === 'paralelos' && paralelosFiltrados.length === 0)) && !loading && (
                <Card className="border-0 bg-body-tertiary text-center py-5">
                    <Card.Body>
                        <div className="display-6 mb-3">Datos no disponibles</div>
                        <p className="text-secondary mb-0">{noDataMessage}</p>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default DashboardGridView;
