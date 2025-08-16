import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmpresaMapa from './EmpresaMapa';
import EmpresaVitrine from './EmpresaVitrine';
import ClientNotifications from './ClientNotifications';
import LicenseWarning from './LicenseWarning';
import FavoritesManager from './FavoritesManager';
import PushNotifications from './PushNotifications';
import { Icons } from './Icons';

function EmpresaDashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mapa');
  
  useEffect(() => {
    const handleSwitchToFeira = () => {
      setActiveTab('vitrine');
    };
    
    window.addEventListener('switchToFeira', handleSwitchToFeira);
    return () => window.removeEventListener('switchToFeira', handleSwitchToFeira);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div>
      <PushNotifications />
      {/* Navbar Empresa */}
      <nav className="main-navbar">
        <div className="navbar-left">
          <img src="https://i.postimg.cc/Qd98gFMF/Sistema-ARK.webp" alt="Logo" className="navbar-logo" />
        </div>
        
        <div className="navbar-center">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('mapa'); }}
            className={activeTab === 'mapa' ? 'active' : ''}
          >
            <Icons.MapPin /> Mapa
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('vitrine'); }}
            className={activeTab === 'vitrine' ? 'active' : ''}
          >
            <Icons.Store /> Feira
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('favoritos'); }}
            className={activeTab === 'favoritos' ? 'active' : ''}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg> Favoritos
          </a>
        </div>

        <div className="navbar-right" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div className="tooltip">
            <button onClick={toggleTheme} className="nav-button" style={{fontSize: '1.5em'}}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <span className="tooltiptext">Alternar tema</span>
          </div>
          <button onClick={handleLogout} className="nav-button logout">Sair</button>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="container">
        <LicenseWarning />
        <ClientNotifications />
        {activeTab === 'mapa' && <EmpresaMapa />}
        {activeTab === 'vitrine' && <EmpresaVitrine />}
        {activeTab === 'favoritos' && <FavoritesManager />}
      </main>
    </div>
  );
}

export default EmpresaDashboard;