import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

function MainLayout({ theme, toggleTheme, isAdmin = false }) {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div>
            <nav className="main-navbar">
                <div className="navbar-left">
                    <NavLink to={isAdmin ? "/admin" : "/dashboard"}>
                        <img src="https://i.postimg.cc/Qd98gFMF/Sistema-ARK.webp" alt="Logo" className="navbar-logo" />
                    </NavLink>
                </div>
                
                {!isAdmin && (
                    <div className={`navbar-center ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
                        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>Controle Financeiro</NavLink>
                        <NavLink to="/lancamentos" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>Lançamentos</NavLink>
                        <NavLink to="/cadastro" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>Cadastro</NavLink>
                    </div>
                )}

                <div className="navbar-right">
                    <button onClick={toggleTheme} className="nav-button" style={{fontSize: '1.5em'}}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button onClick={handleLogout} className="nav-button logout">Sair</button>
                    {!isAdmin && (
                        <button className="nav-button mobile-menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? '✖' : '☰'}
                        </button>
                    )}
                </div>
            </nav>
            <main className="container">
                <Outlet />
            </main>
        </div>
    );
}

export default MainLayout;