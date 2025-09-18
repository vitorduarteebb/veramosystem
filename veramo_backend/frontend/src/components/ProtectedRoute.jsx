import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserInfo } from '../services/auth';

export default function ProtectedRoute({ children, requiredRole }) {
  const isAuth = isAuthenticated();
  const user = getUserInfo();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
} 