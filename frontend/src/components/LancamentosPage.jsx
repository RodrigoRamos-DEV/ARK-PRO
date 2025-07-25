import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; // LINHA ADICIONADA
import TransactionModal from './TransactionModal';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 10;

const TransactionTable = ({ title, transactions, onEdit, onDelete, onDeleteAttachment, selected, onSelect, onSelectAll }) => (
  <div className="card">
    <h3>{title}</h3>
    {transactions.length > 0 ? (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--cor-primaria)' }}>
              <th style={{ padding: '10px' }}>
                <input type="checkbox" onChange={(e) => onSelectAll(e.target.checked, transactions)}
                       checked={transactions.length > 0 && transactions.every(trx => selected.includes(trx.id))} />
              </th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Data</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Funcionário</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>{title === 'Vendas Existentes' ? 'Produto' : 'Compra'}</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>{title === 'Vendas Existentes' ? 'Comprador' : 'Fornecedor'}</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Total</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(trx => (
              <tr key={trx.id} style={{ borderBottom: '1px solid var(--cor-borda)' }}>
                <td style={{ padding: '10px' }}><input type="checkbox" checked={selected.includes(trx.id)} onChange={() => onSelect(trx.id)} /></td>
                <td style={{ padding: '10px' }}>{new Date(trx.transaction_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td style={{ padding: '10px' }}>{trx.employee_name}</td>
                <td style={{ padding: '10px' }}>{trx.description}</td>
                <td style={{ padding: '10px' }}>{trx.category}</td>
                <td style={{ padding: '10px' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trx.total_price)}</td>
                <td style={{ padding: '10px' }}>{trx.status}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                    {trx.attachment_id && (
                        <>
                            <a href={`http://localhost:3000/${trx.file_path.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" title={trx.file_name} style={{textDecoration: 'none', fontSize: '1.2em', marginRight: '10px'}}>📎</a>
                            <button onClick={() => onDeleteAttachment(trx.attachment_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cor-erro)', fontWeight: 'bold', fontSize: '1.2em', marginRight: '10px' }} title="Excluir Anexo">✖</button>
                        </>
                    )}
                    <button onClick={() => onEdit(trx)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', marginRight: '10px' }} title="Editar">✏️</button>
                    <button onClick={() => onDelete(trx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }} title="Excluir">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p>Nenhum lançamento encontrado para os filtros selecionados.</p>
    )}
  </div>
);

function LancamentosPage() {
    const [funcionarios, setFuncionarios] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('venda');
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });
    const [items, setItems] = useState({ produto: [], comprador: [], compra: [], fornecedor: [] });
    const [filters, setFilters] = useState({ employeeId: '', startDate: '', endDate: '', status: 'todos', product: 'todos', buyer: 'todos', purchase: 'todos', supplier: 'todos' });
    const [currentPageVendas, setCurrentPageVendas] = useState(1);
    const [currentPageGastos, setCurrentPageGastos] = useState(1);

    const fetchInitialData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [empResponse, itemsResponse] = await Promise.all([
                axios.get('http://localhost:3000/api/data/employees', { headers: { 'x-auth-token': token } }),
                axios.get('http://localhost:3000/api/data/items', { headers: { 'x-auth-token': token } })
            ]);
            setFuncionarios(empResponse.data);
            setItems(itemsResponse.data);
            if (empResponse.data.length > 0) {
                setFilters(prev => ({ ...prev, employeeId: empResponse.data[0].id }));
            } else {
                setFilters(prev => ({ ...prev, employeeId: 'todos' }));
            }
        } catch (err) {
            setError('Não foi possível carregar os dados para os filtros.');
        }
    };
    
    const fetchTransactions = useCallback(async () => {
        if (!filters.employeeId) return;
        setSelectedTransactions([]);
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const params = new URLSearchParams(filters);
            const response = await axios.get(`http://localhost:3000/api/data/transactions?${params.toString()}`, { headers: { 'x-auth-token': token } });
            setTransactions(response.data);
        } catch (err) { setError('Não foi possível carregar as transações.'); } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPageVendas(1);
        setCurrentPageGastos(1);
    };

    const handleSaveTransaction = (savedTransaction, isEdit) => {
        if (isEdit) {
            setTransactions(prev => prev.map(trx => trx.id === savedTransaction.id ? { ...trx, ...savedTransaction } : trx));
        } else {
            fetchTransactions();
        }
    };
    
    const closeConfirmModal = () => {
        setConfirmState({ isOpen: false, message: '', onConfirm: null });
    };

    const handleDeleteTransaction = (transactionId) => {
        setConfirmState({
            isOpen: true,
            message: 'Você tem certeza que deseja excluir este lançamento?',
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                try {
                    await axios.delete(`http://localhost:3000/api/data/transactions/${transactionId}`, { headers: { 'x-auth-token': token } });
                    setTransactions(prev => prev.filter(trx => trx.id !== transactionId));
                    closeConfirmModal();
                } catch (err) {
                    setError(err.response?.data?.error || 'Erro ao excluir');
                    closeConfirmModal();
                }
            }
        });
    };

    const handleDeleteAttachment = (attachmentId) => {
        setConfirmState({
            isOpen: true,
            message: 'Tem certeza que deseja excluir este anexo? Esta ação não pode ser desfeita.',
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                try {
                    await axios.delete(`http://localhost:3000/api/data/attachments/${attachmentId}`, { headers: { 'x-auth-token': token } });
                    toast.success("Anexo excluído com sucesso!");
                    fetchTransactions();
                    closeConfirmModal();
                } catch (error) {
                    toast.error("Erro ao excluir o anexo.");
                    closeConfirmModal();
                }
            }
        });
    };

    const handleOpenAddModal = (type) => {
        setModalType(type);
        setEditingTransaction(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (transaction) => {
        setModalType(transaction.type);
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleSelectTransaction = (transactionId) => {
        setSelectedTransactions(prev => prev.includes(transactionId) ? prev.filter(id => id !== transactionId) : [...prev, transactionId]);
    };

    const handleSelectAll = (isChecked, transactionList) => {
        const ids = transactionList.map(t => t.id);
        if (isChecked) {
            const newSelected = [...new Set([...selectedTransactions, ...ids])];
            setSelectedTransactions(newSelected);
        } else {
            const newSelected = selectedTransactions.filter(id => !ids.includes(id));
            setSelectedTransactions(newSelected);
        }
    };

    const handleBatchDelete = () => {
        if (selectedTransactions.length === 0) return;
        setConfirmState({
            isOpen: true,
            message: `Você tem certeza que deseja excluir os ${selectedTransactions.length} lançamentos selecionados?`,
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                try {
                    await axios.post('http://localhost:3000/api/data/transactions/batch-delete', { ids: selectedTransactions }, { headers: { 'x-auth-token': token } });
                    setTransactions(prev => prev.filter(trx => !selectedTransactions.includes(trx.id)));
                    setSelectedTransactions([]);
                    closeConfirmModal();
                } catch (err) {
                    setError(err.response?.data?.error || 'Erro ao excluir em massa');
                    closeConfirmModal();
                }
            }
        });
    };

    const { paginatedVendas, totalVendasPages, paginatedGastos, totalGastosPages } = useMemo(() => {
        const vendas = transactions.filter(t => t.type === 'venda');
        const gastos = transactions.filter(t => t.type === 'gasto');
        const totalVendasPages = Math.ceil(vendas.length / ITEMS_PER_PAGE) || 1;
        const startVendas = (currentPageVendas - 1) * ITEMS_PER_PAGE;
        const paginatedVendas = vendas.slice(startVendas, startVendas + ITEMS_PER_PAGE);
        const totalGastosPages = Math.ceil(gastos.length / ITEMS_PER_PAGE) || 1;
        const startGastos = (currentPageGastos - 1) * ITEMS_PER_PAGE;
        const paginatedGastos = gastos.slice(startGastos, startGastos + ITEMS_PER_PAGE);
        return { paginatedVendas, totalVendasPages, paginatedGastos, totalGastosPages };
    }, [transactions, currentPageVendas, currentPageGastos]);
  
    return (
        <div>
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTransaction}
                transactionToEdit={editingTransaction}
                initialType={modalType}
                items={items}
                allTransactions={transactions}
                defaultEmployeeId={filters.employeeId !== 'todos' ? filters.employeeId : null}
            />
            <ConfirmModal isOpen={confirmState.isOpen} onClose={closeConfirmModal} onConfirm={confirmState.onConfirm} title="Confirmar Ação">{confirmState.message}</ConfirmModal>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h2>Lançamentos</h2>
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    {selectedTransactions.length > 0 && (
                        <button className="btn" onClick={handleBatchDelete} style={{ backgroundColor: 'var(--cor-erro)' }}>Excluir ({selectedTransactions.length})</button>
                    )}
                    <button className="btn" onClick={() => handleOpenAddModal('venda')} style={{ width: 'auto', backgroundColor: 'var(--cor-sucesso)' }}>Nova Venda</button>
                    <button className="btn" onClick={() => handleOpenAddModal('gasto')} style={{ width: 'auto' }}>Novo Gasto</button>
                </div>
            </div>

            <div className="card">
                <h4>Filtros</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                    <div>
                        <label htmlFor="employeeId">Funcionário</label>
                        <select id="employeeId" name="employeeId" value={filters.employeeId} onChange={handleFilterChange}>
                            <option value="todos">Todos os Funcionários</option>
                            {funcionarios.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div><label htmlFor="startDate">De</label><input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} /></div>
                    <div><label htmlFor="endDate">Até</label><input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} /></div>
                    <div><label htmlFor="product">Produto</label><select id="product" name="product" value={filters.product} onChange={handleFilterChange}><option value="todos">Todos</option>{items.produto.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                    <div><label htmlFor="buyer">Comprador</label><select id="buyer" name="buyer" value={filters.buyer} onChange={handleFilterChange}><option value="todos">Todos</option>{items.comprador.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                    <div><label htmlFor="purchase">Compra</label><select id="purchase" name="purchase" value={filters.purchase} onChange={handleFilterChange}><option value="todos">Todas</option>{items.compra.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                    <div><label htmlFor="supplier">Fornecedor</label><select id="supplier" name="supplier" value={filters.supplier} onChange={handleFilterChange}><option value="todos">Todos</option>{items.fornecedor.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                    <div>
                        <label htmlFor="status">Status</label>
                        <select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="todos">Todos</option>
                            <option value="Pago">Pago</option>
                            <option value="A Pagar">A Pagar</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {loading ? <p>A carregar lançamentos...</p> : 
                <>
                    <TransactionTable title="Vendas Existentes" transactions={paginatedVendas} onEdit={handleOpenEditModal} onDelete={handleDeleteTransaction} onDeleteAttachment={handleDeleteAttachment} selected={selectedTransactions} onSelect={handleSelectTransaction} onSelectAll={handleSelectAll} />
                    <Pagination currentPage={currentPageVendas} totalPages={totalVendasPages} onPageChange={setCurrentPageVendas} />

                    <TransactionTable title="Gastos Existentes" transactions={paginatedGastos} onEdit={handleOpenEditModal} onDelete={handleDeleteTransaction} onDeleteAttachment={handleDeleteAttachment} selected={selectedTransactions} onSelect={handleSelectTransaction} onSelectAll={handleSelectAll} />
                    <Pagination currentPage={currentPageGastos} totalPages={totalGastosPages} onPageChange={setCurrentPageGastos} />
                </>
            }
            {error && <p className="error-message" style={{ marginTop: '15px' }}>{error}</p>}
        </div>
    );
}

export default LancamentosPage;