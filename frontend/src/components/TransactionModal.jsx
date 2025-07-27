import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../apiConfig'; // <-- ADICIONADO

const formatCurrency = (value) => {
    if (isNaN(value) || value === null || value === '') return '';
    const numberValue = Number(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
};

const parseCurrency = (value) => {
    if (!value) return 0;
    const number = Number(String(value).replace(/\R\$\s?/, '').replace(/\./g, '').replace(',', '.'));
    return isNaN(number) ? 0 : number;
};

function TransactionModal({ isOpen, onClose, onSave, transactionToEdit, initialType = 'venda', items, allTransactions, defaultEmployeeId }) {
    const [funcionarios, setFuncionarios] = useState([]);
    const [tipo, setTipo] = useState(initialType);
    const [attachmentFile, setAttachmentFile] = useState(null);

    const initialRowState = {
        employee_id: defaultEmployeeId || '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        quantity: 1,
        unit_price: '',
        status: 'A Pagar'
    };
    const [rows, setRows] = useState([initialRowState]);
    
    const DATA_API_URL = `${API_URL}/api/data`; // <-- ADICIONADO para simplificar

    useEffect(() => {
        if (isOpen) {
            setAttachmentFile(null);
            const fetchEmployees = async () => {
                const token = localStorage.getItem('token');
                try {
                    const response = await axios.get(`${DATA_API_URL}/employees`, { headers: { 'x-auth-token': token } }); // <-- ALTERADO
                    setFuncionarios(response.data);
                    if (response.data.length > 0 && !transactionToEdit && !defaultEmployeeId) {
                        setRows(prev => {
                            const newRows = [...prev];
                            newRows[0].employee_id = response.data[0].id;
                            return newRows;
                        });
                    }
                } catch (error) { console.error("Erro ao buscar funcionários", error); }
            };
            fetchEmployees();

            if (transactionToEdit) {
                setTipo(transactionToEdit.type);
                setRows([{
                    employee_id: transactionToEdit.employee_id,
                    transaction_date: new Date(transactionToEdit.transaction_date).toISOString().split('T')[0],
                    description: transactionToEdit.description,
                    category: transactionToEdit.category || '',
                    quantity: transactionToEdit.quantity,
                    unit_price: transactionToEdit.unit_price,
                    status: transactionToEdit.status,
                }]);
            } else {
                setTipo(initialType);
                setRows([{ ...initialRowState, employee_id: defaultEmployeeId || (funcionarios.length > 0 ? funcionarios[0].id : '') }]);
            }
        }
    }, [isOpen, transactionToEdit, initialType, defaultEmployeeId]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        setAttachmentFile(e.target.files[0]);
    };
    
    const handleRowChange = (index, e) => {
        const { name, value } = e.target;
        const newRows = [...rows];
        if (name === 'unit_price') {
            const digitsOnly = value.replace(/\D/g, '');
            const realValue = Number(digitsOnly) / 100;
            newRows[index][name] = realValue;
        } else {
            newRows[index][name] = value;
        }
        setRows(newRows);
    };

    const handleDescriptionBlur = (index) => {
        const currentRow = rows[index];
        if (currentRow.description && currentRow.category && allTransactions && !currentRow.unit_price) {
            const lastTransaction = allTransactions
                .filter(t => t.description === currentRow.description && t.category === currentRow.category)
                .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];
            if (lastTransaction) {
                const newRows = [...rows];
                newRows[index].unit_price = lastTransaction.unit_price;
                setRows(newRows);
            }
        }
    };

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        setRows([...rows, { ...lastRow, description: '', category: '', quantity: 1, unit_price: '' }]);
    };

    const removeRow = (index) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const TRANSACTIONS_API_URL = `${DATA_API_URL}/transactions`; // <-- ALTERADO
        
        try {
            for (const row of rows) {
                if (!row.employee_id) {
                    toast.error("Por favor, selecione um funcionário para cada lançamento.");
                    return;
                }
            }

            let transactionIdToAttach = null;

            if (transactionToEdit) {
                const response = await axios.put(`${TRANSACTIONS_API_URL}/${transactionToEdit.id}`, { ...rows[0], type: tipo }, { headers: { 'x-auth-token': token } }); // <-- ALTERADO
                transactionIdToAttach = response.data.id;
                onSave(response.data, true);
                toast.success('Lançamento atualizado com sucesso!');
            } else {
                const responses = await Promise.all(rows.map(row => 
                    axios.post(TRANSACTIONS_API_URL, { ...row, type: tipo }, { headers: { 'x-auth-token': token } }) // <-- ALTERADO
                ));
                // Para o anexo, associamos ao primeiro lançamento da lista
                transactionIdToAttach = responses[0].data.id; 
                onSave();
                toast.success('Lançamentos salvos com sucesso!');
            }

            if (attachmentFile && transactionIdToAttach && tipo === 'gasto') {
                const formData = new FormData();
                formData.append('attachment', attachmentFile);
                await axios.post(`${TRANSACTIONS_API_URL}/${transactionIdToAttach}/attach`, formData, { // <-- ALTERADO
                    headers: { 
                        'x-auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Anexo enviado com sucesso!');
                onSave(); // Recarrega os dados na página principal para mostrar o ícone do clipe
            }
            
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao salvar o lançamento.');
        }
    };

    const gridColumns = transactionToEdit 
        ? '1.5fr 1.2fr 0.8fr 2fr 2fr 1.2fr 1.2fr 1.5fr' 
        : '1.5fr 1.2fr 0.8fr 2fr 2fr 1.2fr 1.2fr 1.5fr 0.5fr';

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <datalist id="description-list">{items[tipo === 'venda' ? 'produto' : 'compra'].map(item => <option key={item.id} value={item.name} />)}</datalist>
            <datalist id="category-list">{items[tipo === 'venda' ? 'comprador' : 'fornecedor'].map(item => <option key={item.id} value={item.name} />)}</datalist>

            <div style={{ width: '90%', maxWidth: '1100px' }} className="card">
                <h2>{transactionToEdit ? 'Editar' : 'Nova'} {tipo === 'venda' ? 'Venda' : 'Gasto'}</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '15px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '10px', fontWeight: 'bold', marginBottom: '5px', color: 'var(--cor-texto-label)', fontSize: '0.9em' }}>
                            <div style={{ textAlign: 'center' }}>Funcionário</div>
                            <div style={{ textAlign: 'center' }}>Data</div>
                            <div style={{ textAlign: 'center' }}>Qtd</div>
                            <div style={{ textAlign: 'center' }}>{tipo === 'venda' ? 'Produto' : 'Compra'}</div>
                            <div style={{ textAlign: 'center' }}>{tipo === 'venda' ? 'Comprador' : 'Fornecedor'}</div>
                            <div style={{ textAlign: 'center' }}>Valor Unitário</div>
                            <div style={{ textAlign: 'center' }}>Total</div>
                            <div style={{ textAlign: 'center' }}>Status</div>
                            {!transactionToEdit && <div />}
                        </div>

                        {rows.map((row, index) => {
    const total = (row.quantity || 0) * (row.unit_price || 0);
    return (
        <div key={index} className="transaction-modal-row" style={{ gridTemplateColumns: gridColumns }}>
            <div>
                <label>Funcionário</label>
                <select name="employee_id" value={row.employee_id} onChange={(e) => handleRowChange(index, e)} required disabled={!!defaultEmployeeId && !transactionToEdit}>
                    <option value="" disabled>Selecione...</option>
                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>

            <div>
                <label>Data</label>
                <input name="transaction_date" type="date" value={row.transaction_date} onChange={(e) => handleRowChange(index, e)} required />
            </div>

            <div>
                <label>Qtd</label>
                <input name="quantity" type="number" step="0.01" value={row.quantity} onChange={(e) => handleRowChange(index, e)} required />
            </div>

            <div>
                <label>{tipo === 'venda' ? 'Produto' : 'Compra'}</label>
                <input name="description" value={row.description} onChange={(e) => handleRowChange(index, e)} onBlur={() => handleDescriptionBlur(index)} list="description-list" required />
            </div>

            <div>
                <label>{tipo === 'venda' ? 'Comprador' : 'Fornecedor'}</label>
                <input name="category" value={row.category} onChange={(e) => handleRowChange(index, e)} list="category-list" />
            </div>

            <div>
                <label>Valor Unitário</label>
                <input type="text" name="unit_price" value={formatCurrency(row.unit_price)} onChange={(e) => handleRowChange(index, e)} required />
            </div>

            <div>
                <label>Total</label>
                <input name="total" value={formatCurrency(total)} disabled />
            </div>

            <div>
                <label>Status</label>
                <select name="status" value={row.status} onChange={(e) => handleRowChange(index, e)} required>
                    <option value="A Pagar">A Pagar</option>
                    <option value="Pago">Pago</option>
                </select>
            </div>

            {!transactionToEdit && (
                <div>
                    <label>Remover</label>
                    <button type="button" onClick={() => removeRow(index)} className="btn" style={{ backgroundColor: 'var(--cor-erro)', width: '100%' }}>
                        ✖ Remover
                    </button>
                </div>
            )}
        </div>
    );
})}

                    </div>
                    
                    {tipo === 'gasto' && (
                         <div className="input-group" style={{marginTop: '15px'}}>
                            <label>{transactionToEdit && transactionToEdit.attachment_id ? 'Substituir Anexo (Opcional)' : 'Anexo (Opcional)'}</label>
                            <input type="file" name="attachment" onChange={handleFileChange} />
                        </div>
                    )}

                    {!transactionToEdit && (
                        <button type="button" onClick={addRow} className="btn" style={{ width: 'auto', marginTop: '10px' }}>Adicionar Linha</button>
                    )}
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ backgroundColor: '#888', width: 'auto' }}>Cancelar</button>
                        <button type="submit" className="btn" style={{ width: 'auto' }}>Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TransactionModal;