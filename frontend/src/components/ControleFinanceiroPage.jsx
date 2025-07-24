import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

function ControleFinanceiroPage() {
    const [user, setUser] = useState({});
    const [allData, setAllData] = useState({ transactions: [], employees: [], items: { produto: [], comprador: [], compra: [], fornecedor: [] } });
    
    const getMonthDateRange = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const formatDate = (date) => date.toISOString().split('T')[0];
        return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    };

    const [filters, setFilters] = useState({
        employeeId: 'todos',
        startDate: getMonthDateRange().startDate,
        endDate: getMonthDateRange().endDate,
        product: 'todos',
        buyer: 'todos',
        purchase: 'todos',
        supplier: 'todos',
        status: 'todos'
    });
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState('geral');

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (loggedInUser) {
            setUser(loggedInUser);
        }

        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const [trxResponse, empResponse, itemsResponse] = await Promise.all([
                    axios.get('http://localhost:3000/api/data/transactions', { headers: { 'x-auth-token': token } }),
                    axios.get('http://localhost:3000/api/data/employees', { headers: { 'x-auth-token': token } }),
                    axios.get('http://localhost:3000/api/data/items', { headers: { 'x-auth-token': token } })
                ]);
                setAllData({ transactions: trxResponse.data, employees: empResponse.data, items: itemsResponse.data });
            } catch (error) { console.error("Erro ao buscar dados", error); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const filteredTransactions = useMemo(() => {
        return allData.transactions.filter(trx => {
            if (viewType === 'vendas' && trx.type !== 'venda') return false;
            if (viewType === 'gastos' && trx.type !== 'gasto') return false;
            
            const endDatePlusOne = filters.endDate ? new Date(filters.endDate) : null;
            if(endDatePlusOne) endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

            const trxDate = new Date(trx.transaction_date);
            return (filters.employeeId === 'todos' || trx.employee_id === filters.employeeId) &&
                (!filters.startDate || trxDate >= new Date(filters.startDate)) &&
                (!filters.endDate || trxDate < endDatePlusOne) &&
                (filters.status === 'todos' || trx.status === filters.status) &&
                (trx.type === 'gasto' || filters.product === 'todos' || trx.description === filters.product) &&
                (trx.type === 'gasto' || filters.buyer === 'todos' || trx.category === filters.buyer) &&
                (trx.type === 'venda' || filters.purchase === 'todos' || trx.description === filters.purchase) &&
                (trx.type === 'venda' || filters.supplier === 'todos' || trx.category === filters.supplier);
        });
    }, [allData.transactions, filters, viewType]);

    const summary = useMemo(() => {
        const ganhos = filteredTransactions.filter(t => t.type === 'venda').reduce((acc, t) => acc + parseFloat(t.total_price), 0);
        const gastos = filteredTransactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + parseFloat(t.total_price), 0);
        return { ganhos, gastos, saldo: ganhos - gastos };
    }, [filteredTransactions]);

    const barChartData = useMemo(() => {
        const data = {};
        const dataSetLabel = viewType === 'gastos' ? 'Total de Gastos por Compra' : 'Total de Vendas por Produto';
        const targetType = viewType === 'gastos' ? 'gasto' : 'venda';
        filteredTransactions.filter(t => t.type === targetType).forEach(t => { data[t.description] = (data[t.description] || 0) + parseFloat(t.total_price); });
        return {
            labels: Object.keys(data),
            datasets: [{
                label: dataSetLabel,
                data: Object.values(data),
                backgroundColor: viewType === 'gastos' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(109, 40, 217, 0.6)',
            }]
        };
    }, [filteredTransactions, viewType]);

    const doughnutChartData = useMemo(() => {
        const data = {};
        filteredTransactions.forEach(t => { data[t.status] = (data[t.status] || 0) + 1; });
        return {
            labels: Object.keys(data),
            datasets: [{
                label: 'Contagem por Status',
                data: Object.values(data),
                backgroundColor: ['#16a34a', '#dc2626', '#f59e0b', '#3b82f6'],
            }]
        };
    }, [filteredTransactions]);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    const handleGenerateReport = async () => {
        const token = localStorage.getItem('token');
        try {
            const employeeName = filters.employeeId === 'todos' ? null : allData.employees.find(e => e.id === filters.employeeId)?.name;
            const reportData = {
                filteredData: filteredTransactions.map(t => ({...t, employee_name: allData.employees.find(e => e.id === t.employee_id)?.name})),
                summary,
                filters,
                viewType,
                employeeName
            };
            const response = await axios.post('http://localhost:3000/api/data/generate-report', reportData, { headers: { 'x-auth-token': token } });
            const reportHtml = response.data;
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(reportHtml);
            reportWindow.document.close();
        } catch (error) { console.error("Erro ao gerar relatório", error); }
    };

    if (loading) return <div className="card"><p>A carregar dados do Controle Financeiro...</p></div>;

    return (
        <div>
            <h2>{user.companyName || 'Controle Financeiro'}</h2>
            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div><label>Funcionário</label><select name="employeeId" value={filters.employeeId} onChange={handleFilterChange}><option value="todos">Todos os Funcionários</option>{allData.employees.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                    <div><label>De</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} /></div>
                    <div><label>Até</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} /></div>
                </div>
            </div>
            
            <div className="card" style={{padding: '15px'}}>
                 <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setViewType('geral')} className="btn" style={{backgroundColor: viewType === 'geral' ? 'var(--cor-primaria)' : '#e5e7eb', color: viewType === 'geral' ? 'white' : '#333', width: 'auto'}}>Relatório Geral</button>
                    <button onClick={() => setViewType('vendas')} className="btn" style={{backgroundColor: viewType === 'vendas' ? 'var(--cor-primaria)' : '#e5e7eb', color: viewType === 'vendas' ? 'white' : '#333', width: 'auto'}}>Apenas Vendas</button>
                    <button onClick={() => setViewType('gastos')} className="btn" style={{backgroundColor: viewType === 'gastos' ? 'var(--cor-primaria)' : '#e5e7eb', color: viewType === 'gastos' ? 'white' : '#333', width: 'auto'}}>Apenas Gastos</button>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                    {viewType !== 'gastos' && (
                        <>
                            <div><label>Produto</label><select name="product" value={filters.product} onChange={handleFilterChange}><option value="todos">Todos os Produtos</option>{allData.items.produto.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                            <div><label>Comprador</label><select name="buyer" value={filters.buyer} onChange={handleFilterChange}><option value="todos">Todos os Compradores</option>{allData.items.comprador.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                        </>
                    )}
                    {viewType !== 'vendas' && (
                         <>
                            <div><label>Compra</label><select name="purchase" value={filters.purchase} onChange={handleFilterChange}><option value="todos">Todas as Compras</option>{allData.items.compra.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                            <div><label>Fornecedor</label><select name="supplier" value={filters.supplier} onChange={handleFilterChange}><option value="todos">Todos os Fornecedores</option>{allData.items.fornecedor.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
                         </>
                    )}
                    
                    <div><label>Status</label><select name="status" value={filters.status} onChange={handleFilterChange}><option value="todos">Todos os Status</option><option value="Pago">Pago</option><option value="A Pagar">A Pagar</option></select></div>
                    <div><label>&nbsp;</label><button className="btn" onClick={handleGenerateReport}>Gerar Fechamento</button></div>
                </div>
            </div>

            <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
                <div><h3>Total Ganhos</h3><p style={{color: 'var(--cor-sucesso)', fontSize: '1.8em'}}>{formatCurrency(summary.ganhos)}</p></div>
                <div><h3>Total Gastos</h3><p style={{color: 'var(--cor-erro)', fontSize: '1.8em'}}>{formatCurrency(summary.gastos)}</p></div>
                <div><h3>Saldo Final</h3><p style={{color: 'var(--cor-primaria)', fontSize: '1.8em'}}>{formatCurrency(summary.saldo)}</p></div>
            </div>
            
            <div className="card grid-2-col">
                <div><h3>{viewType === 'gastos' ? 'Gastos por Compra' : 'Vendas por Produto'}</h3><Bar data={barChartData} options={{ responsive: true }} /></div>
                <div><h3>Contagem por Status</h3><Doughnut data={doughnutChartData} options={{ responsive: true }} /></div>
            </div>
        </div>
    );
}

export default ControleFinanceiroPage;