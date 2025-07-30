import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../apiConfig';
import { Link } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatDateForInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';

function AdminPartnersPage() {
    const [partners, setPartners] = useState([]);
    const [clients, setClients] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [allWithdrawals, setAllWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [editingPayment, setEditingPayment] = useState(null); 
    const [editingWithdrawal, setEditingWithdrawal] = useState(null);
    const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });

    const [paymentForm, setPaymentForm] = useState({ clientId: '', amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
    const [withdrawalForm, setWithdrawalForm] = useState({ partnerId: '', amount: '', withdrawalDate: new Date().toISOString().split('T')[0] });

    const token = localStorage.getItem('token');
    const PARTNERS_API_URL = `${API_URL}/api/partners`;
    const ADMIN_API_URL = `${API_URL}/api/admin`;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const [partnersRes, clientsRes, paymentsRes, withdrawalsRes] = await Promise.all([
                axios.get(PARTNERS_API_URL, { headers: { 'x-auth-token': token } }),
                axios.get(`${ADMIN_API_URL}/clients`, { headers: { 'x-auth-token': token } }),
                axios.get(`${PARTNERS_API_URL}/payments?${params.toString()}`, { headers: { 'x-auth-token': token } }),
                axios.get(`${PARTNERS_API_URL}/withdrawals`, { headers: { 'x-auth-token': token } }),
            ]);
            setPartners(partnersRes.data);
            setClients(clientsRes.data);
            setAllPayments(paymentsRes.data);
            setAllWithdrawals(withdrawalsRes.data);
        } catch (error) {
            toast.error("Erro ao carregar dados financeiros.");
        } finally {
            setLoading(false);
        }
    }, [filters, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const handlePaymentChange = (e) => setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
    const handleWithdrawalChange = (e) => setWithdrawalForm({ ...withdrawalForm, [e.target.name]: e.target.value });

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${PARTNERS_API_URL}/payments`, paymentForm, { headers: { 'x-auth-token': token } });
            toast.success("Pagamento registado com sucesso!");
            setPaymentForm({ clientId: '', amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Erro ao registar pagamento.");
        }
    };

    const handleAddWithdrawal = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${PARTNERS_API_URL}/withdrawals`, withdrawalForm, { headers: { 'x-auth-token': token } });
            toast.success("Retirada registada com sucesso!");
            setWithdrawalForm({ partnerId: '', amount: '', withdrawalDate: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Erro ao registar retirada.");
        }
    };

    const handleStartEditPayment = (payment) => setEditingPayment({ ...payment });
    const handleCancelEditPayment = () => setEditingPayment(null);
    const handleEditPaymentChange = (e) => setEditingPayment({ ...editingPayment, [e.target.name]: e.target.value });
    
    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${PARTNERS_API_URL}/payments/${editingPayment.id}`, {
                amount: editingPayment.amount,
                paymentDate: formatDateForInput(editingPayment.payment_date),
                notes: editingPayment.notes
            }, { headers: { 'x-auth-token': token } });
            toast.success("Pagamento atualizado com sucesso!");
            setEditingPayment(null);
            fetchData();
        } catch (error) {
            toast.error("Erro ao atualizar pagamento.");
        }
    };

    const handleDeletePayment = (paymentId) => {
        setConfirmState({
            isOpen: true,
            message: "Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.",
            onConfirm: async () => {
                try {
                    await axios.delete(`${PARTNERS_API_URL}/payments/${paymentId}`, { headers: { 'x-auth-token': token } });
                    toast.success("Pagamento excluído com sucesso!");
                    fetchData();
                } catch (error) {
                    toast.error("Erro ao excluir pagamento.");
                } finally {
                    setConfirmState({ isOpen: false, onConfirm: null });
                }
            }
        });
    };
    
    const handleStartEditWithdrawal = (withdrawal) => setEditingWithdrawal({ ...withdrawal });
    const handleCancelEditWithdrawal = () => setEditingWithdrawal(null);
    const handleEditWithdrawalChange = (e) => setEditingWithdrawal({ ...editingWithdrawal, [e.target.name]: e.target.value });

    const handleUpdateWithdrawal = async (e) => {
        e.preventDefault();
        try {
             await axios.put(`${PARTNERS_API_URL}/withdrawals/${editingWithdrawal.id}`, {
                amount: editingWithdrawal.amount,
                withdrawalDate: formatDateForInput(editingWithdrawal.withdrawal_date)
            }, { headers: { 'x-auth-token': token } });
            toast.success("Retirada atualizada com sucesso!");
            setEditingWithdrawal(null);
            fetchData();
        } catch (error) {
            toast.error("Erro ao atualizar retirada.");
        }
    };
    
    const handleDeleteWithdrawal = (withdrawalId) => {
        setConfirmState({
            isOpen: true,
            message: "Tem certeza que deseja excluir esta retirada? Esta ação não pode ser desfeita.",
            onConfirm: async () => {
                try {
                    await axios.delete(`${PARTNERS_API_URL}/withdrawals/${withdrawalId}`, { headers: { 'x-auth-token': token } });
                    toast.success("Retirada excluída com sucesso!");
                    fetchData();
                } catch (error) {
                    toast.error("Erro ao excluir retirada.");
                } finally {
                    setConfirmState({ isOpen: false, onConfirm: null });
                }
            }
        });
    };

    const financialSummary = useMemo(() => {
        const totalRevenue = allPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        const totalWithdrawn = allWithdrawals.reduce((acc, w) => acc + parseFloat(w.amount), 0);
        const availableForWithdrawal = totalRevenue - totalWithdrawn;

        const partnerData = partners.map(partner => {
            const revenueFromClients = allPayments
                .filter(p => clients.find(c => c.id === p.client_id)?.partner_id === partner.id)
                .reduce((acc, p) => acc + parseFloat(p.amount), 0);
            
            const share = revenueFromClients * parseFloat(partner.profit_share);
            const withdrawnByPartner = allWithdrawals
                .filter(w => w.partner_id === partner.id)
                .reduce((acc, w) => acc + parseFloat(w.amount), 0);
            
            return {
                ...partner,
                revenueGenerated: revenueFromClients,
                earnedShare: share,
                totalWithdrawn: withdrawnByPartner,
                balance: share - withdrawnByPartner
            };
        });

        return { totalRevenue, totalWithdrawn, availableForWithdrawal, partnerData };
    }, [allPayments, allWithdrawals, partners, clients]);

    if (loading) return <div className="card"><p>A carregar controlo financeiro...</p></div>;

    return (
        <div>
            <ConfirmModal isOpen={confirmState.isOpen} onClose={() => setConfirmState({ isOpen: false, onConfirm: null })} onConfirm={confirmState.onConfirm} title="Confirmar Ação">{confirmState.message}</ConfirmModal>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <Link to="/admin" className="btn" style={{width: 'auto', backgroundColor: '#888'}}>&larr; Voltar ao Painel</Link>
                <h2>Controle Financeiro de Sócios</h2>
            </div>

            <div className="card grid-2-col">
                <div>
                    <h3>Registar Pagamento de Cliente</h3>
                    <form onSubmit={handleAddPayment}>
                        <div className="input-group">
                            <label>Cliente</label>
                            <select name="clientId" value={paymentForm.clientId} onChange={handlePaymentChange} required>
                                <option value="" disabled>Selecione um cliente</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Valor do Pagamento (R$)</label>
                            <input type="number" name="amount" value={paymentForm.amount} onChange={handlePaymentChange} step="0.01" placeholder="Ex: 50.00" required />
                        </div>
                        <div className="input-group">
                            <label>Data do Pagamento</label>
                            <input type="date" name="paymentDate" value={paymentForm.paymentDate} onChange={handlePaymentChange} required />
                        </div>
                         <div className="input-group">
                            <label>Notas (Opcional)</label>
                            <input type="text" name="notes" value={paymentForm.notes} onChange={handlePaymentChange} placeholder="Ex: Mensalidade de Julho" />
                        </div>
                        <button type="submit" className="btn" style={{backgroundColor: 'var(--cor-sucesso)'}}>Adicionar Pagamento</button>
                    </form>
                </div>
                 <div>
                    <h3>Registar Retirada de Sócio</h3>
                    <form onSubmit={handleAddWithdrawal}>
                        <div className="input-group">
                            <label>Sócio</label>
                            <select name="partnerId" value={withdrawalForm.partnerId} onChange={handleWithdrawalChange} required>
                                <option value="" disabled>Selecione um sócio</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Valor da Retirada (R$)</label>
                            <input type="number" name="amount" value={withdrawalForm.amount} onChange={handleWithdrawalChange} step="0.01" placeholder="Ex: 1000.00" required />
                        </div>
                        <div className="input-group">
                            <label>Data da Retirada</label>
                            <input type="date" name="withdrawalDate" value={withdrawalForm.withdrawalDate} onChange={handleWithdrawalChange} required />
                        </div>
                        <button type="submit" className="btn">Adicionar Retirada</button>
                    </form>
                </div>
            </div>

            <div className="card">
                <h3>Resumo Financeiro da Empresa</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
                    <div><h4>Receita Total (Período)</h4><p style={{color: 'var(--cor-sucesso)', fontSize: '1.8em'}}>{formatCurrency(financialSummary.totalRevenue)}</p></div>
                    <div><h4>Total Retirado (Geral)</h4><p style={{color: 'var(--cor-erro)', fontSize: '1.8em'}}>{formatCurrency(financialSummary.totalWithdrawn)}</p></div>
                    <div><h4>Disponível para Retirada (Geral)</h4><p style={{color: 'var(--cor-primaria)', fontSize: '1.8em'}}>{formatCurrency(financialSummary.availableForWithdrawal)}</p></div>
                </div>
                <hr style={{margin: '20px 0'}}/>
                <h3>Balanço por Sócio (Baseado na Receita do Período)</h3>
                 <div style={{overflowX: 'auto'}}>
                    <table style={{width: '100%'}}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--cor-primaria)' }}>
                                <th style={{ padding: '8px' }}>Sócio</th>
                                <th style={{ padding: '8px' }}>Receita Gerada no Período</th>
                                <th style={{ padding: '8px' }}>Lucro (Participação)</th>
                                <th style={{ padding: '8px' }}>Total Retirado (Geral)</th>
                                <th style={{ padding: '8px' }}>Saldo a Receber</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financialSummary.partnerData.map(p => (
                                <tr key={p.id}>
                                    <td style={{ padding: '8px' }}>{p.name}</td>
                                    <td style={{ padding: '8px' }}>{formatCurrency(p.revenueGenerated)}</td>
                                    <td style={{ padding: '8px' }}>{formatCurrency(p.earnedShare)}</td>
                                    <td style={{ padding: '8px' }}>{formatCurrency(p.totalWithdrawn)}</td>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{formatCurrency(p.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            <div className="card grid-2-col">
                <div>
                    <h3>Histórico de Pagamentos</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.5fr', gap: '20px', marginBottom: '20px', alignItems: 'flex-end' }}>
                        <div><label>De</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} /></div>
                        <div><label>Até</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} /></div>
                        <div><button className="btn" style={{width: '100%'}} onClick={fetchData}>Filtrar</button></div>
                    </div>
                    <div style={{overflowX: 'auto', maxHeight: '400px'}}>
                        <table style={{width: '100%'}}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--cor-primaria)' }}>
                                    <th style={{ padding: '8px' }}>Data</th>
                                    <th style={{ padding: '8px' }}>Cliente</th>
                                    <th style={{ padding: '8px' }}>Valor</th>
                                    <th style={{ padding: '8px' }}>Notas</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allPayments.map(p => (
                                    <tr key={p.id}>
                                        {editingPayment && editingPayment.id === p.id ? (
                                            <>
                                                <td><input type="date" name="payment_date" value={formatDateForInput(editingPayment.payment_date)} onChange={handleEditPaymentChange} style={{padding: '5px'}}/></td>
                                                <td>{p.company_name}</td>
                                                <td><input type="number" name="amount" value={editingPayment.amount} onChange={handleEditPaymentChange} style={{padding: '5px'}}/></td>
                                                <td><input type="text" name="notes" value={editingPayment.notes} onChange={handleEditPaymentChange} style={{padding: '5px'}}/></td>
                                                <td style={{textAlign: 'center'}}>
                                                    <button onClick={handleUpdatePayment} className="btn" style={{backgroundColor: 'var(--cor-sucesso)', width: 'auto', padding: '5px 10px', fontSize: '0.9em'}}>Salvar</button>
                                                    <button onClick={handleCancelEditPayment} className="btn" style={{backgroundColor: '#888', width: 'auto', padding: '5px 10px', marginLeft: '5px', fontSize: '0.9em'}}>Cancelar</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '8px' }}>{new Date(p.payment_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                                <td style={{ padding: '8px' }}>{p.company_name}</td>
                                                <td style={{ padding: '8px' }}>{formatCurrency(p.amount)}</td>
                                                <td style={{ padding: '8px' }}>{p.notes}</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <button onClick={() => handleStartEditPayment(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginRight: '10px' }} title="Editar">✏️</button>
                                                    <button onClick={() => handleDeletePayment(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }} title="Excluir">🗑️</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3>Histórico de Retiradas</h3>
                    <div style={{overflowX: 'auto', maxHeight: '400px'}}>
                        <table style={{width: '100%'}}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--cor-primaria)' }}>
                                    <th style={{ padding: '8px' }}>Data</th>
                                    <th style={{ padding: '8px' }}>Sócio</th>
                                    <th style={{ padding: '8px' }}>Valor</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allWithdrawals.map(w => (
                                    <tr key={w.id}>
                                        {editingWithdrawal && editingWithdrawal.id === w.id ? (
                                            <>
                                                <td><input type="date" name="withdrawal_date" value={formatDateForInput(editingWithdrawal.withdrawal_date)} onChange={handleEditWithdrawalChange} style={{padding: '5px'}}/></td>
                                                <td>{w.partner_name}</td>
                                                <td><input type="number" name="amount" value={editingWithdrawal.amount} onChange={handleEditWithdrawalChange} style={{padding: '5px'}}/></td>
                                                <td style={{textAlign: 'center'}}>
                                                    <button onClick={handleUpdateWithdrawal} className="btn" style={{backgroundColor: 'var(--cor-sucesso)', width: 'auto', padding: '5px 10px', fontSize: '0.9em'}}>Salvar</button>
                                                    <button onClick={handleCancelEditWithdrawal} className="btn" style={{backgroundColor: '#888', width: 'auto', padding: '5px 10px', marginLeft: '5px', fontSize: '0.9em'}}>Cancelar</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '8px' }}>{new Date(w.withdrawal_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                                <td style={{ padding: '8px' }}>{w.partner_name}</td>
                                                <td style={{ padding: '8px' }}>{formatCurrency(w.amount)}</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <button onClick={() => handleStartEditWithdrawal(w)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginRight: '10px' }} title="Editar">✏️</button>
                                                    <button onClick={() => handleDeleteWithdrawal(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }} title="Excluir">🗑️</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPartnersPage;