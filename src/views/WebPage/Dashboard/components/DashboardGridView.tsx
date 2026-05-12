import React, { useState, useEffect } from 'react';
import { Badge, Card, Col, Row, Spinner } from 'react-bootstrap';
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
    usuarios_asignados: Array<{
        user_id: number;
        username: string;
        email: string;
    }>;
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
    const [sedesData, setSedesData] = useState<SedeCardData[]>([]);
    const [paralelosData, setParalelosData] = useState<ParaleloCardData[]>([]);

    useEffect(() => {
        fetchData();
    }, [type, evaluacionId, sedeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (type === 'sedes') {
                const sedesResponse = await services.sedes.getAllSedes();
                if (sedesResponse.status === 200) {
                    const sedesWithStats = await Promise.all(
                        sedesResponse.data.map(async (sede: any) => {
                            try {
                                const statsResponse = await services.casos.getStatsCasosBySedeIdAndEvaluacionId(
                                    sede.sede_id,
                                    evaluacionId
                                );
                                return {
                                    sede_id: sede.sede_id,
                                    nombre: sede.nombre,
                                    total_casos: statsResponse.data.total_casos || 0,
                                    total_casos_pendientes: statsResponse.data.total_casos_pendientes || 0,
                                    total_casos_resueltos: statsResponse.data.total_casos_resueltos || 0,
                                };
                            } catch (error) {
                                return {
                                    sede_id: sede.sede_id,
                                    nombre: sede.nombre,
                                    total_casos: 0,
                                    total_casos_pendientes: 0,
                                    total_casos_resueltos: 0,
                                };
                            }
                        })
                    );
                    setSedesData(sedesWithStats);
                }
            } else if (type === 'paralelos' && sedeId) {
                const response = await services.casos.getStatsCasosForParalelosByEvaluacionIdAndSedeId(
                    evaluacionId,
                    sedeId
                );
                if (response.status === 200) {
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

    const renderParaleloCard = (paralelo: ParaleloCardData) => (
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
                {paralelo.usuarios_asignados && paralelo.usuarios_asignados.length > 0 && (
                    <div className="users-panel mt-4">
                        <span className="stat-label d-block mb-2">Usuarios asignados</span>
                        <div className="usuarios-list">
                            {paralelo.usuarios_asignados.map((usuario) => (
                                <Badge 
                                    key={usuario.user_id}
                                    bg="light"
                                    text="dark"
                                    pill
                                    className="usuario-badge border"
                                    title={usuario.email}
                                >
                                    {usuario.username}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
        </Col>
    );

    const noDataMessage = type === 'sedes' 
        ? 'No hay sedes disponibles'
        : 'No hay paralelos con casos en esta sede';

    return (
        <div className="dashboard-grid-view">
            {type === 'sedes' && sedesData.length > 0 && (
                <Row className="g-4">
                    {sedesData.map(renderSedeCard)}
                </Row>
            )}

            {type === 'paralelos' && paralelosData.length > 0 && (
                <Row className="g-4">
                    {paralelosData.map(renderParaleloCard)}
                </Row>
            )}

            {((type === 'sedes' && sedesData.length === 0) || 
              (type === 'paralelos' && paralelosData.length === 0)) && !loading && (
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
