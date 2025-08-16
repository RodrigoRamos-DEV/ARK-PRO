import React, { useState, useEffect } from 'react';
import CadastroNavbar from './CadastroNavbar';
import ProdutoManager from './ProdutoManager';
import ClienteManager from './ClienteManager';
import FornecedorManager from './FornecedorManager';
import FuncionarioManager from './FuncionarioManager';




// Componente Modal genérico
const ManagementModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative'}} className="card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2 style={{margin: 0}}>{title}</h2>
                    <button onClick={onClose} style={{background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: 'var(--cor-texto)'}}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
};

function CadastroPage() {
  const [modalState, setModalState] = useState({ isOpen: false, type: '', title: '' });

  useEffect(() => {
    const handleOpenModal = (event) => {
      const { type } = event.detail;
      handleNavClick(type);
    };

    window.addEventListener('openModal', handleOpenModal);
    return () => window.removeEventListener('openModal', handleOpenModal);
  }, []);

  const handleNavClick = (type) => {
    const titles = {
      produtos: 'Produtos',
      clientes: 'Clientes',
      fornecedores: 'Fornecedores', 
      funcionarios: 'Funcionários'
    };
    setModalState({ isOpen: true, type, title: titles[type] });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: '', title: '' });
  };

  const renderModalContent = () => {
      const { type } = modalState;
      switch(type) {
        case 'produtos':
          return <ProdutoManager />;
        case 'funcionarios':
          return <FuncionarioManager />;
        case 'clientes':
          return <ClienteManager />;
        case 'fornecedores':
          return <FornecedorManager />;

        default:
          return null;
      }
  };

  return (
    <div>
      <CadastroNavbar 
        onItemClick={handleNavClick}
        activeItem={modalState.isOpen ? modalState.type : null}
      />
      
      <div className="card" style={{textAlign: 'center', padding: '40px'}}>
        <h3 style={{color: 'var(--cor-texto-secundario)', marginBottom: '10px'}}>Sistema de Cadastros</h3>
        <p style={{color: 'var(--cor-texto-secundario)'}}>Selecione uma opção acima para gerenciar seus cadastros</p>
      </div>

      <ManagementModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
      >
        {renderModalContent()}
      </ManagementModal>
    </div>
  );
}

export default CadastroPage;