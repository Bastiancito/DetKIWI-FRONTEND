import React from 'react';
import { Button, Container, Nav, Navbar as BootstrapNavbar } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../crud/auth';
import { NAVIGATION_ITEMS, ROUTES } from '../routes';
import './Navbar.css';

interface NavbarProps {
  className?: string;  
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentUser = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate(ROUTES.LOGIN);
  };

  if (!isAuthenticated) return null;

  return (
    <BootstrapNavbar expand="lg" sticky="top" className={`app-navbar ${className}`}>
      <Container fluid className="px-3 px-lg-4">
        <BootstrapNavbar.Brand as={Link} to={ROUTES.DASHBOARD} className="fw-bold brand-mark">
          DetKIWI
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="app-navbar-nav" />

        <BootstrapNavbar.Collapse id="app-navbar-nav">
          <Nav className="me-auto gap-lg-2 py-3 py-lg-0">
            {NAVIGATION_ITEMS.map((item) => (
              <Nav.Link
                as={Link}
                to={item.path}
                key={item.path}
                active={location.pathname === item.path}
                className="app-nav-link"
              >
                {item.name}
              </Nav.Link>
            ))}
          </Nav>

          <div className="nav-user ms-lg-3">
            {currentUser && (
              <span className="nav-user-label">
                {currentUser.username || currentUser.email}
              </span>
            )}
            <Button variant="light" className="logout-button" onClick={handleLogout}>
              Cerrar sesion
            </Button>
          </div>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;