import React, { useState } from 'react';
import FuncionarioManager from './FuncionarioManager';
import ItemManager from './ItemManager';

// Componente Modal genérico
const ManagementModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{width: '90%', maxWidth: '500px'}} className="card">
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

  const openModal = (type, title) => {
    setModalState({ isOpen: true, type, title });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: '', title: '' });
  };

  const renderModalContent = () => {
      const { type, title } = modalState;
      if (type === 'funcionarios') {
          return <FuncionarioManager />;
      }
      if (['produto', 'comprador', 'compra', 'fornecedor'].includes(type)) {
          return <ItemManager itemType={type} title={title} />;
      }
      return null;
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', justifyContent: 'center' }}>
          <button className="btn" onClick={() => openModal('produto', 'Gerenciar Produtos')}>Gerenciar Produtos</button>
          <button className="btn" onClick={() => openModal('comprador', 'Gerenciar Compradores')}>Gerenciar Compradores</button>
          <button className="btn" onClick={() => openModal('compra', 'Gerenciar Compras')}>Gerenciar Compras</button>
          <button className="btn" onClick={() => openModal('fornecedor', 'Gerenciar Fornecedores')}>Gerenciar Fornecedores</button>
          <button className="btn" onClick={() => openModal('funcionarios', 'Gerenciar Funcionários')}>Gerenciar Funcionários</button>
        </div>
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