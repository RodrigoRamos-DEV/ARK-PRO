import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmpresaMapa from './EmpresaMapa';
import EmpresaVitrine from './EmpresaVitrine';
import ClientNotifications from './ClientNotifications';
import LicenseWarning from './LicenseWarning';
import FavoritesManager from './FavoritesManager';
import PushNotifications from './PushNotifications';
import { Icons } from './Icons';
import '../css/empresa-responsive.css';

function EmpresaDashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mapa');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
      <nav className="main-navbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: 'var(--cor-primaria)',
        borderBottom: '1px solid var(--cor-borda)',
        position: 'relative'
      }}>
        <div className="navbar-left" style={{ flex: '0 0 auto' }}>
          <img 
            src="https://i.postimg.cc/Qd98gFMF/Sistema-ARK.webp" 
            alt="Logo" 
            className="navbar-logo" 
            style={{ height: '40px', width: 'auto' }}
          />
        </div>
        
        {/* Menu Desktop */}
        <div className="navbar-center desktop-menu" style={{
          display: window.innerWidth <= 768 ? 'none' : 'flex',
          gap: '20px',
          flex: '1 1 auto',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => setActiveTab('mapa')}
            className={`nav-tab ${activeTab === 'mapa' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'mapa' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <Icons.MapPin /> Mapa
          </button>
          <button 
            onClick={() => setActiveTab('vitrine')}
            className={`nav-tab ${activeTab === 'vitrine' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'vitrine' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <Icons.Store /> Feira
          </button>
          <button 
            onClick={() => setActiveTab('favoritos')}
            className={`nav-tab ${activeTab === 'favoritos' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'favoritos' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg> Favoritos
          </button>
        </div>

        <div className="navbar-right" style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px'
        }}>
          <button 
            onClick={toggleTheme} 
            className="nav-button" 
            style={{
              fontSize: '1.2em',
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '6px',
              display: window.innerWidth <= 768 ? 'none' : 'block',
              color: 'white'
            }}
            title="Alternar tema"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button 
            onClick={handleLogout} 
            className="nav-button logout"
            style={{
              padding: '8px 12px',
              border: 'none',
              background: '#dc3545',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: window.innerWidth <= 768 ? 'none' : 'block'
            }}
          >
            Sair
          </button>
          
          {/* Botão Hambúrguer */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-toggle"
            style={{
              display: window.innerWidth <= 768 ? 'block' : 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              padding: '5px',
              color: 'white'
            }}
          >
            ☰
          </button>
        </div>
        
        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="mobile-menu" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--cor-fundo)',
            border: '1px solid var(--cor-borda)',
            borderTop: 'none',
            zIndex: 99999,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}>
            <div style={{ padding: '10px' }}>
              <button 
                onClick={() => { setActiveTab('mapa'); setMobileMenuOpen(false); }}
                className={`mobile-nav-item ${activeTab === 'mapa' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: activeTab === 'mapa' ? 'var(--cor-primaria)' : 'transparent',
                  color: activeTab === 'mapa' ? 'white' : 'var(--cor-texto)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  fontSize: '16px'
                }}
              >
                <Icons.MapPin /> Mapa
              </button>
              <button 
                onClick={() => { setActiveTab('vitrine'); setMobileMenuOpen(false); }}
                className={`mobile-nav-item ${activeTab === 'vitrine' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: activeTab === 'vitrine' ? 'var(--cor-primaria)' : 'transparent',
                  color: activeTab === 'vitrine' ? 'white' : 'var(--cor-texto)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  fontSize: '16px'
                }}
              >
                <Icons.Store /> Feira
              </button>
              <button 
                onClick={() => { setActiveTab('favoritos'); setMobileMenuOpen(false); }}
                className={`mobile-nav-item ${activeTab === 'favoritos' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: activeTab === 'favoritos' ? 'var(--cor-primaria)' : 'transparent',
                  color: activeTab === 'favoritos' ? 'white' : 'var(--cor-texto)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  fontSize: '16px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg> Favoritos
              </button>
              <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid var(--cor-borda)' }} />
              <button 
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--cor-texto)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  fontSize: '16px'
                }}
              >
                {theme === 'light' ? '🌙' : '☀️'} Alternar Tema
              </button>
              <button 
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🚪 Sair
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Conteúdo */}
      <main className="container" style={{
        padding: '20px',
        maxWidth: '100%',
        margin: '0 auto'
      }}>
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