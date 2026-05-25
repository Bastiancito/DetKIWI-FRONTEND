import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Form, ListGroup, Modal, Spinner } from "react-bootstrap";
import type { Paralelo, Rol, Usuario } from "../../../interfaces";
import { paralelosService, rolesService, usersService } from "../../../../../crud";
interface CreateUsuarioModalProps {
    show: boolean;
    onClose: () => void;
    onUserCreated: (usuario: Usuario) => void;
}

const CreateUsuarioModal: React.FC<CreateUsuarioModalProps> = ({ show, onClose, onUserCreated }) => {
        const [saving, setSaving] = useState(false);
        const [loadingCatalogs, setLoadingCatalogs] = useState(false);
        const [error, setError] = useState('');
        const [username, setUsername] = useState('');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
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

        const resetForm = () => {
            setUsername('');
            setEmail('');
            setPassword('');
            setRolId('');
            setSelectedParaleloId('');
            setSelectedParaleloIds([]);
            setError('');
        };

    useEffect(() => {
            if (!show) {
                return;
            }

            const fetchCatalogs = async () => {
                setLoadingCatalogs(true);
                setError('');
                try {
                    const [paralelosData, rolesData] = await Promise.all([
                        paralelosService.getAllParalelos(),
                        rolesService.getAllRoles()
                    ]);

                    setParalelos(paralelosData.data as unknown as Paralelo[]);
                    setRoles(rolesData.data as unknown as Rol[]);
                } catch {
                    setError('Error al obtener roles y paralelos');
                } finally {
                    setLoadingCatalogs(false);
                }
            };

            fetchCatalogs();
        }, [show]);

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
            resetForm();
            onClose();
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!rolId) {
                setError('Debes seleccionar un rol');
                return;
            }

            setSaving(true);
            setError('');
            try {
                const response = await usersService.createUser({
                    username,
                    email,
                    password,
                    rol_id: rolId,
                    paralelo_ids: selectedParaleloIds
                });

                onUserCreated(response.data as unknown as Usuario);
                handleClose();
            } catch {
                setError('Error al crear el usuario');
            } finally {
                setSaving(false);
            }
        };

        return (
            <Modal show={show} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Crear usuario</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                        {loadingCatalogs ? (
                            <div className="d-flex align-items-center gap-2">
                                <Spinner animation="border" size="sm" />
                                <span>Cargando catálogos...</span>
                            </div>
                        ) : (
                            <div className="d-grid gap-3">
                                <Form.Group>
                                    <Form.Label>Nombre de usuario</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
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
                                    <Form.Label>Contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                                                    {paralelo.nombre}{paralelo.sede_nombre ? ` - ${paralelo.sede_nombre}` : ' - Sin sede'}{getEncargadoNombre(paralelo) ? ` - Encargado: ${getEncargadoNombre(paralelo)}` : ''}
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
                                                        {paralelo.sede_nombre ? <Badge bg="secondary">{paralelo.sede_nombre}</Badge> : <Badge bg="warning" text="dark">Sin sede</Badge>}
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
                        <Button type="submit" variant="primary" disabled={saving || loadingCatalogs}>
                            {saving ? 'Creando...' : 'Crear usuario'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        );
}
export default CreateUsuarioModal;
