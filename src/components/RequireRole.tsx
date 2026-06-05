import React, { useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import authService from '../crud/auth';

interface RequireRoleProps {
  allowedRoles: number[];
  children: React.ReactNode;
}

const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validate = async () => {
      const sessionValid = await authService.ensureValidSession();
      if (!mounted) return;

      if (!sessionValid) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      const user = authService.getCurrentUser();
      const role = user?.rol_id ?? null;
      if (!user || !allowedRoles.includes(role)) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }

      setChecking(false);
    };

    validate();

    return () => {
      mounted = false;
    };
  }, [allowedRoles]);

  if (checking) {
    return (
      <div className="d-flex align-items-center justify-content-center p-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!authorized) {
    // If user exists but not allowed, show warning. Otherwise redirect to login.
    const user = authService.getCurrentUser();
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className="p-4">
        <Alert variant="warning">No tienes permiso para ver esta página.</Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireRole;
