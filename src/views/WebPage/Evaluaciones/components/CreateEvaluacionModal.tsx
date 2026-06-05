import { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { evaluacionesService } from '../../../../crud';
import { toast } from 'react-toastify';
import type { CreateEvaluacionData } from '../../../../crud/evaluaciones';
import type { Periodo } from '../../../../crud/periodos';
import { getErrorMessage, isSuccessfulResponse } from '../../../../crud/responseHelpers';

interface CreateEvaluacionModalProps {
  show: boolean;
  periodos: Periodo[];
  selectedPeriodoId: number | '';
  loadingPeriodos: boolean;
  onClose: () => void;
  onSelectPeriodo: (periodoId: number | '') => void;
  onEvaluacionCreated: () => Promise<void> | void;
}

const CreateEvaluacionModal: React.FC<CreateEvaluacionModalProps> = ({
  show,
  periodos,
  selectedPeriodoId,
  loadingPeriodos,
  onClose,
  onSelectPeriodo,
  onEvaluacionCreated
}) => {
  const [error, setError] = useState('');
  const [savingEvaluacion, setSavingEvaluacion] = useState(false);

  const [evaluacionForm, setEvaluacionForm] = useState<CreateEvaluacionData>({
    nombre: '',
    descripcion: '',
    fecha_entrega: '',
    periodo_id: 0
  });

  const resetEvaluacionForm = () => {
    setEvaluacionForm({
      nombre: '',
      descripcion: '',
      fecha_entrega: '',
      periodo_id: selectedPeriodoId || 0
    });
  };

  const handleCreateEvaluacion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPeriodoId) {
      setError('Selecciona un período primero');
      return;
    }

    setSavingEvaluacion(true);
    setError('');

    try {
      const payload: CreateEvaluacionData = {
        nombre: evaluacionForm.nombre,
        descripcion: evaluacionForm.descripcion,
        fecha_entrega: evaluacionForm.fecha_entrega || undefined,
        periodo_id: selectedPeriodoId
      };

      const response = await evaluacionesService.crearEvaluacion(payload);
      if (!isSuccessfulResponse(response)) {
        throw new Error('No fue posible crear la evaluación');
      }

      await onEvaluacionCreated();
      resetEvaluacionForm();
      toast.success('Evaluación creada correctamente');
    } catch (err: any) {
      setError(getErrorMessage(err, 'No fue posible crear la evaluación'));
    } finally {
      setSavingEvaluacion(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Crear evaluación</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-grid gap-3">
        {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
        <Form onSubmit={handleCreateEvaluacion} className="d-grid gap-3">
          <Form.Group>
            <Form.Label>Período</Form.Label>
            <Form.Select
              value={selectedPeriodoId}
              onChange={(e) => onSelectPeriodo(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingPeriodos}
            >
              <option value="">Selecciona un período</option>
              {periodos.map((periodo) => (
                <option key={periodo.periodo_id} value={periodo.periodo_id}>
                  {periodo.nombre}{periodo.activo ? ' (activo)' : ''}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={evaluacionForm.nombre}
              onChange={(e) => setEvaluacionForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={evaluacionForm.descripcion || ''}
              onChange={(e) => setEvaluacionForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Fecha entrega</Form.Label>
            <Form.Control
              type="datetime-local"
              value={evaluacionForm.fecha_entrega || ''}
              onChange={(e) => setEvaluacionForm((prev) => ({ ...prev, fecha_entrega: e.target.value }))}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button type="button" variant="outline-secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={savingEvaluacion || !selectedPeriodoId}>
              {savingEvaluacion ? 'Creando...' : 'Crear evaluación'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateEvaluacionModal;