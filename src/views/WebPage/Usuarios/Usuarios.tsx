import { useState, useEffect } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import type { Paralelo, Sede, Usuario } from '../interfaces';
import { authService, paralelosService, sedesService, usersService } from "../../../crud";
import type { UploadParticipantesResponse } from "../../../crud";
import CreateUsuarioModal from './components/CreateUsuarioModal/CreateUsuarioModal';
import UpdateUsuarioModal from './components/UpdateUsuarioModal/UpdateUsuarioModal';
import RequireRole from '../../../components/RequireRole';

const ALLOWED_IMPORT_EXTENSIONS = ['xlsx', 'xls', 'csv'];

const isAllowedImportFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return !!extension && ALLOWED_IMPORT_EXTENSIONS.includes(extension);
};

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
        const [participantsFile, setParticipantsFile] = useState<File | null>(null);
        const [participantsInputKey, setParticipantsInputKey] = useState(0);
        const [participantsUploading, setParticipantsUploading] = useState(false);
        const [participantsError, setParticipantsError] = useState('');
        const [participantsResult, setParticipantsResult] = useState<UploadParticipantesResponse | null>(null);

        const fetchUsuarios = async () => {
            try {
                const usersResponse = await usersService.getAllUsers();
                const basicUsers = usersResponse.data as unknown as Usuario[];

                // Usar la data que ya entrega `getAllUsers` en lugar de
                // hacer una llamada por cada usuario a `getUserById`.
                setUsuarios(basicUsers.map((u) => ({ ...u, paralelos: u.paralelos || [] })));
            } catch {
                setError('Error al obtener los usuarios');
            }
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

        const handleParticipantsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = event.target.files ? event.target.files[0] : null;
            setParticipantsFile(selectedFile);
            setParticipantsError('');
            setParticipantsResult(null);

            if (selectedFile && !isAllowedImportFile(selectedFile)) {
                event.target.value = '';
                setParticipantsFile(null);
                setParticipantsError('Formato inválido. Usa .xlsx, .xls o .csv.');
                toast.error('Formato inválido. Usa .xlsx, .xls o .csv.');
            }
        };

        const handleParticipantsUpload = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!participantsFile) {
                setParticipantsError('Selecciona un archivo antes de importar');
                toast.error('Selecciona un archivo antes de importar');
                return;
            }

            setParticipantsUploading(true);
            setParticipantsError('');
            setParticipantsResult(null);

            try {
                const response = await usersService.uploadParticipantes(participantsFile);
                const result = response.data;

                setParticipantsResult(result);
                toast.success(`Importación completada: ${result.usuarios_creados} usuarios creados y ${result.usuarios_actualizados} actualizados`);

                await fetchInitialData();
                setParticipantsFile(null);
                setParticipantsInputKey((current) => current + 1);
            } catch (err: any) {
                const errorMessage = err.message || err.data?.msg || 'Error al importar participantes';
                setParticipantsError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setParticipantsUploading(false);
            }
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
                                    <td>
                                        {(usuario.paralelos || []).length > 0
                                            ? usuario.paralelos?.map((paralelo) => (<Badge key={usuario.user_id + '-' + paralelo.paralelo_id} bg="light" text="dark" pill className="border">
                                                {paralelo.nombre}
                                                {paralelo.sede_nombre ? ` · ${paralelo.sede_nombre}` : ''}
                                            </Badge>))
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
        <RequireRole allowedRoles={[1]}>
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
                        <Card.Body className="p-4 p-lg-5">
                            <Row className="g-4 align-items-center">
                                <Col lg={7}>
                                    <h2 className="h4 fw-bold mb-2">Importar participantes</h2>
                                </Col>
                                <Col lg={5}>
                                    <Form onSubmit={handleParticipantsUpload} className="d-grid gap-3">
                                        <Form.Group controlId="participantsFile">
                                            <Form.Label className="fw-semibold">Archivo</Form.Label>
                                            <Form.Control
                                                key={participantsInputKey}
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={handleParticipantsFileChange}
                                                disabled={participantsUploading}
                                            />
                                            <Form.Text className="text-secondary">
                                                Formatos soportados: .xlsx, .xls y .csv.
                                            </Form.Text>
                                        </Form.Group>

                                        {participantsError && <Alert variant="danger" className="mb-0">{participantsError}</Alert>}

                                        {participantsResult && (
                                            <Alert variant="success" className="mb-0">
                                                <Alert.Heading className="h6 fw-bold">Importación exitosa</Alert.Heading>
                                                <div className="d-grid gap-1">
                                                    <span><strong>Procesados:</strong> {participantsResult.total_procesados}</span>
                                                    <span><strong>Usuarios creados:</strong> {participantsResult.usuarios_creados}</span>
                                                    <span><strong>Usuarios actualizados:</strong> {participantsResult.usuarios_actualizados}</span>
                                                </div>
                                            </Alert>
                                        )}

                                        <div className="d-flex justify-content-end">
                                            <Button type="submit" variant="primary" disabled={participantsUploading || !participantsFile}>
                                                {participantsUploading ? 'Importando...' : 'Importar participantes'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Col>
                            </Row>
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
        </RequireRole>
    );
}


export default Usuarios;
