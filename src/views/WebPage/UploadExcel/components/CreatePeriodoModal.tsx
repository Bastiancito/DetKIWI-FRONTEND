import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { periodosService } from '../../../../crud';
import type { Periodo } from '../../../../crud';

interface CreatePeriodoModalProps {
    evaluacionId: number;
    onClose: () => void;
    onPeriodoCreated: (periodo: Periodo) => void;
}

const currentYear = new Date().getFullYear();

const CreatePeriodoModal: React.FC<CreatePeriodoModalProps> = ({
    onClose,
    onPeriodoCreated,
}) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [anio, setAnio] = useState(currentYear);
    const [semestre, setSemestre] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleCreatePeriodo = async () => {
        if (!nombre.trim()) {
            toast.error('El nombre del período es obligatorio');
            return;
        }

        setLoading(true);

        try {
            const response = await periodosService.crearPeriodo({
                nombre: descripcion.trim() ? `${nombre.trim()} - ${descripcion.trim()}` : nombre.trim(),
                anio,
                semestre,
            });

            if (response.status === 200 || response.status === 201) {
                toast.success(response.message || 'Período creado exitosamente');
                onPeriodoCreated(response.data.periodo);
                onClose();
                return;
            }

            toast.error('Error al crear el período');
        } catch (error: any) {
            toast.error(error.message || 'Error al crear el período');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Crear nuevo período</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3" controlId="periodoNombre">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ej: 2026-1"
                            value={nombre}
                            onChange={(event) => setNombre(event.target.value)}
                            disabled={loading}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="periodoDescripcion">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Opcional"
                            value={descripcion}
                            onChange={(event) => setDescripcion(event.target.value)}
                            disabled={loading}
                        />
                    </Form.Group>

                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <Form.Group controlId="periodoAnio">
                                <Form.Label>Año</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={anio}
                                    onChange={(event) => setAnio(Number(event.target.value))}
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>

                        <div className="col-12 col-md-6">
                            <Form.Group controlId="periodoSemestre">
                                <Form.Label>Semestre</Form.Label>
                                <Form.Select
                                    value={semestre}
                                    onChange={(event) => setSemestre(Number(event.target.value))}
                                    disabled={loading}
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </div>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleCreatePeriodo} disabled={loading}>
                    {loading ? 'Creando...' : 'Crear período'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CreatePeriodoModal;




