import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './css/style.css';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ControleFinanceiroPage from './components/ControleFinanceiroPage';
import CadastroPage from './components/CadastroPage';
import LancamentosPage from './components/LancamentosPage';
import AdminPage from './components/AdminPage';
import ProfilePage from './components/ProfilePage';
import AdminPartnersPage from './components/AdminPartnersPage'; // <-- IMPORTA A NOVA PÁGINA

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`${theme}-mode`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout theme={theme} toggleTheme={toggleTheme} />}>
            <Route path="/dashboard" element={<ControleFinanceiroPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/lancamentos" element={<LancamentosPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        
        <Route element={<AdminProtectedRoute />}>
            <Route element={<MainLayout theme={theme} toggleTheme={toggleTheme} isAdmin />}>
              <Route path="/admin" element={<AdminPage />} />
              {/* --- ROTA ADICIONADA AQUI --- */}
              <Route path="/admin/partners" element={<AdminPartnersPage />} />
            </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;