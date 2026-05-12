import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Form, ListGroup, Modal, Spinner } from "react-bootstrap";
import type { Paralelo, Rol, Usuario } from "../../../interfaces";
import { paralelosService, rolesService, usersService } from "../../../../../crud";

interface UpdateUsuarioModalProps {
    show: boolean;
    userId: number | null;
    onClose: () => void;
    onUserUpdated: () => void;
}

const UpdateUsuarioModal: React.FC<UpdateUsuarioModalProps> = ({ show, userId, onClose, onUserUpdated }) => {
        const [loadingData, setLoadingData] = useState(false);
        const [saving, setSaving] = useState(false);
        const [error, setError] = useState('');
        const [nombre, setNombre] = useState('');
        const [email, setEmail] = useState('');
        const [rolId, setRolId] = useState<number | ''>('');
    const [roles, setRoles] = useState<Rol[]>([]);
    const [paralelos, setParalelos] = useState<Paralelo[]>([]);
        const [selectedParaleloId, setSelectedParaleloId] = useState<number | ''>('');
        const [selectedParaleloIds, setSelectedParaleloIds] = useState<number[]>([]);

        const selectedParalelos = useMemo(
            () => paralelos.filter((paralelo) => selectedParaleloIds.includes(paralelo.paralelo_id)),
            [paralelos, selectedParaleloIds]
        );

        const getEncargadoNombre = (paralelo: Paralelo) => paralelo.usuario?.username || paralelo.usuarios?.[0]?.username;

    useEffect(() => {
            if (!show || !userId) {
                return;
            }

            const fetchData = async () => {
                setLoadingData(true);
                setError('');
                try {
                    const [paralelosData, rolesData, userData] = await Promise.all([
                        paralelosService.getAllParalelos(),
                        rolesService.getAllRoles(),
                        usersService.getUserById(userId)
                    ]);

                    const user = userData.data as unknown as Usuario;

                    setParalelos(paralelosData.data as unknown as Paralelo[]);
                    setRoles(rolesData.data as unknown as Rol[]);
                    setNombre(user.username || '');
                    setEmail(user.email || '');
                    setRolId(user.rol_id ?? '');
                    setSelectedParaleloIds((user.paralelos || []).map((paralelo) => paralelo.paralelo_id));
                    setSelectedParaleloId('');
                } catch {
                    setError('Error al obtener datos del usuario');
                } finally {
                    setLoadingData(false);
                }
            };

            fetchData();
        }, [show, userId]);

        const handleAddParalelo = () => {
            if (!selectedParaleloId) {
                return;
            }

            setSelectedParaleloIds((prev) => {
                if (prev.includes(selectedParaleloId)) {
                    return prev;
                }
                return [...prev, selectedParaleloId];
            });
            setSelectedParaleloId('');
        };

        const handleRemoveParalelo = (paraleloId: number) => {
            setSelectedParaleloIds((prev) => prev.filter((id) => id !== paraleloId));
        };

        const handleClose = () => {
            if (saving) {
                return;
            }
            onClose();
        };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!userId || !rolId) {
                setError('Debes seleccionar un rol');
                return;
            }

            setSaving(true);
            setError('');
            try {
                await usersService.updateUser(userId, {
                    username: nombre,
                    email,
                    rol_id: rolId,
                    paralelo_ids: selectedParaleloIds
                });
                onUserUpdated();
                handleClose();
            } catch {
                setError('Error al actualizar el usuario');
            } finally {
                setSaving(false);
            }
    };

        return (
            <Modal show={show} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Editar usuario</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                        {loadingData ? (
                            <div className="d-flex align-items-center gap-2">
                                <Spinner animation="border" size="sm" />
                                <span>Cargando datos del usuario...</span>
                            </div>
                        ) : (
                            <div className="d-grid gap-3">
                                <Form.Group>
                                    <Form.Label>Nombre de usuario</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label>Correo electrónico</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label>Rol</Form.Label>
                                    <Form.Select
                                        value={rolId}
                                        onChange={(e) => setRolId(e.target.value ? Number(e.target.value) : '')}
                                        required
                                    >
                                        <option value="">Seleccionar rol</option>
                                        {roles.map((rol) => (
                                            <option key={rol.rol_id} value={rol.rol_id}>
                                                {rol.nombre}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label>Agregar paralelo</Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Select
                                            value={selectedParaleloId}
                                            onChange={(e) => setSelectedParaleloId(e.target.value ? Number(e.target.value) : '')}
                                        >
                                            <option value="">Seleccionar paralelo</option>
                                            {paralelos.map((paralelo) => (
                                                <option key={paralelo.paralelo_id} value={paralelo.paralelo_id}>
                                                    {paralelo.nombre}{getEncargadoNombre(paralelo) ? ` - Encargado: ${getEncargadoNombre(paralelo)}` : ''}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Button type="button" variant="outline-primary" onClick={handleAddParalelo}>
                                            Agregar
                                        </Button>
                                    </div>
                                </Form.Group>

                                <div>
                                    <div className="fw-semibold mb-2">Paralelos seleccionados</div>
                                    {selectedParalelos.length === 0 ? (
                                        <div className="text-secondary small">No hay paralelos seleccionados.</div>
                                    ) : (
                                        <ListGroup>
                                            {selectedParalelos.map((paralelo) => (
                                                <ListGroup.Item key={paralelo.paralelo_id} className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span>{paralelo.nombre}</span>
                                                        {paralelo.sede_nombre && <Badge bg="secondary">{paralelo.sede_nombre}</Badge>}
                                                        {getEncargadoNombre(paralelo) && <Badge bg="warning" text="dark">Encargado: {getEncargadoNombre(paralelo)}</Badge>}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveParalelo(paralelo.paralelo_id)}
                                                    >
                                                        Quitar
                                                    </Button>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </div>
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
}

export default UpdateUsuarioModal;




