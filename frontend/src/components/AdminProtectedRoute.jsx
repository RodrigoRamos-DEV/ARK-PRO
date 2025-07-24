import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Só permite o acesso se houver um token E se o papel do utilizador for 'admin'
  if (token && user?.role === 'admin') {
    return <Outlet />;
  }
  
  // Se não for admin, redireciona para a página de login
  return <Navigate to="/" replace />;
};

export default AdminProtectedRoute;