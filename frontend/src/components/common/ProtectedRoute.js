import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * A wrapper component for routes that require authentication or specific roles
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} [props.allowedRoles] - Array of role names allowed to access this route
 * @param {string} [props.redirectPath="/login"] - Path to redirect to if unauthorized
 * @returns {React.ReactNode} The protected component or a redirect
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectPath = '/login'
}) => {
  const { currentUser } = useAuth();

  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to={redirectPath} replace />;
  }

  // If no specific roles are required, just being authenticated is enough
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if the user has any of the allowed roles
  const hasRequiredRole = currentUser.groups && 
    allowedRoles.some(role => currentUser.groups.includes(role));

  if (!hasRequiredRole) {
    // Redirect to home page if user is authenticated but lacks the required role
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

export default ProtectedRoute;