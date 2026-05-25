import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { paralelosService, sedesService } from '../../../../crud';
import type { Sede } from '../../interfaces';


interface CreateParaleloModalProps {
    show: boolean;
    onClose: () => void;
    onParaleloCreated: () => void;
}

interface ParaleloDraft {
    nombre: string;
    sede_id: number;
    sede_nombre: string;
}

const CreateParaleloModal: React.FC<CreateParaleloModalProps> = ({ show, onClose, onParaleloCreated }) => {
    const [nombre, setNombre] = useState('');
    const [sedeId, setSedeId] = useState<number | ''>('');
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [paralelosPendientes, setParalelosPendientes] = useState<ParaleloDraft[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!show) {
            return;
        }

        const loadCatalogs = async () => {
            setLoadingCatalogs(true);
            setError('');
            try {
                const sedesResponse = await sedesService.getAllSedes();

                setSedes(sedesResponse.data as unknown as Sede[]);
            } catch {
                setError('Error al obtener sedes');
            } finally {
                setLoadingCatalogs(false);
            }
        };

        loadCatalogs();
    }, [show]);

    const resetForm = () => {
        setNombre('');
        setSedeId('');
        setParalelosPendientes([]);
        setError('');
    };

    const handleClose = () => {
        if (saving) {
            return;
        }
        resetForm();
        onClose();
    };

    const handleAddOneParalelo = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        setError('');

        const nombreNormalizado = nombre.trim();
        if (!nombreNormalizado) {
            setError('Debes ingresar el nombre del paralelo');
            return;
        }

        const payload: { nombre: string; sede_id?: number } = {
            nombre: nombreNormalizado
        };

        if (sedeId) {
            const sedeSeleccionada = sedes.find((sede) => sede.sede_id === sedeId);
            if (!sedeSeleccionada) {
                setError('La sede seleccionada no es valida');
                return;
            }

            payload.sede_id = sedeId;
        }

        setSaving(true);
        paralelosService.createParalelo(payload).then(() => {
            onParaleloCreated();
            resetForm();
        }).catch(() => {
            setError('Error al crear el paralelo');
        }).finally(() => {
            setSaving(false);
        });
    };

    const handleAddParalelo = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const nombreNormalizado = nombre.trim();
        if (!sedeId) {
            setError('Debes seleccionar una sede');
            return;
        }

        if (!nombreNormalizado) {
            setError('Debes ingresar el nombre del paralelo');
            return;
        }

        const sedeSeleccionada = sedes.find((sede) => sede.sede_id === sedeId);
        if (!sedeSeleccionada) {
            setError('La sede seleccionada no es valida');
            return;
        }

        const yaExisteEnLista = paralelosPendientes.some(
            (paralelo) => paralelo.nombre.toLowerCase() === nombreNormalizado.toLowerCase()
                && paralelo.sede_id === sedeId
        );

        if (yaExisteEnLista) {
            setError('Ese paralelo ya esta agregado en la lista');
            return;
        }

        setParalelosPendientes((prev) => [
            ...prev,
            {
                nombre: nombreNormalizado,
                sede_id: sedeId,
                sede_nombre: sedeSeleccionada.nombre
            }
        ]);
        setNombre('');
    };

    const removeParaleloPendiente = (indexToRemove: number) => {
        setParalelosPendientes((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleCreateListado = async () => {
        if (paralelosPendientes.length === 0) {
            setError('Agrega al menos un paralelo a la lista');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await paralelosService.CrearListadoDeParalelos(
                paralelosPendientes.map((paralelo) => ({
                    nombre: paralelo.nombre,
                    sede_id: paralelo.sede_id
                }))
            );

            onParaleloCreated();
            handleClose();
        } catch {
            setError('Error al crear el listado de paralelos');
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = () => {
        if (paralelosPendientes.length === 0) {
            handleAddOneParalelo();
        } else {
            handleCreateListado();
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Crear paralelo</Modal.Title>
            </Modal.Header>
            <Form onSubmit={(e) => {
                e.preventDefault();
                handleAddParalelo(e);
            }}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
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
                                disabled={loadingCatalogs}
                            >
                                <option value="">Sin sede por ahora</option>
                                {sedes.map((sede) => (
                                    <option key={sede.sede_id} value={sede.sede_id}>
                                        {sede.nombre}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-secondary">
                                Puedes dejarla vacía para crear el paralelo sin sede y vincularlo después.
                            </Form.Text>
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button type="submit" variant="outline-primary" disabled={saving || loadingCatalogs}>
                                Agregar a lista
                            </Button>
                        </div>

                        <div>
                            <Form.Label className="fw-semibold">Paralelos en lista</Form.Label>
                            {paralelosPendientes.length === 0 ? (
                                <div className="text-secondary small">Aun no hay paralelos agregados.</div>
                            ) : (
                                <div className="d-grid gap-2">
                                    {paralelosPendientes.map((paralelo, index) => (
                                        <div key={`${paralelo.nombre}-${paralelo.sede_id}-${index}`} className="border rounded p-2 d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-semibold">{paralelo.nombre}</div>
                                                <div className="text-secondary small">{paralelo.sede_nombre}</div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => removeParaleloPendiente(index)}
                                                disabled={saving}
                                            >
                                                Quitar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button" variant="outline-secondary" onClick={handleClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="primary" disabled={saving || loadingCatalogs || (paralelosPendientes.length === 0 && !nombre.trim())} onClick={handleCreate}>
                        {saving ? 'Creando...' : paralelosPendientes.length === 0 ? 'Crear paralelo' : 'Crear listado'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default CreateParaleloModal;