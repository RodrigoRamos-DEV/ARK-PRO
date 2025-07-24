import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmModal from './ConfirmModal'; // 1. IMPORTAMOS O MODAL DE CONFIRMAÇÃO

function ItemManager({ itemType, title }) {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState('');

  // 2. NOVO ESTADO PARA GERENCIAR A CONFIRMAÇÃO
  const [confirmState, setConfirmState] = useState({ isOpen: false, onConfirm: null });

  const API_URL = `http://localhost:3000/api/data/items`;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/data/items', { headers: { 'x-auth-token': token } });
        setItems(response.data[itemType] || []);
      } catch (error) {
        console.error(`Erro ao buscar ${itemType}:`, error);
        toast.error(`Erro ao carregar ${title}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [itemType]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const response = await axios.post(API_URL, { type: itemType, name: newItemName }, { headers: { 'x-auth-token': token } });
      setItems(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewItemName('');
      toast.success(`${title.slice(0, -1)} adicionado com sucesso!`);
    } catch (error) {
      toast.error(error.response?.data?.error || `Erro ao adicionar ${title}`);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditingName(item.name);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingName('');
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingName.trim() || !editingItem) return;
    try {
      const response = await axios.put(`${API_URL}/${editingItem.id}`,
        { name: editingName },
        { headers: { 'x-auth-token': token } }
      );
      setItems(prev => prev.map(item => item.id === editingItem.id ? response.data : item).sort((a, b) => a.name.localeCompare(b.name)));
      handleCancelEdit();
      toast.success(`Item atualizado com sucesso!`);
    } catch (error) {
      toast.error(error.response?.data?.error || `Erro ao atualizar ${title}`);
    }
  };

  // 3. FUNÇÃO DE EXCLUSÃO MODIFICADA
  const handleDeleteItem = (itemId) => {
    // Agora, em vez de chamar window.confirm, abrimos nosso modal
    setConfirmState({
      isOpen: true,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/${itemId}`, { headers: { 'x-auth-token': token } });
          setItems(prev => prev.filter(item => item.id !== itemId));
          toast.success(`Item excluído com sucesso!`);
          setConfirmState({ isOpen: false, onConfirm: null }); // Fecha o modal
        } catch (error) {
          toast.error(error.response?.data?.error || `Erro ao excluir ${title}`);
          setConfirmState({ isOpen: false, onConfirm: null }); // Fecha o modal
        }
      }
    });
  };

  return (
    <div>
      {/* 4. RENDERIZAMOS O MODAL DE CONFIRMAÇÃO AQUI */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, onConfirm: null })}
        onConfirm={confirmState.onConfirm}
        title="Confirmar Exclusão"
      >
        Você tem certeza que deseja excluir este item?
      </ConfirmModal>

      <h3>{title}</h3>
      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`Nome do novo ${title.slice(0, -1).toLowerCase()}`}
        />
        <button type="submit" className="btn" style={{ width: 'auto' }}>Adicionar</button>
      </form>

      {loading ? <p>Carregando...</p> : (
        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
          {items.map(item => (
            <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid var(--cor-borda)' }}>
              {editingItem && editingItem.id === item.id ? (
                <form onSubmit={handleUpdateItem} style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    style={{ flexGrow: 1 }}
                    autoFocus
                  />
                  <button type="submit" className="btn" style={{ width: 'auto' }}>Salvar</button>
                  <button type="button" onClick={handleCancelEdit} className="btn" style={{ width: 'auto', backgroundColor: '#888' }}>Cancelar</button>
                </form>
              ) : (
                <>
                  <span>{item.name}</span>
                  <div>
                    <button onClick={() => handleStartEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginRight: '10px' }} title="Editar">✏️</button>
                    {/* O botão de excluir agora chama a nova função handleDeleteItem */}
                    <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }} title="Excluir">🗑️</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ItemManager;