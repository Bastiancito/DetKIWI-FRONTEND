import { useState, useEffect } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import type { Paralelo, Sede, Usuario } from '../interfaces';
import { authService, paralelosService, sedesService, usersService } from "../../../crud";
import CreateUsuarioModal from './components/CreateUsuarioModal/CreateUsuarioModal';
import UpdateUsuarioModal from './components/UpdateUsuarioModal/UpdateUsuarioModal';

const Usuarios: React.FC = () => {
    const currentUser = authService.getCurrentUser();
    const currentUserId = currentUser?.id ? Number(currentUser.id) : null;
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
        const [sedes, setSedes] = useState<Sede[]>([]);
        const [paralelos, setParalelos] = useState<Paralelo[]>([]);
        const [loading,setLoading] = useState(true);
        const [error,setError] = useState('');
        const [search, setSearch] = useState('');
        const [selectedSedeId, setSelectedSedeId] = useState<number | ''>('');
        const [selectedParaleloId, setSelectedParaleloId] = useState<number | ''>('');
        const [showCreateModal, setShowCreateModal] = useState(false);
        const [showUpdateModal, setShowUpdateModal] = useState(false);
        const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

        const fetchUsuarios = async () => {
            const usersResponse = await usersService.getAllUsers();
            const basicUsers = usersResponse.data as unknown as Usuario[];

            const usersWithDetails = await Promise.all(
                basicUsers.map(async (usuario) => {
                    try {
                        const detailResponse = await usersService.getUserById(usuario.user_id);
                        return detailResponse.data as unknown as Usuario;
                    } catch {
                        return {
                            ...usuario,
                            paralelos: usuario.paralelos || []
                        } as Usuario;
                    }
                })
            );

            setUsuarios(usersWithDetails);
        };

        const fetchInitialData = async () => {
            setLoading(true);
            setError('');
            try {
                const [sedesResponse, paralelosResponse] = await Promise.all([
                    sedesService.getAllSedes(),
                    paralelosService.getAllParalelos()
                ]);

                setSedes(sedesResponse.data as unknown as Sede[]);
                setParalelos(paralelosResponse.data as unknown as Paralelo[]);
                await fetchUsuarios();
            } catch {
                setError('Error al obtener los usuarios');
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            fetchInitialData();
        }, []);

        const filteredParalelos = selectedSedeId
            ? paralelos.filter((paralelo) => paralelo.sede_id === selectedSedeId)
            : paralelos;

        const filteredUsuarios = usuarios.filter((usuario) => {
            const usernameMatches = usuario.username.toLowerCase().includes(search.toLowerCase());

            const sedeMatches = !selectedSedeId
                || (usuario.paralelos || []).some((paralelo) => paralelo.sede_id === selectedSedeId);

            const paraleloMatches = !selectedParaleloId
                || (usuario.paralelos || []).some((paralelo) => paralelo.paralelo_id === selectedParaleloId);

            return usernameMatches && sedeMatches && paraleloMatches;
        });




        const handleOpenUpdate = (userId: number) => {
            setSelectedUserId(userId);
            setShowUpdateModal(true);
        };

        const handleUserCreated = async () => {
            await fetchUsuarios();
        };

        const handleUserUpdated = async () => {
            await fetchUsuarios();
        };

        const renderTable = () => {
        if (loading) {
            return (<Spinner animation="border" />);
        }

        if (error) {
            return (<Alert variant="danger">{error}</Alert>);
        }

                if (filteredUsuarios.length === 0) {
                    return <div className="p-4 text-secondary">No hay usuarios que coincidan con los filtros.</div>;
                }

        return (
                    <Table responsive hover className="mb-0 align-middle">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Paralelos</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsuarios.map((usuario) => {
                                const isCurrentUser = currentUserId === usuario.user_id;

                                return (
                                <tr key={usuario.user_id} className={isCurrentUser ? 'table-primary' : ''}>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <span>{usuario.username}</span>
                                            {isCurrentUser && (
                                                <Badge bg="primary" pill>Tu usuario</Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td>{usuario.email}</td>
                                    <td>{usuario.rol_id ?? '-'}</td>
                                    <td>
                                        {(usuario.paralelos || []).length > 0
                                            ? usuario.paralelos?.map((paralelo) => paralelo.nombre).join(', ')
                                            : '-'}
                                    </td>
                                    <td className="text-end">
                                        <Button
                                            type="button"
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleOpenUpdate(usuario.user_id)}
                                        >
                                            Editar usuario
                                        </Button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </Table>

    );

    };

    return (
        <div className="w-100">
            <Row className="g-4">
                <Col xs={12}>
                    <Card className="surface-card page-hero border-0">
                        <Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                            <div>
                                <h1 className="page-title h2 fw-bold mb-2">Usuarios registrados</h1>
                            </div>
                            <Badge bg="primary" pill className="fs-6 px-3 py-2 align-self-start align-self-lg-center">
                                {usuarios.length} usuarios
                            </Badge>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12}>
                    <Card className="surface-card border-0">
                                                <Card.Body className="p-4 border-bottom">
                                                        <Row className="g-3 align-items-end">
                                                                <Col xs={12} lg={4}>
                                                                        <Form.Group>
                                                                                <Form.Label>Buscar usuario</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    placeholder="Buscar por nombre de usuario"
                                                                                    value={search}
                                                                                    onChange={(e) => setSearch(e.target.value)}
                                                                                />
                                                                        </Form.Group>
                                                                </Col>
                                                                <Col xs={12} lg={3}>
                                                                        <Form.Group>
                                                                                <Form.Label>Filtrar por sede</Form.Label>
                                                                                <Form.Select
                                                                                    value={selectedSedeId}
                                                                                    onChange={(e) => {
                                                                                        const nextSedeId = e.target.value ? Number(e.target.value) : '';
                                                                                        setSelectedSedeId(nextSedeId);
                                                                                        setSelectedParaleloId('');
                                                                                    }}
                                                                                >
                                                                                    <option value="">Todas las sedes</option>
                                                                                    {sedes.map((sede) => (
                                                                                        <option key={sede.sede_id} value={sede.sede_id}>
                                                                                            {sede.nombre}
                                                                                        </option>
                                                                                    ))}
                                                                                </Form.Select>
                                                                        </Form.Group>
                                                                </Col>
                                                                <Col xs={12} lg={3}>
                                                                        <Form.Group>
                                                                                <Form.Label>Filtrar por paralelo</Form.Label>
                                                                                <Form.Select
                                                                                    value={selectedParaleloId}
                                                                                    onChange={(e) => setSelectedParaleloId(e.target.value ? Number(e.target.value) : '')}
                                                                                >
                                                                                    <option value="">Todos los paralelos</option>
                                                                                    {filteredParalelos.map((paralelo) => (
                                                                                        <option key={paralelo.paralelo_id} value={paralelo.paralelo_id}>
                                                                                            {paralelo.nombre}
                                                                                        </option>
                                                                                    ))}
                                                                                </Form.Select>
                                                                        </Form.Group>
                                                                </Col>
                                                                <Col xs={12} lg={2} className="d-grid">
                                                                        <Button type="button" variant="primary" onClick={() => setShowCreateModal(true)}>
                                                                                Crear usuario
                                                                        </Button>
                                                                </Col>
                                                        </Row>
                                                </Card.Body>
                                                <Card.Body className="p-0">
                            {renderTable()}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

                        <CreateUsuarioModal
                            show={showCreateModal}
                            onClose={() => setShowCreateModal(false)}
                            onUserCreated={handleUserCreated}
                        />

                        <UpdateUsuarioModal
                            show={showUpdateModal}
                            userId={selectedUserId}
                            onClose={() => {
                                setShowUpdateModal(false);
                                setSelectedUserId(null);
                            }}
                            onUserUpdated={handleUserUpdated}
                        />
        </div>
    );
}


export default Usuarios;
