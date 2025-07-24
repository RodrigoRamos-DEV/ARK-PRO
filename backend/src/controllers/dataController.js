const db = require('../config/db');

// --- FUNCIONÁRIOS ---
exports.getEmployees = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM employees WHERE client_id = $1 ORDER BY name', [req.user.clientId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor' });
    }
};

exports.addEmployee = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome do funcionário é obrigatório.' });
    }
    try {
        const result = await db.query(
            'INSERT INTO employees (client_id, name) VALUES ($1, $2) RETURNING *',
            [req.user.clientId, name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Já existe um funcionário com este nome.' });
        }
        res.status(500).json({ error: 'Erro no servidor' });
    }
};

// --- ITENS DE CADASTRO (PRODUTOS, COMPRADORES, ETC) ---
exports.getAllItems = async (req, res) => {
    try {
        const result = await db.query('SELECT id, type, name FROM items WHERE client_id = $1 ORDER BY name', [req.user.clientId]);
        const items = {
            produto: [],
            comprador: [],
            compra: [],
            fornecedor: []
        };
        result.rows.forEach(item => {
            if (items[item.type]) { items[item.type].push({ id: item.id, name: item.name }); }
        });
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao buscar itens.' });
    }
};

exports.addItem = async (req, res) => {
    const { type, name } = req.body;
    if (!type || !name) { return res.status(400).json({ error: 'Tipo e nome são obrigatórios.' }); }
    try {
        const result = await db.query(
            'INSERT INTO items (client_id, type, name) VALUES ($1, $2, $3) RETURNING id, name, type',
            [req.user.clientId, type, name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') { return res.status(400).json({ error: 'Este item já existe.' }); }
        res.status(500).json({ error: 'Erro no servidor ao adicionar item.' });
    }
};

exports.updateItem = async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    try {
        const result = await db.query(
            'UPDATE items SET name = $1 WHERE id = $2 AND client_id = $3 RETURNING id, name, type',
            [name, id, req.user.clientId]
        );
        if (result.rowCount === 0) { return res.status(404).json({ error: 'Item não encontrado.' }); }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao atualizar item.' });
    }
};

exports.deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM items WHERE id = $1 AND client_id = $2', [id, req.user.clientId]);
        if (result.rowCount === 0) { return res.status(404).json({ error: 'Item não encontrado.' }); }
        res.json({ msg: 'Item deletado com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao deletar item.' });
    }
};

// --- TRANSAÇÕES ---
exports.getTransactions = async (req, res) => {
    const clientId = req.user.clientId;
    const { employeeId, startDate, endDate, status, product, buyer, purchase, supplier } = req.query;
    let queryText = 'SELECT t.*, e.name as employee_name FROM transactions t JOIN employees e ON t.employee_id = e.id WHERE t.client_id = $1';
    let queryParams = [clientId];
    let paramIndex = 2;
    if (employeeId && employeeId !== 'todos') { queryText += ` AND t.employee_id = $${paramIndex++}`; queryParams.push(employeeId); }
    if (startDate) { queryText += ` AND t.transaction_date >= $${paramIndex++}`; queryParams.push(startDate); }
    if (endDate) { queryText += ` AND t.transaction_date <= $${paramIndex++}`; queryParams.push(endDate); }
    if (status && status !== 'todos') { queryText += ` AND t.status = $${paramIndex++}`; queryParams.push(status); }
    if (product && product !== 'todos') { queryText += ` AND t.type = 'venda' AND t.description = $${paramIndex++}`; queryParams.push(product); }
    if (buyer && buyer !== 'todos') { queryText += ` AND t.type = 'venda' AND t.category = $${paramIndex++}`; queryParams.push(buyer); }
    if (purchase && purchase !== 'todos') { queryText += ` AND t.type = 'gasto' AND t.description = $${paramIndex++}`; queryParams.push(purchase); }
    if (supplier && supplier !== 'todos') { queryText += ` AND t.type = 'gasto' AND t.category = $${paramIndex++}`; queryParams.push(supplier); }
    queryText += ' ORDER BY t.transaction_date DESC';
    try {
        const transactionsResult = await db.query(queryText, queryParams);
        res.json(transactionsResult.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao buscar transações.');
    }
};

const validateTransactionItems = async (clientId, type, description, category) => {
    const descriptionType = type === 'venda' ? 'produto' : 'compra';
    const categoryType = type === 'venda' ? 'comprador' : 'fornecedor';
    const descResult = await db.query('SELECT 1 FROM items WHERE client_id = $1 AND type = $2 AND name = $3', [clientId, descriptionType, description]);
    if (descResult.rowCount === 0) {
        throw new Error(`O item '${description}' não está cadastrado como um(a) ${descriptionType}.`);
    }
    if (category && category.trim() !== '') {
        const catResult = await db.query('SELECT 1 FROM items WHERE client_id = $1 AND type = $2 AND name = $3', [clientId, categoryType, category]);
        if (catResult.rowCount === 0) {
            throw new Error(`O item '${category}' não está cadastrado como um(a) ${categoryType}.`);
        }
    }
    return true;
};

exports.addTransaction = async (req, res) => {
    const { employee_id, type, transaction_date, description, category, quantity, unit_price, status } = req.body;
    if (!employee_id || !type || !transaction_date || !description || !quantity || !unit_price || !status) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }
    const total_price = parseFloat(quantity) * parseFloat(unit_price);
    try {
        await validateTransactionItems(req.user.clientId, type, description, category);
        const result = await db.query(
            'INSERT INTO transactions (client_id, employee_id, type, transaction_date, description, category, quantity, unit_price, total_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [req.user.clientId, employee_id, type, transaction_date, description, category, quantity, unit_price, total_price, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
    }
};

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { employee_id, type, transaction_date, description, category, quantity, unit_price, status } = req.body;
    const total_price = parseFloat(quantity) * parseFloat(unit_price);
    try {
        await validateTransactionItems(req.user.clientId, type, description, category);
        const result = await db.query(
            'UPDATE transactions SET employee_id = $1, transaction_date = $2, description = $3, category = $4, quantity = $5, unit_price = $6, total_price = $7, status = $8, type = $9 WHERE id = $10 AND client_id = $11 RETURNING *',
            [employee_id, transaction_date, description, category, quantity, unit_price, total_price, status, type, id, req.user.clientId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Transação não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM transactions WHERE id = $1 AND client_id = $2', [req.params.id, req.user.clientId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Transação não encontrada ou não pertence a este cliente.' });
        }
        res.json({ msg: 'Transação deletada com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao deletar transação.' });
    }
};

exports.batchDeleteTransactions = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Uma lista de IDs é necessária.' });
    }
    const client = await db.query('BEGIN');
    try {
        await db.query(
            'DELETE FROM transactions WHERE id = ANY($1) AND client_id = $2',
            [ids, req.user.clientId]
        );
        await db.query('COMMIT');
        res.json({ msg: 'Lançamentos selecionados foram deletados com sucesso.' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao deletar lançamentos.' });
    }
};

exports.generateReport = async (req, res) => {
    const { filteredData, summary, filters, viewType, employeeName } = req.body;
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
    };
    
    let title = "Relatório de Fechamento";
    let subtitle = "";
    let tableHeaders = [];
    let tableRows = "";

    const isCompradorEspecifico = viewType === 'vendas' && filters.buyer !== 'todos';
    const isFornecedorEspecifico = viewType === 'gastos' && filters.supplier !== 'todos';
    const isFuncionarioEspecifico = filters.employeeId !== 'todos';
    
    const renderRow = (item, columns) => {
        return `
            <tr>
                ${columns.map(col => `<td>${item[col.key] || ''}</td>`).join('')}
            </tr>
        `;
    };
    
    // Simplificando a lógica de geração de linhas para evitar repetição
    const generateTableRows = (data, headers) => {
        return data.map(item => {
            let rowHtml = '<tr>';
            for (const header of headers) {
                let cellValue = '';
                switch(header.key) {
                    case 'transaction_date': cellValue = formatDate(item.transaction_date); break;
                    case 'employee_name': cellValue = item.employee_name; break;
                    case 'type': cellValue = `<span style="text-transform: capitalize;">${item.type}</span>`; break;
                    case 'description': cellValue = item.description; break;
                    case 'category': cellValue = item.category; break;
                    case 'total_price': cellValue = `<span style="color:${item.type === 'venda' ? 'green' : 'red'};">${formatCurrency(item.total_price)}</span>`; break;
                    case 'status': cellValue = item.status; break;
                    default: cellValue = '';
                }
                rowHtml += `<td>${cellValue}</td>`;
            }
            rowHtml += '</tr>';
            return rowHtml;
        }).join('');
    };


    if (isCompradorEspecifico) {
        title = "Relatório de Fechamento - Venda";
        subtitle = `<h1 style="font-size: 2.2em; margin: 10px 0;">${filters.buyer.toUpperCase()}</h1>`;
        tableHeaders = ['Data', 'Qtd', 'Produto', 'Valor Unit.', 'Valor Total', 'Status'];
        // A lógica específica para este cenário precisaria de mais dados (qtd, valor unit) que não estão no filteredData atual
        // Por simplicidade, usaremos a lógica geral por agora.
    } else if (isFornecedorEspecifico) {
        title = "Relatório de Fechamento - Compra";
        subtitle = `<h1 style="font-size: 2.2em; margin: 10px 0;">${filters.supplier.toUpperCase()}</h1>`;
        tableHeaders = ['Data', 'Qtd', 'Compra', 'Valor Unit.', 'Valor Total', 'Status'];
    } else if (isFuncionarioEspecifico) {
        subtitle = `<h1 style="font-size: 2.2em; margin: 10px 0;">${employeeName.toUpperCase()}</h1>`;
        if (viewType === 'vendas') title = "Relatório de Fechamento - Venda";
        else if (viewType === 'gastos') title = "Relatório de Fechamento - Compra";
    } else {
        title = "Relatório de Fechamento - Geral";
    }
    
    const includeFuncionario = !isFuncionarioEspecifico;
    const finalTableHeaders = includeFuncionario
        ? ['Data', 'Funcionário', 'Tipo', 'Descrição', 'Comprador/Forn.', 'Total', 'Status']
        : ['Data', 'Tipo', 'Descrição', 'Comprador/Forn.', 'Total', 'Status'];
        
    tableRows = filteredData.map(item => `
        <tr>
            <td>${formatDate(item.transaction_date)}</td>
            ${includeFuncionario ? `<td>${item.employee_name || ''}</td>` : ''}
            <td style="text-transform: capitalize;">${item.type}</td>
            <td>${item.description || ''}</td>
            <td>${item.category || ''}</td>
            <td style="color:${item.type === 'venda' ? 'green' : 'red'};">${formatCurrency(item.total_price)}</td>
            <td>${item.status || ''}</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Fechamento</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background-color:#f2f2f2}.resumo{margin-top:20px;padding:15px;border:1px solid #ccc;background:#f9f9f9}@media print{.no-print{display:none}}</style></head>
        <body>
            <h1>${title}</h1>
            ${subtitle}
            <p><strong>Período:</strong> ${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}</p>
            <button class="no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
            <table>
                <thead><tr>${finalTableHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div class="resumo">
                <h2>Resumo Financeiro</h2>
                <p><strong>Total Ganhos:</strong> ${formatCurrency(summary.ganhos)}</p>
                <p><strong>Total Gastos:</strong> ${formatCurrency(summary.gastos)}</p>
                <hr>
                <p><strong>Saldo Final:</strong> ${formatCurrency(summary.saldo)}</p>
            </div>
        </body></html>
    `;
    res.send(html);
};