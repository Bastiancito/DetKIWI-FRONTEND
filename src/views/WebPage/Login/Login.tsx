import React, { useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '../../../crud/auth'
import { ROUTES } from '../../../routes';
import type { LoginCredentials } from '../../../crud/auth'

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const credentials: LoginCredentials = { email, password };
            const response = await authService.login(credentials);
            
            if (response.data.access_token) {
                console.log('Login exitoso:', response.data.user);
                const user = response.data.user;
                if (user && user.rol_id === 2) {
                    navigate(ROUTES.PARALELOS);
                } else {
                    navigate(ROUTES.DASHBOARD);
                }
            } else {
                setError('Login failed: No access token received');
            }
        } catch (err: any) {
            console.error('Error en login:', err);
            setError(err.message || 'Error en el login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 py-5">
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={10} md={8} lg={5} xl={4}>
                    <Card className="surface-card border-0 shadow-lg">
                        <Card.Body className="p-4 p-lg-5">
                            <div className="text-center mb-4">
                                <span className="badge rounded-pill text-bg-light border mb-3 px-3 py-2">DetKIWI</span>
                                <h1 className="page-title h3 fw-bold mb-2">Iniciar sesion</h1>
                                <p className="text-secondary mb-0">Accede al panel para gestionar evaluaciones, sedes y reportes.</p>
                            </div>

                            <Form onSubmit={handleSubmit} className="d-grid gap-3">
                                <Form.Group controlId="email">
                                    <Form.Label>Correo electronico</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="nombre@usm.cl"
                                    />
                                </Form.Group>

                                <Form.Group controlId="password">
                                    <Form.Label>Contrasena</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Ingresa tu contrasena"
                                    />
                                </Form.Group>

                                {error && <Alert variant="danger" className="mb-0">{error}</Alert>}

                                <Button type="submit" size="lg" disabled={loading} className="fw-semibold mt-2">
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Ingresando...
                                        </>
                                    ) : 'Entrar'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;

