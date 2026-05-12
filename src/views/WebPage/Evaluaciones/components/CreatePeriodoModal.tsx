import { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { periodosService } from '../../../../crud';
import { toast } from 'react-toastify';
import type { CreatePeriodoData } from '../../../../crud/periodos';

interface CreatePeriodoModalProps {
  show: boolean;
  onClose: () => void;
  onPeriodoCreated: (periodoId: number) => Promise<void> | void;
}

const CreatePeriodoModal: React.FC<CreatePeriodoModalProps> = ({
  show,
  onClose,
  onPeriodoCreated
}) => {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [periodoForm, setPeriodoForm] = useState<CreatePeriodoData>({
    nombre: '',
    anio: new Date().getFullYear(),
    semestre: 1,
    activo: false
  });

  const handleCreatePeriodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: CreatePeriodoData = {
        ...periodoForm,
        nombre: `${periodoForm.anio}-${periodoForm.semestre}`
      };

      const response = await periodosService.crearPeriodo(payload);
      const newPeriodo = response.data.periodo;

      await onPeriodoCreated(newPeriodo.periodo_id);
      toast.success('Período creado correctamente');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'No fue posible crear el período');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Crear período</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleCreatePeriodo}>
        <Modal.Body className="d-grid gap-3">
          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}

          <Form.Group>
            <Form.Label>Año</Form.Label>
            <Form.Control
              type="number"
              value={periodoForm.anio}
              onChange={(e) => setPeriodoForm((prev) => ({ ...prev, anio: Number(e.target.value) }))}
              required
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Semestre</Form.Label>
            <Form.Select
              value={periodoForm.semestre}
              onChange={(e) => setPeriodoForm((prev) => ({ ...prev, semestre: Number(e.target.value) }))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </Form.Select>
          </Form.Group>

          <Form.Check
            type="switch"
            id="create-periodo-activo-switch"
            label="Crear como activo"
            checked={!!periodoForm.activo}
            onChange={(e) => setPeriodoForm((prev) => ({ ...prev, activo: e.target.checked }))}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Crear período'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreatePeriodoModal;