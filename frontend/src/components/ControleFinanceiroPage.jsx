import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../apiConfig';
import { Link } from 'react-router-dom';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

function ControleFinanceiroPage() {
    const [payments, setPayments] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [clients, setClients] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'payment' ou 'withdrawal'
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [comissoes, setComissoes] = useState([]);
    const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 7));

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        try {
            const [paymentsRes, withdrawalsRes, clientsRes, partnersRes] = await Promise.all([
                axios.get(`${API_URL}/api/partners/payments`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API_URL}/api/partners/withdrawals`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API_URL}/api/admin/clients`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API_URL}/api/partners`, { headers: { 'x-auth-token': token } })
            ]);
            loadComissoes();
            setPayments(paymentsRes.data);
            setWithdrawals(withdrawalsRes.data);
            setClients(clientsRes.data);
            setPartners(partnersRes.data);
        } catch (error) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const loadComissoes = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/partners/comissoes?mes=${mesReferencia}`, { headers: { 'x-auth-token': token } });
            setComissoes(response.data);
        } catch (error) {
            console.error('Erro ao carregar comissões:', error);
        }
    };
    
    useEffect(() => {
        loadComissoes();
    }, [mesReferencia]);
    
    const pagarComissao = async (vendedor) => {
        if (!vendedor.vendedor_id) {
            toast.error('Vendedor sem ID válido.');
            return;
        }
        
        if (window.confirm(`Pagar comissão de ${formatCurrency(vendedor.total_comissao)} para ${vendedor.vendedor_nome}?`)) {
            try {
                // Criar retirada automaticamente
                const retiradaResponse = await axios.post(`${API_URL}/api/partners/withdrawals`, {
                    partnerId: vendedor.vendedor_id,
                    amount: vendedor.total_comissao,
                    withdrawalDate: new Date().toISOString().split('T')[0]
                }, { headers: { 'x-auth-token': token } });
                
                // Marcar como pago com referência da retirada
                await axios.post(`${API_URL}/api/partners/pagamentos/marcar-pago`, {
                    vendedor_id: vendedor.vendedor_id,
                    mes_referencia: mesReferencia,
                    valor_comissao: vendedor.total_comissao,
                    withdrawal_id: retiradaResponse.data.id
                }, { headers: { 'x-auth-token': token } });
                
                toast.success('Comissão paga e registrada como retirada!');
                fetchData();
                loadComissoes();
            } catch (error) {
                const errorMessage = error.response?.data?.error || 'Erro ao processar pagamento.';
                toast.error(errorMessage);
            }
        }
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setEditingItem(item);
        if (type === 'vendedor') {
            setFormData(item ? {
                name: item.name,
                porcentagem: item.porcentagem,
                pix: item.pix || '',
                endereco: item.endereco || '',
                telefone: item.telefone || ''
            } : {
                name: '',
                porcentagem: '',
                pix: '',
                endereco: '',
                telefone: ''
            });
        } else if (type === 'payment') {
            setFormData(item ? {
                clientId: item.client_id,
                amount: item.amount,
                paymentDate: item.payment_date.split('T')[0],
                notes: item.notes || ''
            } : {
                clientId: '',
                amount: '',
                paymentDate: new Date().toISOString().split('T')[0],
                notes: ''
            });
        } else {
            setFormData(item ? {
                partnerId: item.partner_id,
                amount: item.amount,
                withdrawalDate: item.withdrawal_date.split('T')[0]
            } : {
                partnerId: '',
                amount: '',
                withdrawalDate: new Date().toISOString().split('T')[0]
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'vendedor') {
                if (editingItem) {
                    await axios.put(`${API_URL}/api/partners/vendedores/${editingItem.id}`, formData, { headers: { 'x-auth-token': token } });
                    toast.success('Vendedor atualizado!');
                } else {
                    await axios.post(`${API_URL}/api/partners/vendedores`, formData, { headers: { 'x-auth-token': token } });
                    toast.success('Vendedor cadastrado!');
                }
            } else {
                const url = modalType === 'payment' ? 'payments' : 'withdrawals';
                if (editingItem) {
                    await axios.put(`${API_URL}/api/partners/${url}/${editingItem.id}`, formData, { headers: { 'x-auth-token': token } });
                    toast.success(`${modalType === 'payment' ? 'Pagamento' : 'Retirada'} atualizado!`);
                } else {
                    await axios.post(`${API_URL}/api/partners/${url}`, formData, { headers: { 'x-auth-token': token } });
                    toast.success(`${modalType === 'payment' ? 'Pagamento' : 'Retirada'} adicionado!`);
                }
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar.');
        }
    };

    const handleDelete = async (type, id) => {
        if (window.confirm('Confirma exclusão?')) {
            try {
                const url = type === 'payment' ? 'payments' : 'withdrawals';
                await axios.delete(`${API_URL}/api/partners/${url}/${id}`, { headers: { 'x-auth-token': token } });
                
                // Se for retirada, verificar se era pagamento de comissão e reverter status
                if (type === 'withdrawal') {
                    await axios.post(`${API_URL}/api/partners/pagamentos/reverter-pagamento`, {
                        withdrawal_id: id
                    }, { headers: { 'x-auth-token': token } });
                }
                
                toast.success('Excluído com sucesso!');
                fetchData();
                loadComissoes();
            } catch (error) {
                toast.error('Erro ao excluir.');
            }
        }
    };

    const handleDeleteVendedor = async (id) => {
        if (window.confirm('Confirma exclusão do vendedor?')) {
            try {
                await axios.delete(`${API_URL}/api/partners/vendedores/${id}`, { headers: { 'x-auth-token': token } });
                toast.success('Vendedor excluído!');
                fetchData();
            } catch (error) {
                const errorMessage = error.response?.data?.error || 'Erro ao excluir vendedor.';
                toast.error(errorMessage);
            }
        }
    };

    const totalPagamentos = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalRetiradas = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
    const saldoCaixa = totalPagamentos - totalRetiradas;

    if (loading) return <div className="card"><p>Carregando...</p></div>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <Link to="/admin" className="btn" style={{width: 'auto', backgroundColor: '#888'}}>&larr; Voltar</Link>
                <h2>Controle Financeiro</h2>
            </div>

            {/* Resumo */}
            <div className="card" style={{marginBottom: '20px'}}>
                <h3>Resumo Financeiro</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                    <div style={{background: '#e8f5e8', padding: '15px', borderRadius: '8px', textAlign: 'center'}}>
                        <div style={{fontSize: '14px', color: '#666'}}>Total Recebido</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#28a745'}}>{formatCurrency(totalPagamentos)}</div>
                    </div>
                    <div style={{background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center'}}>
                        <div style={{fontSize: '14px', color: '#666'}}>Total Retirado</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#dc3545'}}>{formatCurrency(totalRetiradas)}</div>
                    </div>
                    <div style={{background: '#d1ecf1', padding: '15px', borderRadius: '8px', textAlign: 'center'}}>
                        <div style={{fontSize: '14px', color: '#666'}}>Saldo em Caixa</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: saldoCaixa >= 0 ? '#0c5460' : '#dc3545'}}>{formatCurrency(saldoCaixa)}</div>
                    </div>
                </div>
            </div>

            {/* Pagamentos e Retiradas lado a lado */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
                {/* Pagamentos */}
                <div className="card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                        <h3>Pagamentos de Clientes</h3>
                        <button onClick={() => openModal('payment')} className="btn">+ Novo</button>
                    </div>
                    <table style={{width: '100%'}}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Valor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.id}>
                                    <td>{new Date(p.payment_date).toLocaleDateString('pt-BR')}</td>
                                    <td>{p.company_name}</td>
                                    <td style={{color: '#28a745', fontWeight: 'bold'}}>{formatCurrency(p.amount)}</td>
                                    <td>
                                        <button onClick={() => openModal('payment', p)} style={{background: 'none', border: 'none', cursor: 'pointer', marginRight: '5px'}}>✏️</button>
                                        <button onClick={() => handleDelete('payment', p.id)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Retiradas */}
                <div className="card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                        <h3>Retiradas de Vendedores</h3>
                        <button onClick={() => openModal('withdrawal')} className="btn">+ Nova</button>
                    </div>
                    <table style={{width: '100%'}}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Vendedor</th>
                                <th>Valor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map(w => (
                                <tr key={w.id}>
                                    <td>{new Date(w.withdrawal_date).toLocaleDateString('pt-BR')}</td>
                                    <td>{w.partner_name}</td>
                                    <td style={{color: '#dc3545', fontWeight: 'bold'}}>{formatCurrency(w.amount)}</td>
                                    <td>
                                        <button onClick={() => openModal('withdrawal', w)} style={{background: 'none', border: 'none', cursor: 'pointer', marginRight: '5px'}}>✏️</button>
                                        <button onClick={() => handleDelete('withdrawal', w.id)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Controle de Vendedores */}
            <div className="card" style={{marginBottom: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h3>Controle de Vendedores - {new Date(mesReferencia + '-01').toLocaleDateString('pt-BR', {month: 'long', year: 'numeric', timeZone: 'UTC'}).replace(/^\w/, c => c.toUpperCase())}</h3>
                    <input type="month" value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)} />
                </div>
                <table style={{width: '100%'}}>
                    <thead>
                        <tr>
                            <th>Vendedor</th>
                            <th>%</th>
                            <th>Total Vendido</th>
                            <th>Comissão</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comissoes.map((c, i) => (
                            <tr key={i}>
                                <td>{c.vendedor_nome}</td>
                                <td>{c.porcentagem === 'Resto' ? 'Resto' : c.porcentagem + '%'}</td>
                                <td>{formatCurrency(c.total_vendas)}</td>
                                <td style={{fontWeight: 'bold', color: '#28a745'}}>{formatCurrency(c.total_comissao)}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        backgroundColor: c.status_pagamento === 'pago' ? '#28a745' : '#ffc107', 
                                        color: c.status_pagamento === 'pago' ? '#fff' : '#000', 
                                        fontSize: '12px'
                                    }}>
                                        {c.status_pagamento === 'pago' ? 'Pago' : 'A Pagar'}
                                    </span>
                                </td>
                                <td>
                                    {c.status_pagamento === 'pago' ? (
                                        <span style={{color: '#28a745', fontSize: '16px'}}>✓ Pago</span>
                                    ) : c.vendedor_id ? (
                                        <button 
                                            onClick={() => pagarComissao(c)}
                                            style={{background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', fontSize: '12px'}} 
                                        >
                                            Pagar
                                        </button>
                                    ) : (
                                        <span style={{color: '#666', fontSize: '12px'}}>Manual</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Vendedores Cadastrados */}
            <div className="card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h3>Vendedores Cadastrados</h3>
                    <button onClick={() => openModal('vendedor')} className="btn">+ Novo Vendedor</button>
                </div>
                <table style={{width: '100%'}}>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Porcentagem</th>
                            <th>PIX</th>
                            <th>Telefone</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partners.map(p => (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td>{parseFloat(p.porcentagem || 0).toFixed(2)}%</td>
                                <td>{p.pix}</td>
                                <td>{p.telefone}</td>
                                <td>
                                    <button onClick={() => openModal('vendedor', p)} style={{background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px'}}>✏️</button>
                                    <button onClick={() => handleDeleteVendedor(p.id)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <div className="card" style={{width: '90%', maxWidth: '500px'}}>
                        <h3>{editingItem ? 'Editar' : 'Novo'} {modalType === 'payment' ? 'Pagamento' : modalType === 'withdrawal' ? 'Retirada' : 'Vendedor'}</h3>
                        <form onSubmit={handleSave}>
                            {modalType === 'vendedor' ? (
                                <>
                                    <div className="input-group">
                                        <label>Nome *</label>
                                        <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Porcentagem (%) *</label>
                                        <input type="number" step="0.01" min="0" max="99.99" value={formData.porcentagem || ''} onChange={(e) => {
                                            const value = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 99.99);
                                            setFormData({...formData, porcentagem: value});
                                        }} required />
                                    </div>
                                    <div className="input-group">
                                        <label>PIX</label>
                                        <input type="text" value={formData.pix || ''} onChange={(e) => setFormData({...formData, pix: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label>Telefone</label>
                                        <input type="text" value={formData.telefone || ''} onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label>Endereço</label>
                                        <input type="text" value={formData.endereco || ''} onChange={(e) => setFormData({...formData, endereco: e.target.value})} />
                                    </div>
                                </>
                            ) : modalType === 'payment' ? (
                                <>
                                    <div className="input-group">
                                        <label>Cliente *</label>
                                        <select value={formData.clientId || ''} onChange={(e) => setFormData({...formData, clientId: e.target.value})} required>
                                            <option value="">Selecione</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Valor *</label>
                                        <input type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Data *</label>
                                        <input type="date" value={formData.paymentDate || ''} onChange={(e) => setFormData({...formData, paymentDate: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Observações</label>
                                        <textarea value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="3"></textarea>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="input-group">
                                        <label>Vendedor *</label>
                                        <select value={formData.partnerId || ''} onChange={(e) => setFormData({...formData, partnerId: e.target.value})} required>
                                            <option value="">Selecione</option>
                                            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Valor *</label>
                                        <input type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Data *</label>
                                        <input type="date" value={formData.withdrawalDate || ''} onChange={(e) => setFormData({...formData, withdrawalDate: e.target.value})} required />
                                    </div>
                                </>
                            )}
                            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px'}}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{backgroundColor: '#888'}}>Cancelar</button>
                                <button type="submit" className="btn">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ControleFinanceiroPage;