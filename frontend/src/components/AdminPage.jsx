import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ClientModal from './ClientModal';
import ConfirmModal from './ConfirmModal';

function AdminPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [confirmState, setConfirmState] = useState({ isOpen: false, onConfirm: null, message: '' });
    const [newToken, setNewToken] = useState(''); // Estado para guardar o novo token

    const API_URL = 'http://localhost:3000/api/admin/clients';
    const token = localStorage.getItem('token');

    const fetchClients = async () => {
        try {
            const response = await axios.get(API_URL, { headers: { 'x-auth-token': token } });
            setClients(response.data);
        } catch (error) {
            toast.error("Erro ao carregar clientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleSaveClient = async (formData, clientId) => {
        try {
            if (clientId) { // Modo Edição
                await axios.put(`${API_URL}/${clientId}`, formData, { headers: { 'x-auth-token': token } });
                toast.success("Cliente atualizado com sucesso!");
            } else { // Modo Criação
                const response = await axios.post(API_URL, formData, { headers: { 'x-auth-token': token } });
                toast.success(response.data.msg);
                setNewToken(response.data.registrationToken); // Guarda o novo token para ser exibido
            }
            fetchClients();
            setIsModalOpen(false);
            setEditingClient(null);
        } catch (error) {
            toast.error(error.response?.data?.error || "Erro ao salvar cliente.");
        }
    };

    const handleDeleteClient = (client) => {
        setConfirmState({
            isOpen: true,
            message: `Tem certeza que deseja excluir o cliente "${client.company_name}"? Todos os seus dados (usuários, lançamentos, etc.) serão perdidos permanentemente.`,
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_URL}/${client.id}`, { headers: { 'x-auth-token': token } });
                    toast.success("Cliente excluído com sucesso!");
                    fetchClients();
                    setConfirmState({ isOpen: false, onConfirm: null, message: '' });
                } catch (error) {
                    toast.error("Erro ao excluir cliente.");
                    setConfirmState({ isOpen: false, onConfirm: null, message: '' });
                }
            }
        });
    };
    
    const handleOpenModal = (client = null) => {
        setNewToken(''); // Limpa o token antigo ao abrir o modal
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false, onConfirm: null, message: '' });
    };

    return (
        <div>
            <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveClient} clientToEdit={editingClient} />
            <ConfirmModal isOpen={confirmState.isOpen} onClose={closeConfirmModal} onConfirm={confirmState.onConfirm} title="Confirmar Exclusão">{confirmState.message}</ConfirmModal>

            {/* Modal para exibir o novo token */}
            {newToken && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1001, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="card" style={{width: '90%', maxWidth: '500px', textAlign: 'center'}}>
                        <h3>Token de Registo Gerado</h3>
                        <p>Envie este token para o seu cliente. Ele é válido por 7 dias.</p>
                        <input type="text" readOnly value={newToken} style={{textAlign: 'center', fontWeight: 'bold', marginBottom: '10px'}}/>
                        <button className="btn" onClick={() => { navigator.clipboard.writeText(newToken); toast.success("Token copiado!"); }}>Copiar Token</button>
                        <button className="btn" onClick={() => setNewToken('')} style={{backgroundColor: '#888', marginTop: '10px'}}>Fechar</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Painel do Administrador</h2>
                <button className="btn" style={{ width: 'auto' }} onClick={() => handleOpenModal()}>+ Novo Cliente</button>
            </div>
            <div className="card">
                <h3>Clientes Cadastrados</h3>
                {loading ? <p>A carregar...</p> : (
                    <div style={{overflowX: 'auto'}}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--cor-primaria)' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Empresa</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Email Principal</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Vencimento</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id} style={{ borderBottom: '1px solid var(--cor-borda)' }}>
                                        <td style={{ padding: '10px' }}>{client.company_name}</td>
                                        <td style={{ padding: '10px' }}>{client.email || 'Não registado'}</td>
                                        <td style={{ padding: '10px' }}>{new Date(client.license_expires_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '10px' }}>{client.license_status}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button onClick={() => handleOpenModal(client)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginRight: '10px' }} title="Editar">✏️</button>
                                            <button onClick={() => handleDeleteClient(client)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }} title="Excluir">🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPage;