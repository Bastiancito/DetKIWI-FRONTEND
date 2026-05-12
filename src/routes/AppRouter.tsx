import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import authService from '../crud/auth';
import Navbar from '../components/Navbar';

import Login from '../views/WebPage/Login/Login';
import UploadExcel from '../views/WebPage/UploadExcel/UploadExcel';
import Sedes from '../views/WebPage/Sedes/Sedes';
import Dashboard from '../views/WebPage/Dashboard/Dashboard';
import Usuarios from '../views/WebPage/Usuarios/Usuarios';
import Estudiantes from '../views/WebPage/Estudiantes/Estudiantes';
import Paralelos from '../views/WebPage/Paralelos/Paralelos';
import Evaluaciones from '../views/WebPage/Evaluaciones/Evaluaciones';
import CasosSancionados from '../views/WebPage/CasosSancionados/CasosSancionados';
// import Reportes from '../views/Reportes/Reportes';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      const valid = await authService.ensureValidSession();
      if (!mounted) {
        return;
      }

      setSessionValid(valid);
      setCheckingSession(false);
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!sessionValid) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell container-fluid px-3 px-lg-4 py-4">
        {children}
      </main>
    </div>
  );
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      if (!authService.isAuthenticated()) {
        if (mounted) {
          setSessionValid(false);
          setCheckingSession(false);
        }
        return;
      }

      const valid = await authService.ensureValidSession();
      if (!mounted) {
        return;
      }

      setSessionValid(valid);
      setCheckingSession(false);
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (sessionValid) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const ComingSoon: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="container py-4">
      <div className="surface-card card border-0 text-center mx-auto" style={{ maxWidth: '42rem' }}>
        <div className="card-body p-4 p-lg-5">
          <h1 className="page-title h2 fw-bold mb-3">{title}</h1>
          <p className="text-secondary mb-0">Esta página estará disponible próximamente.</p>
        </div>
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <Usuarios />
      </ProtectedRoute>
    )
  },
  {
    path: '/estudiantes',
    element: (
      <ProtectedRoute>
        <Estudiantes />
      </ProtectedRoute>
    )
  },
  {
    path: '/paralelos',
    element: (
      <ProtectedRoute>
        <Paralelos />
      </ProtectedRoute>
    )
  },
  {
    path: '/evaluaciones',
    element: (
      <ProtectedRoute>
        <Evaluaciones />
      </ProtectedRoute>
    )
  },
  {
    path: '/casos-sancionados',
    element: (
      <ProtectedRoute>
        <CasosSancionados />
      </ProtectedRoute>
    )
  },
  {
    path: '/reportes',
    element: (
      <ProtectedRoute>
        <ComingSoon title="Gestión de Reportes" />
      </ProtectedRoute>
    )
  },
  {
    path: '/upload-excel',
    element: (
      <ProtectedRoute>
        <UploadExcel />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
export { ProtectedRoute, PublicRoute };