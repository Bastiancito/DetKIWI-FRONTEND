import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { services } from '../../../../crud';
import type { Caso, ComentarioProfesor } from '../../../../crud';

interface DetallesCasoProps {
    caso: Caso;
    onClose: () => void;
    onCasoUpdated?: (casoActualizado: Caso) => void;
}

const DetallesCaso: React.FC<DetallesCasoProps> = ({ caso, onClose, onCasoUpdated }) => {
    const [detalleCaso, setDetalleCaso] = useState<Caso>(caso);
    const [comentario, setComentario] = useState('');
    const [sancionComentario, setSancionComentario] = useState('');
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [procesandoEstado, setProcesandoEstado] = useState(false);
    const [showSancionModal, setShowSancionModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const currentUser = services.auth.getCurrentUser();

    const comentariosCaso = useMemo(() => {
        const comentariosDirectos = Array.isArray(detalleCaso.comentarios_profes)
            ? detalleCaso.comentarios_profes
            : [];

        const comentariosEnMetadata = Array.isArray(detalleCaso.caso_metadata?.comentarios_profes)
            ? detalleCaso.caso_metadata.comentarios_profes
            : [];

        return (comentariosDirectos.length > 0 ? comentariosDirectos : comentariosEnMetadata) as ComentarioProfesor[];
    }, [detalleCaso]);

    useEffect(() => {
        setDetalleCaso(caso);
        setError('');
        setSuccess('');
    }, [caso]);

    const handleAgregarComentario = async () => {
        const comentarioLimpio = comentario.trim();
        if (!comentarioLimpio) {
            setError('Debes escribir un comentario antes de enviarlo.');
            return;
        }

        setEnviandoComentario(true);
        setError('');
        setSuccess('');
        try {
            const response = await services.casos.agregarComentarioCaso(detalleCaso.caso_id, comentarioLimpio);
            if (response.status === 200 || response.status === 201) {
                const nuevoComentario: ComentarioProfesor = {
                    user_id: currentUser?.id ?? currentUser?.user_id ?? 0,
                    username: currentUser?.username ?? 'usuario',
                    comentario: comentarioLimpio,
                    timestamp: new Date().toISOString(),
                };

                setDetalleCaso((prev) => {
                    const comentariosActuales = Array.isArray(prev.comentarios_profes)
                        ? prev.comentarios_profes
                        : [];

                    const comentariosBackend = Array.isArray(response.data.comentarios_profes)
                        ? response.data.comentarios_profes
                        : [];

                    return {
                        ...prev,
                        comentarios_profes: comentariosBackend.length > 0
                            ? comentariosBackend
                            : [...comentariosActuales, nuevoComentario],
                    };
                });

                const comentariosActualizados = Array.isArray(response.data.comentarios_profes)
                    ? response.data.comentarios_profes
                    : [...(detalleCaso.comentarios_profes || []), nuevoComentario];

                const updatedCaso = {
                    ...detalleCaso,
                    comentarios_profes: comentariosActualizados,
                };

                onCasoUpdated?.(updatedCaso);

                setComentario('');
                setSuccess('Comentario agregado correctamente.');
            }
        } catch (err: any) {
            setError(err.message || 'No se pudo agregar el comentario.');
        } finally {
            setEnviandoComentario(false);
        }
    };
    
    


    const handleIndultarCaso = async () => {
        setProcesandoEstado(true);
        setError('');
        setSuccess('');
        try {
            await services.casos.indultarCaso(detalleCaso.caso_id);
            const updatedCaso = { ...detalleCaso, closed: true, sancion: false };
            setDetalleCaso(updatedCaso);
            onCasoUpdated?.(updatedCaso);
            setSuccess('Caso indultado y marcado como revisado.');
        } catch (err: any) {
            setError(err.message || 'No se pudo indultar el caso.');
        } finally {
            setProcesandoEstado(false);
        }
    };

    const handleConfirmarSancion = async () => {
        const comentarioFinal = sancionComentario.trim();
        if (!comentarioFinal) {
            setError('Para sancionar el caso debes ingresar un comentario final.');
            return;
        }

        setProcesandoEstado(true);
        setError('');
        setSuccess('');
        try {
            await services.casos.sancionarCaso(detalleCaso.caso_id, comentarioFinal);
            const updatedCaso = { ...detalleCaso, closed: true, sancion: true };
            setDetalleCaso(updatedCaso);
            onCasoUpdated?.(updatedCaso);
            setSuccess('Caso sancionado y marcado como revisado.');
            setShowSancionModal(false);
            setSancionComentario('');
        } catch (err: any) {
            setError(err.message || 'No se pudo sancionar el caso.');
        } finally {
            setProcesandoEstado(false);
        }
    };

    const formatTimestamp = (value?: string) => {
        if (!value) {
            return 'Fecha no disponible';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    };

    return (
        <>
        <Modal show={true} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Detalles del caso</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <p><strong>Similitud:</strong> {detalleCaso.similitud}%</p>
                <p><strong>Lineas:</strong> {detalleCaso.lineas ?? '-'}</p>
                <p><strong>Estado:</strong> {detalleCaso.closed ? 'Resuelto' : 'Pendiente'}</p>
                <p><strong>Sancion:</strong> {detalleCaso.sancion ? 'Sancionado' : 'Sin sancion'}</p>
                <p><strong>URL MOSS:</strong> {detalleCaso.url_moss ? <a href={detalleCaso.url_moss} target="_blank" rel="noopener noreferrer">Ver en MOSS</a> : '-'}</p>
                <p><strong>Paralelos asignados:</strong></p>
                <ul>
                    {detalleCaso.paralelos?.length ? (
                        detalleCaso.paralelos.map((paralelo) => (
                            <li key={paralelo.paralelo_id}>
                                {paralelo.sigla_paralelo}{paralelo.sede_nombre ? ` · ${paralelo.sede_nombre}` : ''}
                            </li>
                        ))
                    ) : (
                        <li>No hay paralelos asociados</li>
                    )}
                </ul>
                <p><strong>Estudiantes Involucrados:</strong></p>
                <ul>
                    {detalleCaso.estudiantes?.map(estudiante => (
                        <li key={estudiante.estudiante_id}>{estudiante.nombre} {estudiante.apellido}</li>
                    )) || <li>No hay estudiantes involucrados</li>}
                </ul>
                <p><strong>Usuarios Asignados:</strong></p>
                <ul>
                    {detalleCaso.usuarios_asignados?.map(usuario => (
                        <li key={usuario.user_id}>{usuario.username} ({usuario.email})</li>
                    )) || <li>No hay usuarios asignados</li>}
                </ul>

                <hr />
                <h6 className="fw-bold mb-3">Comentarios del caso</h6>
                {comentariosCaso.length === 0 ? (
                    <p className="text-secondary">Aun no existen comentarios para este caso.</p>
                ) : (
                    <div className="mb-3">
                        {comentariosCaso.map((comentarioItem, index) => (
                            <div key={`${comentarioItem.user_id}-${comentarioItem.timestamp}-${index}`} className="border rounded p-2 mb-2 bg-light">
                                <div className="small text-secondary mb-1">
                                    Profesor #{comentarioItem.username} - {formatTimestamp(comentarioItem.timestamp)}
                                </div>
                                <div>{comentarioItem.comentario}</div>
                            </div>
                        ))}
                    </div>
                )}

                <Form.Group controlId="nuevo-comentario-caso">
                    <Form.Label>Nuevo comentario</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Escribe una observacion para este caso"
                    />
                </Form.Group>
                <Button
                    variant="outline-primary"
                    onClick={handleAgregarComentario}
                    disabled={enviandoComentario || procesandoEstado}
                >
                    {enviandoComentario ? 'Guardando comentario...' : 'Guardar comentario'}
                </Button>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="success"
                    onClick={handleIndultarCaso}
                    disabled={procesandoEstado || detalleCaso.closed}
                >
                    Indultar caso
                </Button>
                <Button
                    variant="danger"
                    onClick={() => setShowSancionModal(true)}
                    disabled={procesandoEstado || detalleCaso.closed}
                >
                    Sancionar caso
                </Button>
                <Button variant="secondary" onClick={onClose}>
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>

        <Modal show={showSancionModal} onHide={() => setShowSancionModal(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>Sancionar caso #{detalleCaso.caso_id}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="mb-2">Debes ingresar un comentario final para registrar la sancion.</p>
                <Form.Group controlId="comentario-sancion-final">
                    <Form.Label>Comentario final obligatorio</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        value={sancionComentario}
                        onChange={(e) => setSancionComentario(e.target.value)}
                        placeholder="Describe la razon de la sancion"
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={() => setShowSancionModal(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="danger"
                    onClick={handleConfirmarSancion}
                    disabled={procesandoEstado || !sancionComentario.trim()}
                >
                    {procesandoEstado ? 'Sancionando...' : 'Confirmar sancion'}
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    );
};

export default DetallesCaso;
    