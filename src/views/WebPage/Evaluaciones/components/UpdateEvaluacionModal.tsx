import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Modal } from 'react-bootstrap';
import { evaluacionesService } from '../../../../crud';
import { toast } from 'react-toastify';
import type { Evaluacion } from '../../../../crud/evaluaciones';

interface UpdateEvaluacionModalProps {
  show: boolean;
  evaluacion: Evaluacion | null;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
}

const UpdateEvaluacionModal: React.FC<UpdateEvaluacionModalProps> = ({
  show,
  evaluacion,
  onClose,
  onUpdated
}) => {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    if (!show || !evaluacion) {
      return;
    }

    setNombre(evaluacion.nombre || '');
    setDescripcion(evaluacion.descripcion || '');
    setFechaEntrega(evaluacion.fecha_entrega ? evaluacion.fecha_entrega.slice(0, 16) : '');
    setActivo(evaluacion.activo ?? false);
    setError('');
  }, [show, evaluacion?.evaluacion_id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!evaluacion) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      let estadoFinal = activo;

      await evaluacionesService.actualizarEvaluacion(evaluacion.evaluacion_id, {
        nombre,
        descripcion,
        fecha_entrega: fechaEntrega || undefined
      });

      if ((evaluacion.activo ?? false) !== activo) {
        const toggleResponse = await evaluacionesService.toggleEstadoEvaluacion(evaluacion.evaluacion_id);
        estadoFinal = toggleResponse.data?.evaluacion?.activo ?? activo;
        setActivo(estadoFinal);
      }

      await onUpdated();
      toast.success(`Evaluación actualizada correctamente. Estado: ${estadoFinal ? 'Activa' : 'Inactiva'}`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'No fue posible actualizar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Actualizar evaluación</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="d-grid gap-3">
          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}

          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Fecha entrega</Form.Label>
            <Form.Control
              type="datetime-local"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />
          </Form.Group>

          <div className="d-flex align-items-center justify-content-between border rounded px-3 py-2">
            <Form.Check
              type="switch"
              id="update-evaluacion-activa"
              label="Evaluación activa"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="mb-0"
            />
            {activo ? <Badge bg="success">Activa</Badge> : <Badge bg="secondary">Inactiva</Badge>}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UpdateEvaluacionModal;