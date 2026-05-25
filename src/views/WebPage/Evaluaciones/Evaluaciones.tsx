import React, { useState, useEffect } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { evaluacionesService, periodosService } from '../../../crud';
import { toast } from 'react-toastify';
import type { Evaluacion } from '../../../crud/evaluaciones';
import type { Periodo } from '../../../crud/periodos';
import CreateEvaluacionModal from './components/CreateEvaluacionModal';
import CreatePeriodoModal from './components/CreatePeriodoModal';
import UpdateEvaluacionModal from './components/UpdateEvaluacionModal';
import RequireRole from '../../../components/RequireRole';


const Evaluaciones: React.FC = () => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
    const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | ''>('');
    const [showCreatePeriodoModal, setShowCreatePeriodoModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [evaluacionToEdit, setEvaluacionToEdit] = useState<Evaluacion | null>(null);
    const [loadingPeriodos, setLoadingPeriodos] = useState(true);
    const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(false);
    const [deletingPeriodo, setDeletingPeriodo] = useState(false);
    const [togglingPeriodo, setTogglingPeriodo] = useState(false);
    const [deletingEvaluacionId, setDeletingEvaluacionId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const fetchPeriodos = async () => {
        setLoadingPeriodos(true);
        setError('');
        try {
            const response = await periodosService.listarPeriodos();
            const periodosList = response.data.periodos || [];
            setPeriodos(periodosList);
            setSelectedPeriodoId((prevSelected) => {
                if (periodosList.length === 0) {
                    return '';
                }

                if (!prevSelected || !periodosList.some((periodo) => periodo.periodo_id === prevSelected)) {
                    return periodosList[0].periodo_id;
                }

                return prevSelected;
            });
        } catch (err: any) {
            setError(err?.message || 'No fue posible cargar los periodos');
        } finally {
            setLoadingPeriodos(false);
        }
    };

    const fetchEvaluaciones = async (periodoId: number) => {
        setLoadingEvaluaciones(true);
        setError('');
        try {
            const response = await evaluacionesService.listarEvaluaciones({ periodo_id: periodoId });
            setEvaluaciones(response.data.evaluaciones || []);
        } catch (err: any) {
            setError(err?.message || 'No fue posible cargar las evaluaciones');
        } finally {
            setLoadingEvaluaciones(false);
        }
    };

    useEffect(() => {
        fetchPeriodos();
    }, []);

    useEffect(() => {
        if (selectedPeriodoId) {
            fetchEvaluaciones(selectedPeriodoId);
        } else {
            setEvaluaciones([]);
        }
    }, [selectedPeriodoId]);

    const handlePeriodoCreated = async (newPeriodoId: number) => {
        await fetchPeriodos();
        setSelectedPeriodoId(newPeriodoId);
    };

    const handleEvaluacionCreated = async () => {
        if (selectedPeriodoId) {
            await fetchEvaluaciones(selectedPeriodoId);
        }
    };

    const handleToggleEvaluacion = async (evaluacion: Evaluacion) => {
        const nextState = !(evaluacion.activo ?? false);
        const previousState = evaluacion.activo ?? false;

        setEvaluaciones((prev) =>
            prev.map((item) =>
                item.evaluacion_id === evaluacion.evaluacion_id
                    ? { ...item, activo: nextState }
                    : item
            )
        );

        try {
            const response = await evaluacionesService.toggleEstadoEvaluacion(evaluacion.evaluacion_id);
            const estadoFinal = response.data?.evaluacion?.activo ?? nextState;

            setEvaluaciones((prev) =>
                prev.map((item) =>
                    item.evaluacion_id === evaluacion.evaluacion_id
                        ? { ...item, activo: estadoFinal }
                        : item
                )
            );

            toast.success(`Evaluación ${estadoFinal ? 'activada' : 'desactivada'} correctamente`);
        } catch (err: any) {
            setEvaluaciones((prev) =>
                prev.map((item) =>
                    item.evaluacion_id === evaluacion.evaluacion_id
                        ? { ...item, activo: previousState }
                        : item
                )
            );
            setError(err?.message || 'No fue posible cambiar el estado de la evaluación');
        }
    };

    const handleOpenUpdate = (evaluacion: Evaluacion) => {
        setEvaluacionToEdit(evaluacion);
        setShowUpdateModal(true);
    };

    const handleUpdatedEvaluacion = async () => {
        if (selectedPeriodoId) {
            await fetchEvaluaciones(selectedPeriodoId);
        }
    };

    const handleDeleteEvaluacion = async (evaluacion: Evaluacion) => {
        const confirmed = window.confirm(`¿Seguro que deseas eliminar la evaluación "${evaluacion.nombre}"?`);
        if (!confirmed) {
            return;
        }

        setDeletingEvaluacionId(evaluacion.evaluacion_id);
        setError('');
        try {
            await evaluacionesService.eliminarEvaluacion(evaluacion.evaluacion_id);
            toast.success('Evaluación eliminada correctamente');

            if (selectedPeriodoId) {
                await fetchEvaluaciones(selectedPeriodoId);
            }
        } catch (err: any) {
            setError(err?.message || 'No fue posible eliminar la evaluación');
        } finally {
            setDeletingEvaluacionId(null);
        }
    };

    const handleDeletePeriodo = async () => {
        if (!selectedPeriodoId || !selectedPeriodo) {
            return;
        }

        const confirmed = window.confirm(
            `¿Seguro que deseas eliminar el período "${selectedPeriodo.nombre}"? Esta acción no se puede deshacer.`
        );
        if (!confirmed) {
            return;
        }

        setDeletingPeriodo(true);
        setError('');
        try {
            await periodosService.eliminarPeriodo(selectedPeriodoId);
            toast.success('Período eliminado correctamente');
            setEvaluaciones([]);
            await fetchPeriodos();
        } catch (err: any) {
            setError(err?.message || 'No fue posible eliminar el período');
        } finally {
            setDeletingPeriodo(false);
        }
    };

    const handleTogglePeriodo = async () => {
        if (!selectedPeriodoId || !selectedPeriodo) {
            return;
        }

        setTogglingPeriodo(true);
        setError('');
        try {
            const response = await periodosService.toggleEstadoPeriodo(selectedPeriodoId);
            const activo = response.data?.periodo?.activo;
            toast.success(`Período ${activo ? 'activado' : 'desactivado'} correctamente`);
            await fetchPeriodos();
        } catch (err: any) {
            setError(err?.message || 'No fue posible cambiar el estado del período');
        } finally {
            setTogglingPeriodo(false);
        }
    };

    const selectedPeriodo = periodos.find((periodo) => periodo.periodo_id === selectedPeriodoId);

    return (
        <RequireRole allowedRoles={[1]}>
        <Row className="g-4">
            <Col xs={12}>
                <Card className="surface-card page-hero border-0">
                    <Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                        <div>
                            <h1 className="page-title h2 fw-bold mb-2">Evaluaciones</h1>
                            {selectedPeriodo && (
                                <p className="text-secondary mb-0">
                                    Período seleccionado: <span className="fw-semibold">{selectedPeriodo.nombre}</span>
                                </p>
                            )}
                        </div>
                        <Badge bg="primary" pill className="fs-6 px-3 py-2 align-self-start align-self-lg-center">
                            {evaluaciones.length} evaluaciones
                        </Badge>
                    </Card.Body>
                </Card>
            </Col>

            {error && (
                <Col xs={12}>
                    <Alert variant="danger" className="mb-0">{error}</Alert>
                </Col>
            )}

            <Col xs={12}>
                <Card className="surface-card border-0">
                    <Card.Body className="p-4 d-grid gap-3">
                        <Row className="g-3 align-items-end">
                            <Col xs={12} xl={9}>
                                <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-end">
                                    <Form.Group className="flex-grow-1">
                                        <Form.Label className="fw-semibold mb-1">Período a visualizar</Form.Label>
                                        <Form.Select
                                            value={selectedPeriodoId}
                                            onChange={(e) => setSelectedPeriodoId(e.target.value ? Number(e.target.value) : '')}
                                            disabled={loadingPeriodos}
                                        >
                                            {periodos.map((periodo) => (
                                                <option key={periodo.periodo_id} value={periodo.periodo_id}>
                                                    {periodo.nombre}{periodo.activo ? ' (activo)' : ''}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <div className="d-flex flex-wrap align-items-center gap-3">
                                        <Form.Check
                                            type="switch"
                                            id="periodo-activo-switch"
                                            label={selectedPeriodo?.activo ? 'Período activo' : 'Período inactivo'}
                                            checked={selectedPeriodo?.activo ?? false}
                                            onChange={handleTogglePeriodo}
                                            disabled={!selectedPeriodoId || loadingPeriodos || togglingPeriodo}
                                        />
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                    <Button variant="outline-primary" onClick={() => setShowCreatePeriodoModal(true)}>
                                        Crear período
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        onClick={handleDeletePeriodo}
                                        disabled={!selectedPeriodoId || loadingPeriodos || deletingPeriodo}
                                    >
                                        {deletingPeriodo ? 'Eliminando período...' : 'Eliminar período'}
                                    </Button>
                                </div>
                                </div>
                            </Col>
                            <Col xs={12} xl={3}>
                                <div className="d-grid d-xl-flex justify-content-xl-end">
                                    <Button onClick={() => setShowCreateModal(true)} disabled={!selectedPeriodoId || loadingPeriodos}>
                                        Crear evaluación
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Col>

            <Col xs={12}>
                <Card className="surface-card border-0">
                    <Card.Body className="p-0">
                        {loadingEvaluaciones ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" />
                            </div>
                        ) : evaluaciones.length === 0 ? (
                            <div className="p-4 text-secondary">No hay evaluaciones para este período.</div>
                        ) : (
                            <Table responsive hover className="mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Fecha entrega</th>
                                        <th>Estado</th>
                                        <th className="text-end">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evaluaciones.map((evaluacion) => (
                                        <tr key={evaluacion.evaluacion_id}>
                                            <td className="fw-semibold">{evaluacion.nombre}</td>
                                            <td>{evaluacion.descripcion || '-'}</td>
                                            <td>{evaluacion.fecha_entrega ? new Date(evaluacion.fecha_entrega).toLocaleString() : '-'}</td>
                                            <td>
                                                {(evaluacion.activo ?? false) ? (
                                                    <Badge bg="success">Activa</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Inactiva</Badge>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <div className="d-inline-flex gap-2 align-items-center">
                                                    <Form.Check
                                                        type="switch"
                                                        id={`evaluacion-toggle-${evaluacion.evaluacion_id}`}
                                                        checked={evaluacion.activo ?? false}
                                                        onChange={() => handleToggleEvaluacion(evaluacion)}
                                                        label=""
                                                        className="d-inline-flex justify-content-end"
                                                    />
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenUpdate(evaluacion)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteEvaluacion(evaluacion)}
                                                        disabled={deletingEvaluacionId === evaluacion.evaluacion_id}
                                                    >
                                                        {deletingEvaluacionId === evaluacion.evaluacion_id ? 'Eliminando...' : 'Eliminar'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Col>

            <CreatePeriodoModal
                show={showCreatePeriodoModal}
                onClose={() => setShowCreatePeriodoModal(false)}
                onPeriodoCreated={handlePeriodoCreated}
            />

            <CreateEvaluacionModal
                show={showCreateModal}
                periodos={periodos}
                selectedPeriodoId={selectedPeriodoId}
                loadingPeriodos={loadingPeriodos}
                onClose={() => setShowCreateModal(false)}
                onSelectPeriodo={setSelectedPeriodoId}
                onEvaluacionCreated={handleEvaluacionCreated}
            />

            <UpdateEvaluacionModal
                show={showUpdateModal}
                evaluacion={evaluacionToEdit}
                onClose={() => {
                    setShowUpdateModal(false);
                    setEvaluacionToEdit(null);
                }}
                onUpdated={handleUpdatedEvaluacion}
            />
        </Row>
        </RequireRole>
    );
};

export default Evaluaciones;