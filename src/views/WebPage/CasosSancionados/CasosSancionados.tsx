import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { services } from '../../../crud';
import type { CasoSancionado, EstudianteSancionado, ProfesorInvolucrado } from '../../../crud/casosSancionados';

const CasosSancionados: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroCasoId, setFiltroCasoId] = useState<string>('');
  const [sanciones, setSanciones] = useState<CasoSancionado[]>([]);

  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [selectedSancion, setSelectedSancion] = useState<CasoSancionado | null>(null);

  const totalSanciones = sanciones.length;

  const fetchSanciones = async () => {
    setLoading(true);
    setError('');
    try {
      const casoId = filtroCasoId.trim() ? Number(filtroCasoId.trim()) : undefined;
      if (filtroCasoId.trim() && Number.isNaN(casoId)) {
        setError('El filtro de caso debe ser numerico.');
        setSanciones([]);
        return;
      }

      const response = await services.casosSancionados.getCasosSancionados(casoId);
      if (response.status === 200) {
        setSanciones(response.data.sanciones || []);
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

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) {
      return '-';
    }
    const date = new Date(fecha);
    return Number.isNaN(date.getTime()) ? fecha : date.toLocaleString();
  };

  return (
    <div className="w-100">
      <Row className="g-4">
        <Col xs={12}>
          <Card className="surface-card page-hero border-0">
            <Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <h1 className="page-title h2 fw-bold mb-2">Casos sancionados</h1>
                <p className="text-secondary mb-0">Consulta y revisa el historial de sanciones registradas.</p>
              </div>
              <Badge bg="danger" pill className="fs-6 px-3 py-2 align-self-start align-self-lg-center">
                {totalSanciones} sanciones
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="surface-card border-0">
            <Card.Body className="p-4 border-bottom">
              <Row className="g-3 align-items-end">
                <Col xs={12} md={6} lg={4}>
                  <Form.Group controlId="filtro-caso-id-sanciones">
                    <Form.Label>Filtrar por ID de caso</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: 12"
                      value={filtroCasoId}
                      onChange={(e) => setFiltroCasoId(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={8} className="d-flex gap-2 justify-content-md-end">
                  <Button variant="outline-secondary" onClick={() => { setFiltroCasoId(''); setTimeout(fetchSanciones, 0); }}>
                    Limpiar filtro
                  </Button>
                  <Button variant="primary" onClick={fetchSanciones}>
                    Buscar
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
              ) : sanciones.length === 0 ? (
                <div className="p-4 text-secondary">No hay casos sancionados para mostrar.</div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>ID sancion</th>
                      <th>ID caso</th>
                      <th>Fecha sancion</th>
                      <th>Estudiantes</th>
                      <th>Descripcion</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanciones.map((sancion) => {
                      const totalEstudiantes = Object.keys(sancion.estudiantes_involucrados || {}).length;

                      return (
                        <tr key={sancion.sancion_id}>
                          <td>{sancion.sancion_id}</td>
                          <td>{sancion.caso_id}</td>
                          <td>{formatFecha(sancion.fecha_sancion)}</td>
                          <td>{totalEstudiantes}</td>
                          <td>{sancion.descripcion_sancion}</td>
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

      <Modal show={showDetalleModal} onHide={() => setShowDetalleModal(false)} size="lg">
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
              <p><strong>Descripcion:</strong> {selectedSancion.descripcion_sancion}</p>

              <h6 className="fw-bold mt-4 mb-3">Estudiantes involucrados</h6>
              {estudiantesList.length === 0 ? (
                <p className="text-secondary mb-0">No hay estudiantes registrados en esta sancion.</p>
              ) : (
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Rol USM</th>
                      <th>Paralelo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesList.map((estudiante) => (
                      <tr key={estudiante.estudianteId}>
                        <td>{estudiante.estudianteId}</td>
                        <td>{estudiante.nombre || '-'}</td>
                        <td>{estudiante.apellido || '-'}</td>
                        <td>{estudiante.rol_usm || '-'}</td>
                        <td>{estudiante.paralelo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              <h6 className="fw-bold mt-4 mb-3">Profesores involucrados</h6>
              {profesoresList.length === 0 ? (
                <p className="text-secondary mb-0">No hay profesores registrados en esta sancion.</p>
              ) : (
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profesoresList.map((profesor) => (
                      <tr key={profesor.profesorId}>
                        <td>{profesor.profesorId}</td>
                        <td>{profesor.username || '-'}</td>
                        <td>{profesor.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetalleModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CasosSancionados;
