import React, { useMemo, useState } from 'react';
import { Accordion, Alert, Badge, Button, Card, Col, Dropdown, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { services } from '../../../crud';
import type { CasoSancionado, EstudianteSancionado, ProfesorInvolucrado } from '../../../crud/casosSancionados';
import RequireRole from '../../../components/RequireRole';

const CasosSancionados: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroNombre, setFiltroNombre] = useState<string>('');
  const [selectedParalelosFilter, setSelectedParalelosFilter] = useState<string[]>([]);
  const [sanciones, setSanciones] = useState<CasoSancionado[]>([]);

  const currentUser = services.auth.getCurrentUser();
  const isProfesor = currentUser?.rol_id === 2;
  const profesorParalelosSiglas: string[] = (currentUser?.paralelos || []).map((p: any) => p.sigla_paralelo).filter(Boolean);

  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [selectedSancion, setSelectedSancion] = useState<CasoSancionado | null>(null);
  const [cancellingSancion, setCancellingSancion] = useState(false);
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({});

  const availableParalelos = useMemo(() => {
    const paralelosMap = new Map<string, string>();

    sanciones.forEach((sancion) => {
      const estudiantes = Object.values(sancion.estudiantes_involucrados || {} as any) as any[];

      estudiantes.forEach((estudiante) => {
        if (!estudiante?.paralelo) {
          return;
        }

        const sigla = String(estudiante.paralelo);
        paralelosMap.set(sigla, sigla);
      });
    });

    return Array.from(paralelosMap.entries()).map(([paralelo_id, sigla_paralelo]) => ({ paralelo_id, sigla_paralelo }));
  }, [sanciones]);

  const sancionesFiltradas = useMemo(() => {
    const query = filtroNombre.trim().toLowerCase();

    return sanciones.filter((sancion) => {
      const estudiantes = Object.values(sancion.estudiantes_involucrados || {} as any) as any[];
      const profesores = Object.values(sancion.profesores_involucrados || {} as any) as any[];

      const coincideNombre = !query || [...estudiantes, ...profesores].some((persona) => {
        const nombreCompleto = [persona?.nombre, persona?.apellido]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return nombreCompleto.includes(query);
      });

      const coincideParalelo = selectedParalelosFilter.length === 0
        || estudiantes.some((estudiante) => {
          const siglaParalelo = String(estudiante?.paralelo || '').trim();
          return siglaParalelo && selectedParalelosFilter.includes(siglaParalelo);
        });

      return coincideNombre && coincideParalelo;
    });
  }, [sanciones, filtroNombre, selectedParalelosFilter]);

  const totalSanciones = sancionesFiltradas.length;

  const toggleParaleloFilter = (paraleloSigla: string) => {
    setSelectedParalelosFilter((prev) => (
      prev.includes(paraleloSigla)
        ? prev.filter((sigla) => sigla !== paraleloSigla)
        : [...prev, paraleloSigla]
    ));
  };

  const fetchSanciones = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await services.casosSancionados.getCasosSancionados();
      if (response.status === 200) {
        let results = response.data.sanciones || [];

        // If user is a professor, limit shown sanciones to those involving students in their paralelos
        if (isProfesor && profesorParalelosSiglas.length > 0) {
          results = results.filter((sancion: CasoSancionado) => {
            const estudiantes = Object.values(sancion.estudiantes_involucrados || {} as any) as any[];
            return estudiantes.some((est) => {
              if (!est || !est.paralelo) return false;
              return profesorParalelosSiglas.includes(String(est.paralelo));
            });
          });
        }

        setSanciones(results);
      }
    } catch (err: any) {
      setError(err.message || 'No fue posible cargar los casos sancionados.');
      setSanciones([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSanciones();
  }, []);

  const openDetalleModal = async (sancionId: number) => {
    setLoadingDetalle(true);
    setError('');
    try {
      const response = await services.casosSancionados.getCasoSancionadoById(sancionId);
      if (response.status === 200) {
        setSelectedSancion(response.data);
        setShowDetalleModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'No fue posible cargar el detalle de la sancion.');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCancelarSancion = async (sancionId: number) => {
    if (!window.confirm('¿Confirmas cancelar esta sanción? Esto será trazable y no eliminará el registro.')) return;
    setCancellingSancion(true);
    setError('');
    try {
      const response = await services.casosSancionados.deleteCasoSancionado(sancionId);
      if (response.status === 200) {
        // refresh list and detail
        await fetchSanciones();
        if (response.data && response.data.sancion) {
          setSelectedSancion(response.data.sancion as any);
        } else {
          setSelectedSancion(null);
        }
        // Close the detail modal on successful cancellation
        setShowDetalleModal(false);
        // Notify other parts of the app that a sancion changed so they can refresh/close their modals
        const casoId = selectedSancion?.caso_id;
        try {
          const evt = new CustomEvent('sancion:changed', { detail: { sancionId: sancionId, caso_id: casoId, sancion: response.data?.sancion || null } });
          window.dispatchEvent(evt);
        } catch (e) {
          // ignore
        }
        try {
          // Also emit `caso:updated` so open DetallesCaso modals update in real-time
          const casoDetail = response.data?.caso ?? (selectedSancion ? { caso_id: selectedSancion.caso_id, sancion: response.data?.sancion ? true : undefined } : null);
          if (casoDetail) {
            const casoEvt = new CustomEvent('caso:updated', { detail: casoDetail });
            window.dispatchEvent(casoEvt);
          }
        } catch (e) {
          // ignore
        }
        try {
          const closeEvt = new CustomEvent('detallecaso:close', { detail: { sancionId, caso_id: casoId } });
          window.dispatchEvent(closeEvt);
        } catch (e) {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err.message || 'No fue posible cancelar la sanción.');
    } finally {
      setCancellingSancion(false);
    }
  };

  const estudiantesList = useMemo(() => {
    if (!selectedSancion || !selectedSancion.estudiantes_involucrados) {
      return [];
    }

    return Object.entries(selectedSancion.estudiantes_involucrados).map(([estudianteId, estudiante]) => ({
      estudianteId,
      ...(estudiante as EstudianteSancionado),
    }));
  }, [selectedSancion]);

  const profesoresList = useMemo(() => {
    if (!selectedSancion || !selectedSancion.profesores_involucrados) {
      return [];
    }

    return Object.entries(selectedSancion.profesores_involucrados).map(([profesorId, profesor]) => ({
      profesorId,
      ...(profesor as ProfesorInvolucrado),
    }));
  }, [selectedSancion]);

  const mensajesCaso = useMemo(() => {
    if (!selectedSancion || !Array.isArray(selectedSancion.comments)) {
      return [];
    }

    return selectedSancion.comments;
  }, [selectedSancion]);

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) {
      return '-';
    }
    const date = new Date(fecha);
    return Number.isNaN(date.getTime()) ? fecha : date.toLocaleString();
  };

  const formatReasonDisplay = (
    r: any,
    opts?: { showDescriptions?: boolean; professorId?: string | number; sancionId?: number; onlyMotivos?: boolean },
  ): React.ReactNode => {
    if (!r) return '-';

    let parsed: any = r;
    if (typeof r === 'string') {
      try {
        parsed = JSON.parse(r);
      } catch (e) {
        parsed = r;
      }
    }

    if (typeof parsed === 'string') {
      if (opts?.onlyMotivos) return <Badge bg="danger" pill className="me-1">{parsed}</Badge>;
      return parsed;
    }

    if (typeof parsed === 'object' && parsed !== null) {
      // If a specific professor is requested, show that professor's motivo + descripcion (foldable)
      if (opts?.professorId !== undefined) {
        const key = String(opts.professorId);
        const item = parsed[key] ?? parsed[Number(key)];
        if (!item) return '-';

        const motivo = item?.motivo ?? item?.motivo;
        const descripcion = item?.descripcion ?? item?.descripcion;
        const stateKey = `${opts.sancionId ?? ''}-${key}`;
        const expanded = !!expandedReasons[stateKey];
        const toggle = () => setExpandedReasons((prev) => ({ ...prev, [stateKey]: !prev[stateKey] }));

        const needsToggle = descripcion && String(descripcion).length > 200;

        return (
          <div>
            {motivo ? (
              <Badge bg="danger" pill className="me-2">
                {motivo}
              </Badge>
            ) : null}
            {descripcion ? (
              <div className="mt-1">
                <div
                  onClick={needsToggle ? toggle : undefined}
                  style={{
                    maxHeight: needsToggle && !expanded ? 80 : undefined,
                    overflow: needsToggle && !expanded ? 'hidden' : undefined,
                    whiteSpace: 'pre-wrap',
                    cursor: needsToggle ? 'pointer' : undefined,
                    position: 'relative',
                  }}
                >
                  {descripcion}
                  {needsToggle && !expanded && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 28,
                      background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))'
                    }} />
                  )}
                </div>
              </div>
            ) : null}
            {!motivo && !descripcion ? <span>{JSON.stringify(item)}</span> : null}
          </div>
        );
      }

      // Otherwise aggregate motivos for badges (table use-case)
      const items = Object.values(parsed) as any[];
      const motivos = Array.from(new Set(items.map((it) => (it && it.motivo) || (typeof it === 'string' ? it : null)).filter(Boolean)));
      if (motivos.length === 0) return '-';

      return (
        <div>
          {motivos.map((m, idx) => (
            <Badge key={idx} bg="danger" pill className="me-1">
              {m}
            </Badge>
          ))}
        </div>
      );
    }

    return String(parsed);
  };

  return (
    <RequireRole allowedRoles={[1,2]}>
    <div className="w-100">
      <Row className="g-4">
        <Col xs={12}>
          <Card className="surface-card page-hero border-0">
            <Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <h1 className="page-title h2 fw-bold mb-2">Casos sancionados</h1>
              </div>
              <Badge bg="danger" pill className="fs-6 px-3 py-2 align-self-start align-self-lg-center">
                {totalSanciones} visibles de {sanciones.length}
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="surface-card border-0">
            <Card.Body className="p-4 border-bottom">
              <Row className="g-3 align-items-end">
                <Col xs={12} md={6} lg={4}>
                  <Form.Group controlId="filtro-nombre-sanciones">
                    <Form.Label>Filtrar por nombre</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: Antonia, Cristobal, Pedro"
                      value={filtroNombre}
                      onChange={(e) => setFiltroNombre(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg="auto">
                  <Form.Group controlId="filtro-paralelo-sanciones">
                    <Form.Label>Filtrar por paralelo</Form.Label>
                    <Dropdown autoClose="outside" align="start">
                      <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start text-truncate">
                        {selectedParalelosFilter.length > 0
                          ? `Paralelos (${selectedParalelosFilter.length})`
                          : 'Filtrar paralelos'}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="p-3" style={{ minWidth: '16rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {availableParalelos.length === 0 ? (
                          <span className="text-secondary">Sin opciones disponibles</span>
                        ) : (
                          availableParalelos.map((paralelo) => (
                            <Form.Check
                              key={paralelo.paralelo_id}
                              type="checkbox"
                              id={`paralelo-filter-${paralelo.paralelo_id}`}
                              className="mb-2"
                              label={paralelo.sigla_paralelo}
                              checked={selectedParalelosFilter.includes(paralelo.sigla_paralelo)}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => toggleParaleloFilter(paralelo.sigla_paralelo)}
                            />
                          ))
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg="auto" className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setFiltroNombre('');
                      setSelectedParalelosFilter([]);
                    }}
                    disabled={!filtroNombre.trim() && selectedParalelosFilter.length === 0}
                  >
                    Limpiar filtros
                  </Button>
                </Col>
                <Col xs={12} lg="auto" className="ms-lg-auto d-flex justify-content-lg-end">
                  <Button variant="primary" onClick={fetchSanciones}>
                    Actualizar
                  </Button>
                </Col>
              </Row>
            </Card.Body>

            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-secondary mt-3 mb-0">Cargando casos sancionados...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
              ) : sancionesFiltradas.length === 0 ? (
                <div className="p-4 text-secondary">No hay casos sancionados que coincidan con el nombre buscado.</div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Estudiante 1</th>
                      <th>Estudiante 2</th>
                      <th>Fecha sancion</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sancionesFiltradas.map((sancion) => {
                      const estList = Object.values(sancion.estudiantes_involucrados || {}) as EstudianteSancionado[];
                      return (
                        <tr key={sancion.sancion_id}>
                          <td>{estList[0]?.nombre || '-'}</td>
                          <td>{estList[1]?.nombre || '-'}</td>
                          <td>{formatFecha(sancion.fecha_sancion)}</td>
                          <td>{formatReasonDisplay(sancion.reason)}</td>
                          <td>
                            {sancion.cancelado ? (
                              <Badge bg="secondary" pill>Cancelada</Badge>
                            ) : (
                              <Badge bg="danger" pill>Activa</Badge>
                            )}
                            {sancion.cancelado && sancion.fecha_cancelacion ? (
                              <div className="small text-secondary mt-1">{formatFecha(sancion.fecha_cancelacion)}</div>
                            ) : null}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              disabled={loadingDetalle}
                              onClick={() => openDetalleModal(sancion.sancion_id)}
                            >
                              {loadingDetalle ? 'Cargando...' : 'Ver detalles'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showDetalleModal} onHide={() => setShowDetalleModal(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de sancion #{selectedSancion?.sancion_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedSancion ? (
            <p className="text-secondary mb-0">No hay informacion para mostrar.</p>
          ) : (
            <>
              <p><strong>ID Caso:</strong> {selectedSancion.caso_id}</p>
              <p><strong>Fecha:</strong> {formatFecha(selectedSancion.fecha_sancion)}</p>
              <p><strong>Motivo:</strong> {formatReasonDisplay(selectedSancion?.reason)}</p>
              <p><strong>Estado:</strong> {selectedSancion.cancelado ? 'Cancelada' : 'Activa'}</p>
              {selectedSancion.cancelado && (
                <p><strong>Fecha cancelación:</strong> {formatFecha(selectedSancion.fecha_cancelacion)}</p>
              )}
              {selectedSancion.cancelado && selectedSancion.cancelado_por && (
                <p><strong>Cancelado por:</strong> {selectedSancion.cancelado_por}</p>
              )}

              <h6 className="fw-bold mt-4 mb-3">Estudiantes involucrados</h6>
              {estudiantesList.length === 0 ? (
                <p className="text-secondary mb-0">No hay estudiantes registrados en esta sancion.</p>
              ) : (
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Paralelo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesList.map((estudiante) => (
                      <tr key={estudiante.estudianteId}>
                        <td>{estudiante.estudianteId}</td>
                        <td>{estudiante.nombre || '-'}</td>
                        <td>{estudiante.paralelo ? <Badge bg="light" text="dark" pill className="border">{estudiante.paralelo}</Badge> : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              <h6 className="fw-bold mt-4 mb-3">Profesores involucrados</h6>
              {profesoresList.length === 0 ? (
                <p className="text-secondary mb-0">No hay profesores registrados en esta sancion.</p>
              ) : (
                <div className="mb-0">
                  {profesoresList.map((profesor) => (
                    <div key={profesor.profesorId} className="mb-3">
                      <div className="fw-bold">{profesor.nombre || '-'}</div>
                      <div className="mt-1">{formatReasonDisplay(selectedSancion?.reason, { showDescriptions: true, professorId: profesor.profesorId, sancionId: selectedSancion?.sancion_id })}</div>
                    </div>
                  ))}
                </div>
              )}

              <Accordion className="mt-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Mensajes del caso ({mensajesCaso.length})</Accordion.Header>
                  <Accordion.Body>
                    {mensajesCaso.length === 0 ? (
                      <p className="text-secondary mb-0">No hay mensajes registrados en esta sancion.</p>
                    ) : (
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {mensajesCaso.map((mensaje, index) => {
                          console.log('Mostrando mensaje para usuario', mensaje);
                          return (
                            <div key={`${mensaje.user_id}-${mensaje.timestamp}-${index}`} className="border rounded p-3 bg-light">
                              <div className="small text-secondary mb-1">
                                {mensaje.username} - {formatFecha(mensaje.timestamp)}
                              </div>
                              <div>{mensaje.comentario}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
            {selectedSancion && !selectedSancion.cancelado && currentUser?.rol_id === 1 && (
              <Button variant="outline-danger" onClick={() => selectedSancion && handleCancelarSancion(selectedSancion.sancion_id)} disabled={cancellingSancion}>
                {cancellingSancion ? 'Cancelando...' : 'Cancelar sanción'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetalleModal(false)}>
              Cerrar
            </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </RequireRole>
  );
};

export default CasosSancionados;
