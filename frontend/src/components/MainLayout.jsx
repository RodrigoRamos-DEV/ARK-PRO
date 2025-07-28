import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const ExpiryWarning = ({ daysLeft }) => (
    <div className="expiry-warning">
        {daysLeft > 1 && `A sua licença expira em ${daysLeft} dias.`}
        {daysLeft === 1 && `A sua licença expira amanhã!`}
        {daysLeft === 0 && `A sua licença expira hoje!`}
    </div>
);

const ExpiryOverlay = () => (
    <div className="expiry-overlay">
        <div className="expiry-overlay-content">
            <h2>Sistema Vencido</h2>
            <p>A sua licença de acesso ao sistema expirou. Por favor, entre em contacto com o suporte para regularizar a sua situação e reativar o acesso.</p>
        </div>
    </div>
);

function MainLayout({ theme, toggleTheme, isAdmin = false }) {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState({ status: 'active', daysLeft: null });

    useEffect(() => {
        if (isAdmin) {
            setLicenseStatus({ status: 'active', daysLeft: null });
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.licenseExpiresAt) {
            const today = new Date();
            const expiryDate = new Date(user.licenseExpiresAt);
            
            today.setHours(0, 0, 0, 0);
            expiryDate.setHours(0, 0, 0, 0);

            const timeDiff = expiryDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysLeft < 0) {
                setLicenseStatus({ status: 'expired', daysLeft: null });
            } else if (daysLeft <= 5) {
                setLicenseStatus({ status: 'warning', daysLeft: daysLeft });
            } else {
                setLicenseStatus({ status: 'active', daysLeft: null });
            }
        }
    }, [isAdmin]);

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
                        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMobileMenu}>Perfil</NavLink>
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

            {licenseStatus.status === 'expired' ? (
                <ExpiryOverlay />
            ) : (
                <main className="container">
                    <Outlet />
                    {licenseStatus.status === 'warning' && (
                        <ExpiryWarning daysLeft={licenseStatus.daysLeft} />
                    )}
                </main>
            )}
        </div>
    );
}

export default MainLayout;