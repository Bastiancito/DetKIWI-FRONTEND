import React from 'react';
import { Alert } from 'react-bootstrap';
import authService from '../crud/auth';

interface RequireRoleProps {
  allowedRoles: number[];
  children: React.ReactNode;
}

const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const user = authService.getCurrentUser();
  const role = user?.rol_id ?? null;

  if (!user || !allowedRoles.includes(role)) {
    return (
      <div className="p-4">
        <Alert variant="warning">No tienes permiso para ver esta página.</Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireRole;
