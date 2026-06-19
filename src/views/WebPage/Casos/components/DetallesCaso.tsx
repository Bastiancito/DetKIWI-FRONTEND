import React, { useEffect, useMemo, useState } from "react";
import { Accordion, Alert, Badge, Button, Form, Modal } from "react-bootstrap";
import { services } from '../../../../crud';
import type { Caso, ComentarioProfesor } from '../../../../crud';
import { getErrorMessage, isSuccessfulResponse } from '../../../../crud/responseHelpers';

interface DetallesCasoProps {
    caso: Caso;
    onClose: () => void;
    onCasoUpdated?: (casoActualizado: Caso) => void;
}

const DetallesCaso: React.FC<DetallesCasoProps> = ({ caso, onClose, onCasoUpdated }) => {
    const [detalleCaso, setDetalleCaso] = useState<Caso>(caso);
    const [comentario, setComentario] = useState('');
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [descripcionSancion, setDescripcionSancion] = useState<string>('');
    const [selectedAsignadoDetalle, setSelectedAsignadoDetalle] = useState<{
        user_id: number;
        username: string;
        email?: string;
        motivo?: string | null;
        descripcion?: string | null;
    } | null>(null);
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [procesandoEstado, setProcesandoEstado] = useState(false);
    const [showSancionModal, setShowSancionModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const currentUser = services.auth.getCurrentUser();
    const currentUserId = Number(currentUser?.id ?? currentUser?.user_id ?? 0) || null;
    const isCoordinator = currentUser?.rol_id === 1;

    const buildReasonPayload = () => {
        if (currentUserId === null) {
            return undefined;
        }

        const reasonSelected = selectedReason.trim();
        const descripcionTrim = descripcionSancion.trim();

        if (!reasonSelected && !descripcionTrim) {
            return undefined;
        }

        return {
            [String(currentUserId)]: {
                motivo: reasonSelected || descripcionTrim,
                descripcion: descripcionTrim || reasonSelected,
            },
        };
    };

    useEffect(() => {
        let isActive = true;

        setDetalleCaso(caso);
        setError('');
        const refrescarDetalle = async () => {
            try {
                const response = await services.casos.getCasoDetalle(caso.caso_id);
                if (!isSuccessfulResponse(response)) {
                    throw new Error('No fue posible cargar el detalle del caso');
                }

                if (isActive) {
                    setDetalleCaso(response.data);
                }
            } catch (err) {
                if (isActive) {
                    setError(getErrorMessage(err, 'No fue posible cargar el detalle del caso'));
                }
            }
        };

        void refrescarDetalle();

        return () => {
            isActive = false;
        };
    }, [caso.caso_id]);

    // Listen for global caso updates so an open modal updates in real-time
    useEffect(() => {
        const handler = (ev: any) => {
            const updated = ev?.detail;
            if (!updated || !updated.caso_id) return;
            if (updated.caso_id !== detalleCaso.caso_id) return;
            console.log('[DetallesCaso] evento global caso:updated recibido, aplicando cambios locales', updated);
            setDetalleCaso((prev) => ({ ...prev, ...(updated as Partial<Caso>) }));
        };

        window.addEventListener('caso:updated', handler as EventListener);
        return () => window.removeEventListener('caso:updated', handler as EventListener);
    }, [detalleCaso.caso_id]);

    // Listen for sancion changes from CasosSancionados and refresh if needed
    useEffect(() => {
        const handler = async (ev: any) => {
            const detail = ev?.detail;
            if (!detail) return;
            const casoId = detail.caso_id ?? null;

            // Only refresh if this sancion change is for a different caso (not the one being viewed from DetallesCaso)
            if (!casoId || casoId !== detalleCaso.caso_id) return;

            try {
                console.log('[DetallesCaso] sancion:changed para caso', casoId, '- refrescando...');
                const resp = await services.casos.getCasoDetalle(Number(casoId));
                if (resp && resp.status >= 200 && resp.status < 300 && resp.data) {
                    const updated = resp.data as Caso;
                    console.log('[DetallesCaso] caso refrescado desde API', updated.caso_id);
                    setDetalleCaso(updated);
                }
            } catch (err) {
                console.warn('[DetallesCaso] error refrescando caso en sancion:changed', err);
            }
        };

        window.addEventListener('sancion:changed', handler as EventListener);
        return () => window.removeEventListener('sancion:changed', handler as EventListener);
    }, [detalleCaso.caso_id]);

    const usuariosAsignados = detalleCaso.usuarios_asignados || [];
    const totalUsuariosAsignados = detalleCaso.cantidad_usuarios_asignados ?? usuariosAsignados.length;
    const decisionesProfes = detalleCaso.decisiones_profes || {};
    const casoYaSancionado = detalleCaso.sancion === true;
    const currentUserAssignment = currentUserId !== null
        ? usuariosAsignados.find((usuario) => usuario.user_id === currentUserId)
        : undefined;
    const coordinatorForceOnlyMode = isCoordinator && !!currentUserAssignment && usuariosAsignados.length > 1;

    const getDecisionForUser = (userId: number): boolean | undefined => {
        const decision = decisionesProfes[String(userId)];
        return typeof decision === 'boolean' ? decision : undefined;
    };

    const getReasonForUser = (userId: number) => {
        let sourceRaw = detalleCaso.reason ?? detalleCaso.motivo_sancion;
        if (!sourceRaw) {
            return { motivo: null, descripcion: null };
        }

        // If source is a JSON string that contains a mapping, try to parse it
        if (typeof sourceRaw === 'string') {
            const trimmed = sourceRaw.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    sourceRaw = parsed;
                } catch (err) {
                    // keep as string fallback
                    return { motivo: sourceRaw, descripcion: detalleCaso.descripcion_sancion ?? null };
                }
            } else {
                return { motivo: sourceRaw, descripcion: detalleCaso.descripcion_sancion ?? null };
            }
        }

        // At this point sourceRaw is expected to be an object mapping userId -> { motivo, descripcion }
        const entry = (sourceRaw as any)[String(userId)] ?? null;
        if (!entry) {
            return { motivo: null, descripcion: null };
        }

        return {
            motivo: entry.motivo ?? null,
            descripcion: entry.descripcion ?? detalleCaso.descripcion_sancion ?? null,
        };
    };

    const resolverDecision = (casoBase: Pick<Caso, 'usuarios_asignados' | 'decisiones_profes'>) => {
        const usuarios = casoBase.usuarios_asignados || [];
        const decisiones = casoBase.decisiones_profes || {};
        const votos = usuarios.map((usuario) => decisiones[String(usuario.user_id)]);
        const votosConValor = votos.filter((value): value is boolean => typeof value === 'boolean');
        const votosUnicos = new Set(votosConValor);
        const hayPendientes = votos.some((value) => value === undefined);
        const allVoted = votos.length > 0 && votos.every((value) => typeof value === 'boolean');

        return {
            votos,
            votosConValor,
            votosUnicos,
            hayPendientes,
            allVoted,
            consensoSancion: allVoted && votosUnicos.size === 1 && votosConValor[0] === true,
            consensoIndulto: allVoted && votosUnicos.size === 1 && votosConValor[0] === false,
            hayVotos: votosConValor.length > 0,
            hayVotosDistintos: votosConValor.length > 0 && votosUnicos.size > 1,
        };
    };

    const assignedIds = useMemo(() => usuariosAsignados.map((usuario) => usuario.user_id), [usuariosAsignados]);

    const decisionState = useMemo(() => resolverDecision(detalleCaso), [detalleCaso]);

    const casoCerradoPorConsenso = decisionState.consensoSancion || decisionState.consensoIndulto;
    const casoSancionadoPorConsenso = decisionState.consensoSancion || casoYaSancionado;
    const decisionSummary = useMemo(() => {
        // If the backend marked the case as closed, only show it as
        // "Cerrado y sancionado" / "Cerrado e indultado" when there
        // is consensus among the assigned users (or when there's <=1 assigned).
        if (detalleCaso.closed) {
            if (assignedIds.length <= 1) {
                return detalleCaso.sancion
                    ? { label: 'Cerrado y sancionado', bg: 'danger', text: 'light' as const }
                    : { label: 'Cerrado e indultado', bg: 'success', text: 'light' as const };
            }

            if (decisionState.allVoted && decisionState.votosUnicos.size === 1) {
                const decisionUnica = decisionState.votosConValor[0];
                return decisionUnica
                    ? { label: 'Cerrado y sancionado', bg: 'danger', text: 'light' as const }
                    : { label: 'Cerrado e indultado', bg: 'success', text: 'light' as const };
            }

            // If closed but no consensus found, fall through to show pending/desacuerdo state below.
        }

        if (usuariosAsignados.length === 0) {
            return { label: 'Pendiente de votacion', bg: 'warning', text: 'dark' as const };
        }

        if (decisionState.hayVotosDistintos) {
            return { label: 'Pendiente de consenso', bg: 'warning', text: 'dark' as const };
        }

        if (decisionState.hayVotos && !decisionState.hayPendientes && decisionState.votosUnicos.size === 1) {
            const decisionUnica = decisionState.votosConValor[0];
            return decisionUnica
                ? { label: 'Consenso para sancion', bg: 'danger', text: 'light' as const }
                : { label: 'Consenso para indulto', bg: 'success', text: 'light' as const };
        }

        if (decisionState.hayVotos) {
            return { label: 'Pendiente de consenso', bg: 'warning', text: 'dark' as const };
        }

        return { label: 'Pendiente de votacion', bg: 'warning', text: 'dark' as const };
    }, [detalleCaso.closed, detalleCaso.sancion, decisionState, usuariosAsignados]);

    const comentariosCaso = useMemo(() => {
        const comentariosDirectos = Array.isArray(detalleCaso.comentarios_profes)
            ? detalleCaso.comentarios_profes
            : [];

        const comentariosEnMetadata = Array.isArray(detalleCaso.caso_metadata?.comentarios_profes)
            ? detalleCaso.caso_metadata.comentarios_profes
            : [];

        return (comentariosDirectos.length > 0 ? comentariosDirectos : comentariosEnMetadata) as ComentarioProfesor[];
    }, [detalleCaso]);

    const renderDecisionBadge = (decision?: boolean) => {
        if (decision === true) {
            return <Badge bg="danger" pill>Sanciona</Badge>;
        }

        if (decision === false) {
            return <Badge bg="success" pill>Indulta</Badge>;
        }

        return <Badge bg="secondary" pill>Sin decision aun</Badge>;
    };

    const handleClickAsignado = (usuario: { user_id: number; username: string; email?: string }) => {
        const decision = getDecisionForUser(usuario.user_id);
        if (decision !== true) {
            return;
        }

        const reason = getReasonForUser(usuario.user_id);
        setSelectedAsignadoDetalle({
            ...usuario,
            motivo: reason.motivo,
            descripcion: reason.descripcion,
        });
    };

    const emitirEventoCasoActualizado = (casoActualizado: Caso) => {
        // Emitir evento para que CasosTable y otros componentes se actualicen en tiempo real
        const event = new CustomEvent('caso:updated', { detail: casoActualizado });
        window.dispatchEvent(event);
        console.log('[DetallesCaso] evento caso:updated disparado para caso', casoActualizado.caso_id);
    };

    const aplicarCasoBackendEnModal = (casoBackend: Caso) => {
        const mergedCaso = {
            ...detalleCaso,
            ...casoBackend,
        };

        setDetalleCaso(mergedCaso);
        onCasoUpdated?.(mergedCaso);
        
        // Emitir evento para que CasosTable se actualice
        emitirEventoCasoActualizado(mergedCaso);
        
        return mergedCaso;
    };

    const registrarDecisionLocal = (decision: boolean) => {
        if (currentUserId === null) {
            return;
        }

        const updatedCaso = {
            ...detalleCaso,
            decisiones_profes: {
                ...(detalleCaso.decisiones_profes || {}),
                [String(currentUserId)]: decision,
            },
        };

        setDetalleCaso(updatedCaso);
        onCasoUpdated?.(updatedCaso);
    };

    const actualizarDecisionOptimista = (decision: boolean) => {
        registrarDecisionLocal(decision);
    };

    const handleAgregarComentario = async () => {
        const comentarioLimpio = comentario.trim();
        if (!comentarioLimpio) {
            setError('Debes escribir un mensaje antes de enviarlo.');
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

                const comentariosActuales = Array.isArray(detalleCaso.comentarios_profes)
                    ? detalleCaso.comentarios_profes
                    : [];

                const comentariosBackend = Array.isArray(response.data.comentarios_profes)
                    ? response.data.comentarios_profes
                    : [];

                const comentariosActualizados = comentariosBackend.length > 0
                    ? comentariosBackend
                    : [...comentariosActuales, nuevoComentario];

                const updatedCaso = {
                    ...detalleCaso,
                    comentarios_profes: comentariosActualizados,
                };

                setDetalleCaso(updatedCaso);
                onCasoUpdated?.(updatedCaso);

                setComentario('');
                setSuccess('Mensaje agregado correctamente.');
            }
        } catch (err: any) {
            setError(err.message || 'No se pudo agregar el mensaje.');
        } finally {
            setEnviandoComentario(false);
        }
    };

    const handleIndultarCaso = async () => {
        if (casoCerradoPorConsenso) {
            setError('El caso ya quedó resuelto por consenso y no se puede cambiar la opinión desde esta vista.');
            return;
        }

        setProcesandoEstado(true);
        setError('');
        setSuccess('');
        try {
            const currentDecisionLocal = detalleCaso.decisiones_profes ? detalleCaso.decisiones_profes[String(currentUserId)] : undefined;
            const shouldCambiarOpinion = detalleCaso.in_process === true && currentDecisionLocal === true;

            if (!coordinatorForceOnlyMode) {
                actualizarDecisionOptimista(false);
            }

            const payload: any = shouldCambiarOpinion ? { sancion: false } : { reason: null };
            const response = coordinatorForceOnlyMode
                ? await services.casos.postForzarIndulto(detalleCaso.caso_id, payload)
                : shouldCambiarOpinion
                    ? await services.casos.postCambiarOpinion(detalleCaso.caso_id, payload)
                    : await services.casos.postIndultarCaso(detalleCaso.caso_id, payload);

            const backendCaso = (response.data as any)?.caso ?? response.data;
            if (backendCaso && typeof backendCaso === 'object') {
                const mergedCaso = aplicarCasoBackendEnModal(backendCaso as Caso);
                const mergedDecision = resolverDecision(mergedCaso);

                if (mergedDecision.consensoSancion) {
                    setSuccess('Caso sancionado por consenso.');
                } else if (mergedDecision.consensoIndulto) {
                    setSuccess('Caso indultado por consenso.');
                } else {
                    setSuccess((backendCaso as Caso).closed
                        ? 'Caso indultado y cerrado.'
                        : coordinatorForceOnlyMode
                            ? 'Indulto forzado enviado. El backend sigue procesando la resolucion.'
                            : 'Decision de indulto registrada. El caso sigue pendiente de consenso.');
                }
            } else {
                setSuccess(coordinatorForceOnlyMode
                    ? 'Indulto forzado enviado. El backend sigue procesando la resolucion.'
                    : 'Decision de indulto registrada. El caso sigue pendiente de consenso.');
            }
        } catch (err: any) {
            setError(err.message || getErrorMessage(err, 'No se pudo indultar el caso.'));
        } finally {
            setProcesandoEstado(false);
        }
    };

    const handleConfirmarSancion = async () => {
        if (casoCerradoPorConsenso) {
            setError('El caso ya quedó resuelto por consenso y no se puede cambiar la opinión desde esta vista.');
            return;
        }

        if (!currentUserPuedeSancionar) {
            setError('Ya registraste sanción. Solo puedes cambiar tu decisión a indulto.');
            return;
        }

        const reasonSelected = selectedReason.trim();
        if (!reasonSelected) {
            setError('Para sancionar el caso debes seleccionar una razón.');
            return;
        }

        setProcesandoEstado(true);
        setError('');
        setSuccess('');
        try {
            const reasonPayload = buildReasonPayload();

            if (!coordinatorForceOnlyMode) {
                actualizarDecisionOptimista(true);
            }

            const payload: any = reasonPayload ? { sancion: true, reason: reasonPayload } : { sancion: true };
            const currentDecisionLocal = detalleCaso.decisiones_profes ? detalleCaso.decisiones_profes[String(currentUserId)] : undefined;
            const response = detalleCaso.in_process === true && currentDecisionLocal === false
                ? await services.casos.postCambiarOpinion(detalleCaso.caso_id, payload)
                : coordinatorForceOnlyMode
                    ? await services.casos.postForzarSancion(detalleCaso.caso_id, payload)
                    : await services.casos.postSancionarCaso(detalleCaso.caso_id, payload);

            const backendCaso2 = (response.data as any)?.caso ?? response.data;
            if (backendCaso2 && typeof backendCaso2 === 'object') {
                const mergedCaso = aplicarCasoBackendEnModal(backendCaso2 as Caso);
                const mergedDecision = resolverDecision(mergedCaso);

                if (mergedDecision.consensoSancion) {
                    setSuccess('Caso sancionado por consenso.');
                } else if (mergedDecision.consensoIndulto) {
                    setSuccess('Caso indultado por consenso.');
                } else {
                    setSuccess((backendCaso2 as Caso).closed
                        ? 'Caso sancionado y cerrado.'
                        : coordinatorForceOnlyMode
                            ? 'Sancion forzada enviada. El backend sigue procesando la resolucion.'
                            : 'Decision de sancion registrada. El caso sigue pendiente de consenso.');
                }
            } else {
                setSuccess(coordinatorForceOnlyMode
                    ? 'Sancion forzada enviada. El backend sigue procesando la resolucion.'
                    : 'Decision de sancion registrada. El caso sigue pendiente de consenso.');
            }
            setShowSancionModal(false);
            setSelectedReason('');
            setDescripcionSancion('');
        } catch (err: any) {
            setError(err.message || getErrorMessage(err, 'No se pudo sancionar el caso.'));
        } finally {
            setProcesandoEstado(false);
        }
    };

    useEffect(() => {
        if (showSancionModal) {
            const reasonSource = detalleCaso.reason ?? detalleCaso.motivo_sancion;
            const currentUserReason = currentUserId !== null && reasonSource && typeof reasonSource !== 'string'
                ? (reasonSource as Record<string, { motivo?: string; descripcion?: string }>)[String(currentUserId)]
                : null;

            if (reasonSource) {
                if (typeof reasonSource === 'string') {
                    setSelectedReason(reasonSource);
                    setDescripcionSancion('');
                } else if (currentUserReason) {
                    setSelectedReason(currentUserReason.motivo ?? '');
                    setDescripcionSancion(currentUserReason.descripcion ?? '');
                } else {
                    setSelectedReason('');
                    setDescripcionSancion('');
                }
            } else {
                setSelectedReason('');
                setDescripcionSancion('');
            }
            setError('');
            setSuccess('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSancionModal]);

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

    const renderMensajesCaso = () => (
        <Accordion className="mb-3">
            <Accordion.Item eventKey="0">
                <Accordion.Header>Mensajes del caso ({comentariosCaso.length})</Accordion.Header>
                <Accordion.Body>
                    {comentariosCaso.length === 0 ? (
                        <p className="text-secondary mb-0">Aun no existen mensajes para este caso.</p>
                    ) : (
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                            {comentariosCaso.map((comentarioItem, index) => {
                                const decision = getDecisionForUser(Number(comentarioItem.user_id));

                                return (
                                    <div
                                        key={`${comentarioItem.user_id}-${comentarioItem.timestamp}-${index}`}
                                        className="border rounded p-3 bg-light"
                                    >
                                        <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                                            <div>
                                                <div className="fw-semibold">{comentarioItem.username}</div>
                                                <div className="small text-secondary">{formatTimestamp(comentarioItem.timestamp)}</div>
                                            </div>
                                            {renderDecisionBadge(decision)}
                                        </div>
                                        <div>{comentarioItem.comentario}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );

    const isDetalleInProcess = (val: any): boolean => {
        return val === true || val === 1 || val === '1' || (typeof val === 'string' && val.toLowerCase() === 'true');
    };

    const currentUserDecision = currentUserId !== null ? getDecisionForUser(currentUserId) : undefined;
    const currentUserYaSanciono = currentUserDecision === true;
    const currentUserPuedeSancionar = !casoCerradoPorConsenso && !detalleCaso.closed && currentUserDecision !== true;

    return (
        <>
        <Modal show={true} onHide={onClose} size="lg" scrollable>
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2 flex-wrap">
                    <span>Detalles del caso</span>
                    {isCoordinator && <Badge bg="primary" pill>Coordinador</Badge>}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {coordinatorForceOnlyMode && (
                    <Alert variant="info" className="mb-3">
                        Eres coordinador y estás asignado junto con más de un revisor. En este caso no puedes votar; solo puedes forzar la sancion o el indulto.
                    </Alert>
                )}

                {casoCerradoPorConsenso && (
                    <Alert variant="warning" className="mb-3">
                        Este caso ya quedó resuelto por consenso, no es posible cambiar de decisión.
                    </Alert>
                )}

                {currentUserYaSanciono && !casoCerradoPorConsenso && (
                    <Alert variant="warning" className="mb-3">
                        Ya registraste sanción en este caso. Solo puedes cambiar tu decisión a indulto.
                    </Alert>
                )}

                <div className="d-flex flex-wrap gap-2 mb-3">
                    <Badge
                        bg={isDetalleInProcess(detalleCaso.in_process)
                            ? 'info'
                            : detalleCaso.closed && (decisionSummary.label === 'Cerrado y sancionado' || decisionSummary.label === 'Cerrado e indultado')
                                ? (detalleCaso.sancion ? 'danger' : 'success')
                                : 'secondary'}
                        text={isDetalleInProcess(detalleCaso.in_process) ? 'dark' : (detalleCaso.closed && (decisionSummary.label === 'Cerrado y sancionado' || decisionSummary.label === 'Cerrado e indultado') ? 'light' : 'dark')}
                        pill
                    >
                        {isDetalleInProcess(detalleCaso.in_process)
                            ? 'En proceso'
                            : detalleCaso.closed && (decisionSummary.label === 'Cerrado y sancionado' || decisionSummary.label === 'Cerrado e indultado')
                                ? decisionSummary.label
                                : 'Abierto'}
                    </Badge>
                    <Badge bg={decisionSummary.bg} text={decisionSummary.text} pill>
                        {decisionSummary.label}
                    </Badge>
                    {totalUsuariosAsignados > 0 && (
                        <Badge bg="secondary" pill>
                            {totalUsuariosAsignados} asignados
                        </Badge>
                    )}
                </div>

                <p><strong>Similitud:</strong> {detalleCaso.similitud}%</p>
                <p><strong>Lineas:</strong> {detalleCaso.lineas ?? '-'}</p>
                
                <p><strong>Sancion:</strong> {casoSancionadoPorConsenso
                    ? 'Sancionado'
                    : decisionState.consensoIndulto
                        ? 'Indultado'
                        : detalleCaso.sancion === true
                            ? 'Sancionado'
                            : detalleCaso.sancion === false
                                ? 'Indultado'
                                : <Badge bg="secondary" pill>Pendiente de decision</Badge>}
                </p>
                <p>
                    <strong>URL MOSS:</strong>{' '}
                    {detalleCaso.url_moss ? (
                        <a href={detalleCaso.url_moss} target="_blank" rel="noopener noreferrer">
                            {detalleCaso.url_moss}
                        </a>
                    ) : (
                        '-'
                    )}
                </p>
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
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <p className="mb-0"><strong>Usuarios Asignados:</strong></p>
                    {totalUsuariosAsignados > 0 && (
                        <Badge bg="secondary" pill>{totalUsuariosAsignados} usuarios</Badge>
                    )}
                </div>
                <div className="d-flex flex-column gap-2 mb-3">
                    {usuariosAsignados.length > 0 ? usuariosAsignados.map((usuario) => {
                        const decision = getDecisionForUser(usuario.user_id);
                        const reason = getReasonForUser(usuario.user_id);

                        return (
                            <div
                                key={usuario.user_id}
                                className={`d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded p-2 ${decision === true ? 'cursor-pointer' : ''}`}
                                role={decision === true ? 'button' : undefined}
                                tabIndex={decision === true ? 0 : undefined}
                                onClick={() => handleClickAsignado(usuario)}
                                onKeyDown={(e) => {
                                    if (decision === true && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        handleClickAsignado(usuario);
                                    }
                                }}
                                title={decision === true ? 'Ver detalle de la sanción' : undefined}
                            >
                                <div>
                                    <div className="fw-semibold">{usuario.username}</div>
                                    {usuario.email ? <div className="small text-secondary">{usuario.email}</div> : null}
                                    {reason.motivo ? <div className="small mt-1"><Badge bg="info" pill>{reason.motivo}</Badge></div> : null}
                                </div>
                                {renderDecisionBadge(decision)}
                            </div>
                        );
                    }) : <p className="text-secondary mb-0">No hay usuarios asignados.</p>}
                </div>

                <hr />
                {renderMensajesCaso()}

                <Form.Group controlId="nuevo-comentario-caso">
                    <Form.Label>Nuevo mensaje</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Escribe un mensaje para este caso"
                    />
                </Form.Group>
                <Button
                    variant="outline-primary"
                    onClick={handleAgregarComentario}
                    disabled={enviandoComentario || procesandoEstado}
                >
                    {enviandoComentario ? 'Enviando mensaje...' : 'Enviar mensaje'}
                </Button>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="success"
                    onClick={handleIndultarCaso}
                    disabled={procesandoEstado || detalleCaso.closed || casoCerradoPorConsenso}
                >
                    {casoCerradoPorConsenso
                        ? 'Caso resuelto'
                        : detalleCaso.in_process === true && currentUserDecision === true
                        ? 'Cambiar a indulto'
                        : isCoordinator
                            ? 'Forzar indulto'
                            : 'Indultar caso'}
                </Button>
                {currentUserPuedeSancionar && (
                    <Button
                        variant="danger"
                        onClick={() => setShowSancionModal(true)}
                        disabled={procesandoEstado || detalleCaso.closed || casoCerradoPorConsenso}
                    >
                        {isCoordinator ? 'Forzar sancion' : 'Sancionar caso'}
                    </Button>
                )}
                <Button variant="secondary" onClick={onClose}>
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>

        <Modal show={showSancionModal} onHide={() => setShowSancionModal(false)} centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>
                    {casoCerradoPorConsenso
                        ? `Caso resuelto #${detalleCaso.caso_id}`
                        : detalleCaso.in_process === true && currentUserDecision === false
                        ? `Cambiar a sancion del caso #${detalleCaso.caso_id}`
                        : isCoordinator
                            ? `Forzar sancion del caso #${detalleCaso.caso_id}`
                            : `Sancionar caso #${detalleCaso.caso_id}`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {casoCerradoPorConsenso && (
                    <Alert variant="warning" className="mb-3">
                        Este caso ya quedó resuelto por consenso. No es posible cambiar la opinión desde este modal.
                    </Alert>
                )}

                {currentUserYaSanciono && (
                    <Alert variant="warning" className="mb-3">
                        Ya registraste sanción en este caso. La única acción disponible es cambiar tu decisión a indulto.
                    </Alert>
                )}
                <p className="mb-3">Selecciona la razón principal de la sanción.</p>
                <Form.Group controlId="select-reason">
                    <Form.Label>Razón de sanción</Form.Label>
                    <Form.Select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} disabled={currentUserYaSanciono}>
                        <option value="">Selecciona una razón</option>
                        <option value="Se detecto uso de inteligencia artificial">Se detectó uso de inteligencia artificial</option>
                        <option value="Se uso contenido no entregado en clases">Se usó contenido no entregado en clases</option>
                        <option value="Se detecto alta similitud con el companero">Se detectó alta similitud con el compañero</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group controlId="descripcion-sancion" className="mt-3">
                    <Form.Label>Descripción de la sanción (opcional)</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        value={descripcionSancion}
                        onChange={(e) => setDescripcionSancion(e.target.value)}
                        disabled={currentUserYaSanciono}
                        placeholder="Detalles adicionales sobre la sanción"
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
                    disabled={procesandoEstado || !selectedReason || !currentUserPuedeSancionar || casoCerradoPorConsenso}
                >
                    {procesandoEstado ? 'Procesando...' : (currentUserYaSanciono ? 'Ya sancionaste' : (isCoordinator ? 'Forzar sancion' : 'Confirmar sancion'))}
                </Button>
            </Modal.Footer>
        </Modal>

        <Modal show={!!selectedAsignadoDetalle} onHide={() => setSelectedAsignadoDetalle(null)} centered>
            <Modal.Header closeButton>
                <Modal.Title>Detalle de sanción</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                
                {selectedAsignadoDetalle && (
                    <>
                    {console.log('Mostrando detalle de sanción para usuario', selectedAsignadoDetalle)}
                        <p className="mb-2"><strong>Usuario:</strong> {selectedAsignadoDetalle.username}</p>
                        {selectedAsignadoDetalle.email ? <p className="mb-2"><strong>Email:</strong> {selectedAsignadoDetalle.email}</p> : null}
                        <p className="mb-2"><strong>Motivo:</strong> {selectedAsignadoDetalle.motivo || '-'}</p>
                        <p className="mb-0"><strong>Descripción:</strong> {selectedAsignadoDetalle.descripcion || '-'}</p>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setSelectedAsignadoDetalle(null)}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
        </>
    );
};

export default DetallesCaso;
