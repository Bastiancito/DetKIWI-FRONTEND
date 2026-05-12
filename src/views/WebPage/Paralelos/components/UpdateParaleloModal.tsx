import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { paralelosService, sedesService } from '../../../../crud';
import type { Paralelo, Sede } from '../../interfaces';

interface UpdateParaleloModalProps {
    show: boolean;
    paraleloId: number | null;
    onClose: () => void;
    onParaleloUpdated: () => void;
}

const UpdateParaleloModal: React.FC<UpdateParaleloModalProps> = ({ show, paraleloId, onClose, onParaleloUpdated }) => {
    const [nombre, setNombre] = useState('');
    const [sedeId, setSedeId] = useState<number | ''>('');
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!show || !paraleloId) {
            return;
        }

        const loadData = async () => {
            setLoadingData(true);
            setError('');

            try {
                const [sedesResponse, paraleloResponse] = await Promise.all([
                    sedesService.getAllSedes(),
                    paralelosService.getParaleloById(paraleloId)
                ]);

                const paralelo = paraleloResponse.data as unknown as Paralelo;

                setSedes(sedesResponse.data as unknown as Sede[]);
                setNombre(paralelo.nombre || '');
                setSedeId(paralelo.sede_id || '');
            } catch {
                setError('Error al obtener datos del paralelo');
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [show, paraleloId]);

    const handleClose = () => {
        if (saving) {
            return;
        }
        onClose();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!paraleloId || !sedeId) {
            setError('Debes completar todos los campos');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await paralelosService.updateParalelo(paraleloId, {
                nombre,
                sede_id: sedeId
            });

            onParaleloUpdated();
            handleClose();
        } catch {
            setError('Error al actualizar el paralelo');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Editar paralelo</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {loadingData ? (
                        <div className="d-flex align-items-center gap-2">
                            <Spinner animation="border" size="sm" />
                            <span>Cargando datos...</span>
                        </div>
                    ) : (
                        <div className="d-grid gap-3">
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
                                <Form.Label>Sede</Form.Label>
                                <Form.Select
                                    value={sedeId}
                                    onChange={(e) => setSedeId(e.target.value ? Number(e.target.value) : '')}
                                    required
                                >
                                    <option value="">Seleccionar sede</option>
                                    {sedes.map((sede) => (
                                        <option key={sede.sede_id} value={sede.sede_id}>
                                            {sede.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button" variant="outline-secondary" onClick={handleClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving || loadingData}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default UpdateParaleloModal;