import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Col, Form, Row, Table } from 'react-bootstrap';
import { services } from '../../../crud';
import type { Caso } from '../../../crud';
import DetallesCaso from './components/DetallesCaso.tsx';

interface CasosTableProps {
  casos: Caso[];
  emptyMessage?: string;
  onCasoUpdated?: (casoActualizado: Caso) => void;
  enableParaleloFilter?: boolean;
}

type EstadoCasoFilter = 'todos' | 'pendiente' | 'en_proceso' | 'indultado' | 'sancionado';

const isInProcessValue = (val: any): boolean => {
  return val === true || val === 1 || val === '1' || (typeof val === 'string' && val.toLowerCase() === 'true');
};

const getEstadoCaso = (caso: Caso): EstadoCasoFilter => {
  if (isInProcessValue((caso as any).in_process)) {
    return 'en_proceso';
  }

  if (caso.closed) {
    return caso.sancion ? 'sancionado' : 'indultado';
  }

  return 'pendiente';
};

const getEstadoBadge = (caso: Caso) => {
  const estado = getEstadoCaso(caso);

  switch (estado) {
    case 'sancionado':
      return <Badge bg="danger">Sancionado</Badge>;
    case 'indultado':
      return <Badge bg="success">Indultado</Badge>;
    case 'en_proceso':
      return <Badge bg="info" text="dark">En proceso</Badge>;
    default:
      return <Badge bg="warning" text="dark">Pendiente</Badge>;
  }
};

const computeDecisionSummary = (caso: Caso) => {
  const usuariosAsignados = caso.usuarios_asignados || [];
  const decisionesProfes = caso.decisiones_profes || {};

  const getDecisionFor = (userId: number) => {
    const v = decisionesProfes[String(userId)];
    return typeof v === 'boolean' ? v : undefined;
  };

  if (caso.closed) {
    const assignedIds = usuariosAsignados.map((u) => u.user_id);

    if (assignedIds.length <= 1) {
      return caso.sancion
        ? { label: 'Cerrado y sancionado', bg: 'danger', text: 'light' as const }
        : { label: 'Cerrado e indultado', bg: 'success', text: 'light' as const };
    }

    const decisionesRegistradas = assignedIds.map((id) => getDecisionFor(id));
    const decisionesConValor = decisionesRegistradas.filter((value): value is boolean => typeof value === 'boolean');
    const decisionesUnicas = new Set(decisionesConValor);
    const allVoted = decisionesRegistradas.every((v) => typeof v === 'boolean');

    if (allVoted && decisionesUnicas.size === 1) {
      const decisionUnica = decisionesConValor[0];
      return decisionUnica
        ? { label: 'Cerrado y sancionado', bg: 'danger', text: 'light' as const }
        : { label: 'Cerrado e indultado', bg: 'success', text: 'light' as const };
    }
    // fallthrough
  }

  if ((caso.usuarios_asignados || []).length === 0) {
    return { label: 'Pendiente de votacion', bg: 'warning', text: 'dark' as const };
  }

  const assignedIds = usuariosAsignados.map((u) => u.user_id);
  const decisionesRegistradas = assignedIds.map((id) => getDecisionFor(id));
  const decisionesConValor = decisionesRegistradas.filter((value): value is boolean => typeof value === 'boolean');
  const decisionesUnicas = new Set(decisionesConValor);
  const hayPendientes = decisionesRegistradas.some((value) => value === undefined);

  if (decisionesConValor.length > 0 && decisionesUnicas.size > 1) {
    return { label: 'Desacuerdo', bg: 'danger', text: 'light' as const };
  }

  if (decisionesConValor.length > 0 && !hayPendientes && decisionesUnicas.size === 1) {
    const decisionUnica = decisionesConValor[0];
    return decisionUnica
      ? { label: 'Consenso para sancion', bg: 'danger', text: 'light' as const }
      : { label: 'Consenso para indulto', bg: 'success', text: 'light' as const };
  }

  if (decisionesConValor.length > 0) {
    return { label: 'Pendiente de consenso', bg: 'warning', text: 'dark' as const };
  }

  return { label: 'Pendiente de votacion', bg: 'warning', text: 'dark' as const };
};

const CasosTable: React.FC<CasosTableProps> = ({
  casos,
  emptyMessage = 'No hay casos para mostrar.',
  onCasoUpdated,
  enableParaleloFilter = false,
}) => {
  const [casosList, setCasosList] = useState<Caso[]>(casos);
  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null);
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<EstadoCasoFilter>('todos');
  const [selectedParaleloFilter, setSelectedParaleloFilter] = useState<string>('todos');

  useEffect(() => {
    setCasosList(casos);
  }, [casos]);

  useEffect(() => {
    const handler = (ev: any) => {
      const updatedCaso = ev?.detail;
      console.log('[CasosTable] recibido evento caso:updated', updatedCaso);
      if (!updatedCaso || !updatedCaso.caso_id) return;

      setCasosList((prev) => {
        const found = prev.some((item) => item.caso_id === updatedCaso.caso_id);
        console.log('[CasosTable] antes update casosList length:', prev.length, 'found:', found);
        const next = prev.map((item) => (item.caso_id === updatedCaso.caso_id ? { ...item, ...updatedCaso } : item));
        console.log('[CasosTable] despues update casosList sample:', next.find((i) => i.caso_id === updatedCaso.caso_id));
        return next;
      });

      setSelectedCaso((prev) => {
        if (prev && prev.caso_id === updatedCaso.caso_id) {
          console.log('[CasosTable] actualizando selectedCaso con payload del evento');
          return { ...prev, ...updatedCaso };
        }
        return prev;
      });
    };

    window.addEventListener('caso:updated', handler as EventListener);
    return () => window.removeEventListener('caso:updated', handler as EventListener);
  }, []);

  // Listen for sancion changes (emitted from CasosSancionados) and refresh affected caso
  useEffect(() => {
    const handler = async (ev: any) => {
      const detail = ev?.detail;
      if (!detail) return;
      const sancion = detail.sancion ?? null;
      const sancionId = detail.sancionId ?? null;

      // Try to extract caso_id from sancion object
      const casoId = sancion && typeof sancion === 'object' && (sancion.caso_id || sancion.casoId)
        ? (sancion.caso_id || sancion.casoId)
        : detail.caso_id ?? detail.casoId ?? null;

      if (!casoId && !sancionId) return;

      try {
        // Fetch fresh detalle del caso when possible
        if (casoId) {
          const resp = await services.casos.getCasoDetalle(Number(casoId));
          if (resp && resp.status >= 200 && resp.status < 300 && resp.data) {
            const updated = resp.data as Caso;
            console.log('[CasosTable] sancion:changed - fetched updated caso', updated.caso_id);
            setCasosList((prev) => prev.map((item) => (item.caso_id === updated.caso_id ? { ...item, ...updated } : item)));
            setSelectedCaso((prev) => (prev && prev.caso_id === updated.caso_id ? { ...prev, ...updated } : prev));
            onCasoUpdated?.(updated);
            return;
          }
        }

        // Fallback: mark sancion flag on matching caso if we only have sancionId
        if (sancionId) {
          setCasosList((prev) => prev.map((item) => {
            // try to find by nested sanciones array if present
            if ((item as any).sanciones && Array.isArray((item as any).sanciones)) {
              const found = (item as any).sanciones.find((s: any) => s.sancion_id === sancionId);
              if (found && item.caso_id === found.caso_id) {
                return { ...item, sancion: true };
              }
            }
            return item;
          }));
        }
      } catch (err) {
        console.warn('[CasosTable] error handling sancion:changed', err);
      }
    };

    window.addEventListener('sancion:changed', handler as EventListener);
    return () => window.removeEventListener('sancion:changed', handler as EventListener);
  }, [onCasoUpdated]);

  const opcionesParalelo = useMemo(() => {
    const paraleloSet = new Set<string>();

    casosList.forEach((caso) => {
      const paralelos = caso.paralelos || [];
      if (paralelos.length === 0) {
        paraleloSet.add('Sin paralelo');
        return;
      }

      paralelos.forEach((paralelo) => {
        if (paralelo?.sigla_paralelo) {
          paraleloSet.add(paralelo.sigla_paralelo);
        }
      });
    });

    return Array.from(paraleloSet).sort();
  }, [casosList]);

  const casosFiltrados = useMemo(() => {
    return casosList.filter((caso) => {
      const estadoCaso = getEstadoCaso(caso);
      if (selectedEstadoFilter !== 'todos' && estadoCaso !== selectedEstadoFilter) {
        return false;
      }

      if (!enableParaleloFilter || selectedParaleloFilter === 'todos') {
        return true;
      }

      const paralelos = caso.paralelos || [];
      if (paralelos.length === 0) {
        return selectedParaleloFilter === 'Sin paralelo';
      }

      return paralelos.some((paralelo) => paralelo.sigla_paralelo === selectedParaleloFilter);
    });
  }, [casosList, selectedEstadoFilter, selectedParaleloFilter, enableParaleloFilter]);

  if (casosList.length === 0) {
    return <div className="p-4 text-secondary">{emptyMessage}</div>;
  }

  const handleVerDetalles = async (caso: Caso) => {
    try {
      console.log('[CasosTable] fetching fresh detalle for caso', caso.caso_id);
      const response = await services.casos.getCasoDetalle(caso.caso_id);
      if (response && response.status >= 200 && response.status < 300 && response.data) {
        setSelectedCaso(response.data);
        // also update the list entry with freshest data
        setCasosList((prev) => prev.map((item) => (item.caso_id === response.data.caso_id ? { ...item, ...response.data } : item)));
        return;
      }
    } catch (err) {
      console.warn('[CasosTable] could not fetch fresh detalle, falling back to cached caso', caso.caso_id, err);
    }

    setSelectedCaso(caso);
  };

  const handleCasoUpdated = (casoActualizado: Caso) => {
    console.log('[CasosTable] handleCasoUpdated llamado con:', casoActualizado);
    setCasosList((prev) =>
      prev.map((item) =>
        item.caso_id === casoActualizado.caso_id
          ? { ...item, ...casoActualizado }
          : item
      )
    );

    setSelectedCaso((prev) =>
      prev && prev.caso_id === casoActualizado.caso_id
        ? { ...prev, ...casoActualizado }
        : prev
    );

    onCasoUpdated?.(casoActualizado);
  };

  return (
    <>
      <Row className="g-3 mb-3">
        <Col xs={12} md={enableParaleloFilter ? 6 : 12} lg={enableParaleloFilter ? 4 : 6}>
          <Form.Group controlId="filtro-estado-casos">
            <Form.Label className="fw-semibold">Filtrar por estado</Form.Label>
            <Form.Select value={selectedEstadoFilter} onChange={(e) => setSelectedEstadoFilter(e.target.value as EstadoCasoFilter)}>
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="indultado">Indultado</option>
              <option value="sancionado">Sancionado</option>
            </Form.Select>
          </Form.Group>
        </Col>

        {enableParaleloFilter && (
          <Col xs={12} md={6} lg={4}>
            <Form.Group controlId="filtro-paralelo-casos">
              <Form.Label className="fw-semibold">Filtrar por paralelo</Form.Label>
              <Form.Select value={selectedParaleloFilter} onChange={(e) => setSelectedParaleloFilter(e.target.value)}>
                <option value="todos">Todos los paralelos</option>
                {opcionesParalelo.map((paralelo) => (
                  <option key={paralelo} value={paralelo}>
                    {paralelo}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        )}
      </Row>

      {casosFiltrados.length === 0 ? (
        <div className="p-4 text-secondary">No hay casos con los filtros seleccionados.</div>
      ) : (
      <Table responsive hover className="mb-0 align-middle">
        <thead>
          <tr>
            <th>Similitud</th>
            <th>Lineas</th>
            <th>Paralelos</th>
            <th>Estado</th>
            <th>Asignado</th>
            <th>Estudiante 1</th>
            <th>Estudiante 2</th>
            <th>MOSS</th>
            <th>Acciones</th>

          </tr>
        </thead>
        <tbody>
          {casosFiltrados.map((caso) => {
            const estudiantes = caso.estudiantes || [];
            const asignados = caso.usuarios_asignados || [];
            const sinEncargado = asignados.length === 0;
            const paralelos = caso.paralelos || [];
            const paralelosVista = paralelos.length > 0
              ? paralelos
              : estudiantes
                  .map((estudiante) => estudiante.paralelo)
                  .filter(Boolean)
                  .map((sigla) => ({ paralelo_id: 0, sigla_paralelo: sigla as string, sede_id: null, sede_nombre: null }));

            return (
              <tr key={caso.caso_id} className={sinEncargado ? 'table-warning' : ''}>
                <td>{caso.similitud}%</td>
                <td>{caso.lineas ?? '-'}</td>
                <td>
                  {paralelosVista.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                      {paralelosVista.map((paralelo) => (
                        <Badge key={`${caso.caso_id}-${paralelo.paralelo_id}-${paralelo.sigla_paralelo}`} bg="light" text="dark" pill className="border">
                          {paralelo.sigla_paralelo}
                          {paralelo.sede_nombre ? ` · ${paralelo.sede_nombre}` : ''}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-secondary">Sin paralelo</span>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2 align-items-center">
                    {getEstadoBadge(caso)}
                    <Badge bg={computeDecisionSummary(caso).bg} text={computeDecisionSummary(caso).text} pill>
                      {computeDecisionSummary(caso).label}
                    </Badge>
                  </div>
                </td>
                <td>
                  {sinEncargado ? (
                    <Badge bg="warning" text="dark">Sin encargado</Badge>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {asignados.map((u) => (
                        <Badge key={u.user_id} bg="light" text="dark" pill className="border">
                          {u.username}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  {estudiantes.length > 0
                    ? `${estudiantes[0].nombre} ${estudiantes[0].apellido}`
                    : '-'}
                </td>
                <td>
                  {estudiantes.length > 1
                    ? `${estudiantes[1].nombre} ${estudiantes[1].apellido}`
                    : '-'}
                </td>
                <td>
                  {caso.url_moss ? (
                    <a href={caso.url_moss} target="_blank" rel="noopener noreferrer">
                      Ver en MOSS
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <Button variant="outline-primary" size="sm" onClick={() => handleVerDetalles(caso)}>
                    Ver Detalles
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      )}

      {selectedCaso && (
        <DetallesCaso
          caso={selectedCaso}
          onCasoUpdated={handleCasoUpdated}
          onClose={() => setSelectedCaso(null)}
        />
      )}
    </>
  );
};

export default CasosTable;