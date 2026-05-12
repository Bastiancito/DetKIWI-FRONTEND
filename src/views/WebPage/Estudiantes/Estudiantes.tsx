import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Dropdown, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { estudianteService } from '../../../crud';
import type { Estudiante } from '../../../crud';

interface EstudianteDraft {
  nombre: string;
  apellido: string;
}

const initialDraft: EstudianteDraft = {
  nombre: '',
  apellido: '',
};

const Estudiantes: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSanciones, setSelectedSanciones] = useState<number[]>([]);
  const [selectedParalelos, setSelectedParalelos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createDraft, setCreateDraft] = useState<EstudianteDraft>(initialDraft);
  const [editDraft, setEditDraft] = useState<EstudianteDraft>(initialDraft);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadEstudiantes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await estudianteService.getAllEstudiantes();
      setEstudiantes(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'No fue posible cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const sancionesOptions = useMemo(() => {
    const unique = new Set<number>();
    estudiantes.forEach((estudiante) => {
      unique.add(estudiante.sanciones?.length ?? 0);
    });

    return Array.from(unique).sort((a, b) => a - b);
  }, [estudiantes]);

  const paraleloOptions = useMemo(() => {
    const unique = new Set<string>();
    estudiantes.forEach((estudiante) => {
      const paralelo = estudiante.paralelo_sigla || 'Sin paralelo';
      if (paralelo) {
        unique.add(paralelo);
      }
    });

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [estudiantes]);

  const sancionesDropdownLabel =
    selectedSanciones.length > 0 ? `Sanciones (${selectedSanciones.length})` : 'Filtrar sanciones';
  const paralelosDropdownLabel =
    selectedParalelos.length > 0 ? `Paralelos (${selectedParalelos.length})` : 'Filtrar paralelos';

  const filteredEstudiantes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return estudiantes.filter((estudiante) => {
      const searchMatches =
        !term || `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase().includes(term);
      const sanciones = estudiante.sanciones?.length ?? 0;
      const paralelo = estudiante.paralelo_sigla || 'Sin paralelo';
      const sancionesMatches =
        selectedSanciones.length === 0 || selectedSanciones.includes(sanciones);
      const paraleloMatches =
        selectedParalelos.length === 0 || selectedParalelos.includes(paralelo);

      return searchMatches && sancionesMatches && paraleloMatches;
    });
  }, [estudiantes, search, selectedSanciones, selectedParalelos]);

  const toggleSancionesFilter = (value: number) => {
    setSelectedSanciones((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleParaleloFilter = (value: string) => {
    setSelectedParalelos((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nombre = createDraft.nombre.trim();
    const apellido = createDraft.apellido.trim();

    if (!nombre || !apellido) {
      setError('Nombre y apellido son requeridos');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await estudianteService.createEstudiante({ nombre, apellido });
      setShowCreateModal(false);
      setCreateDraft(initialDraft);
      await loadEstudiantes();
    } catch (err: any) {
      setError(err?.message || 'No fue posible crear estudiante');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (estudiante: Estudiante) => {
    setEditingId(estudiante.estudiante_id);
    setEditDraft({
      nombre: estudiante.nombre || '',
      apellido: estudiante.apellido || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    const nombre = editDraft.nombre.trim();
    const apellido = editDraft.apellido.trim();

    if (!nombre || !apellido) {
      setError('Nombre y apellido son requeridos');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await estudianteService.updateEstudiante(editingId, { nombre, apellido });
      setShowEditModal(false);
      setEditingId(null);
      setEditDraft(initialDraft);
      await loadEstudiantes();
    } catch (err: any) {
      setError(err?.message || 'No fue posible actualizar estudiante');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (estudiante: Estudiante) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${estudiante.nombre} ${estudiante.apellido}?`
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(estudiante.estudiante_id);
    setError('');
    try {
      await estudianteService.deleteEstudiante(estudiante.estudiante_id);
      await loadEstudiantes();
    } catch (err: any) {
      setError(err?.message || 'No fue posible eliminar estudiante');
    } finally {
      setDeletingId(null);
    }
  };

  const getProfesoresLabel = (sanciones: any[]) => {
    if (!sanciones || sanciones.length === 0) return '-';
    const nombres = new Set<string>();
    sanciones.forEach((s) => {
      const profesObj = s.profesores_involucrados || {};
      Object.values(profesObj).forEach((p: any) => {
        if (p.username) nombres.add(p.username);
      });
    });
    return nombres.size > 0 ? Array.from(nombres).join(', ') : '-';
  };

  return (
    <div className="w-100">
      <Row className="g-4">
        <Col xs={12}>
          <Card className="surface-card page-hero border-0">
            <Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <h1 className="page-title h2 fw-bold mb-2">Estudiantes</h1>
                <p className="text-secondary mb-0">Administra y consulta el listado de estudiantes.</p>
              </div>
              <Badge bg="primary" pill className="fs-6 px-3 py-2 align-self-start align-self-lg-center">
                {estudiantes.length} estudiantes
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="surface-card border-0">
            <Card.Body className="p-4 border-bottom">
              <Row className="g-3 align-items-end">
                <Col xs={12} lg={5}>
                  <Form.Group>
                    <Form.Label>Buscar estudiante</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Buscar por nombre o apellido"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} sm={6} lg={2}>
                  <Form.Label>Filtro sanciones</Form.Label>
                  <Dropdown autoClose="outside">
                    <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start text-truncate">
                      {sancionesDropdownLabel}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100 p-3" style={{ minWidth: '18rem', maxHeight: '16rem', overflowY: 'auto' }}>
                      {sancionesOptions.length === 0 ? (
                        <span className="text-secondary">Sin opciones disponibles</span>
                      ) : (
                        sancionesOptions.map((sancion) => (
                          <Form.Check
                            key={sancion}
                            type="checkbox"
                            id={`sanciones-filter-${sancion}`}
                            className="mb-2"
                            label={`${sancion} sanciones`}
                            checked={selectedSanciones.includes(sancion)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleSancionesFilter(sancion)}
                          />
                        ))
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
                <Col xs={12} sm={6} lg={2}>
                  <Form.Label>Filtro paralelo</Form.Label>
                  <Dropdown autoClose="outside">
                    <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start text-truncate">
                      {paralelosDropdownLabel}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100 p-3" style={{ minWidth: '18rem', maxHeight: '16rem', overflowY: 'auto' }}>
                      {paraleloOptions.length === 0 ? (
                        <span className="text-secondary">Sin opciones disponibles</span>
                      ) : (
                        paraleloOptions.map((paralelo) => (
                          <Form.Check
                            key={paralelo}
                            type="checkbox"
                            id={`paralelo-filter-${encodeURIComponent(paralelo)}`}
                            className="mb-2"
                            label={paralelo}
                            checked={selectedParalelos.includes(paralelo)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleParaleloFilter(paralelo)}
                          />
                        ))
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
                <Col xs={12} lg={3} className="d-grid">
                  <Button type="button" variant="primary" onClick={() => setShowCreateModal(true)}>
                    Crear estudiante
                  </Button>
                </Col>
              </Row>
            </Card.Body>

            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-secondary mt-3 mb-0">Cargando estudiantes...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-4 mb-0">{error}</Alert>
              ) : filteredEstudiantes.length === 0 ? (
                <div className="p-4 text-secondary">No hay estudiantes que coincidan con la búsqueda.</div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Paralelo</th>
                      <th>Sanciones</th>
                      <th>Profesores Sancionadores</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEstudiantes.map((estudiante) => (
                      <tr key={estudiante.estudiante_id}>
                        <td>{estudiante.estudiante_id}</td>
                        <td>{estudiante.nombre}</td>
                        <td>{estudiante.apellido}</td>
                        <td>{estudiante.paralelo_sigla || 'Sin paralelo'}</td>
                        <td>{estudiante.sanciones?.length ?? 0}</td>
                        <td>{getProfesoresLabel(estudiante.sanciones || [])}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <Button
                              type="button"
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openEditModal(estudiante)}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="outline-danger"
                              size="sm"
                              disabled={deletingId === estudiante.estudiante_id}
                              onClick={() => handleDelete(estudiante)}
                            >
                              {deletingId === estudiante.estudiante_id ? 'Eliminando...' : 'Eliminar'}
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
      </Row>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton>
            <Modal.Title>Crear estudiante</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-grid gap-3">
              <Form.Group>
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  value={createDraft.nombre}
                  onChange={(e) => setCreateDraft((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Apellido</Form.Label>
                <Form.Control
                  type="text"
                  value={createDraft.apellido}
                  onChange={(e) => setCreateDraft((prev) => ({ ...prev, apellido: e.target.value }))}
                  required
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline-secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear estudiante'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Form onSubmit={handleUpdate}>
          <Modal.Header closeButton>
            <Modal.Title>Editar estudiante</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-grid gap-3">
              <Form.Group>
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  value={editDraft.nombre}
                  onChange={(e) => setEditDraft((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Apellido</Form.Label>
                <Form.Control
                  type="text"
                  value={editDraft.apellido}
                  onChange={(e) => setEditDraft((prev) => ({ ...prev, apellido: e.target.value }))}
                  required
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline-secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving || !editingId}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Estudiantes;
