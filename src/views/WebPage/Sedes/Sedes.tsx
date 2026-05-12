import { useState, useEffect } from "react";
import { Alert, Badge, Card, Col, ListGroup, Row, Spinner } from 'react-bootstrap';
import sedesService from '../../../crud/sedes'
import type { Sede } from '../interfaces';

const Sedes: React.FC = () => {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSedes = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await sedesService.getAllSedes();
                if (response.status === 200) {
                    setSedes(response.data as unknown as Sede[]);
                } else {
                    setError(response.message || 'No fue posible cargar las sedes');
                }
            } catch (error) {
                console.error('Error al obtener sedes:', error);
                setError('No fue posible cargar las sedes');
            } finally {
                setLoading(false);
            }
        };
        fetchSedes();
    }, []);

    return(
        <div className="w-100">
            <Row className="g-4">
                <Col xs={12}>
                    <Card className="surface-card page-hero border-0">
                        <Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                            <div>
                                <h1 className="page-title h2 fw-bold mb-2">Sedes registradas</h1>
                            </div>
                            <Badge bg="primary" pill className="fs-6 px-3 py-2 align-self-start align-self-lg-center">
                                {sedes.length} sedes
                            </Badge>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12}>
                    <Card className="surface-card border-0">
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="text-secondary mt-3 mb-0">Cargando sedes...</p>
                                </div>
                            ) : error ? (
                                <Alert variant="danger" className="m-4 mb-0">{error}</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {sedes.map((sede) => (
                                        <ListGroup.Item key={sede.sede_id} className="d-flex align-items-center justify-content-between px-4 py-3">
                                            <div>
                                                <div className="fw-semibold">{sede.nombre}</div>
                                                <small className="text-secondary">ID {sede.sede_id}</small>
                                            </div>
                                            <Badge bg="light" text="dark" pill>Activa</Badge>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Sedes;