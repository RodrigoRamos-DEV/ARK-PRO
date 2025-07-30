const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir); }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

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
    if (!name) { return res.status(400).json({ error: 'O nome do funcionário é obrigatório.' }); }
    try {
        const result = await db.query( 'INSERT INTO employees (client_id, name) VALUES ($1, $2) RETURNING *', [req.user.clientId, name] );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') { return res.status(400).json({ error: 'Já existe um funcionário com este nome.' }); }
        res.status(500).json({ error: 'Erro no servidor' });
    }
};

exports.getAllItems = async (req, res) => {
    try {
        const result = await db.query('SELECT id, type, name FROM items WHERE client_id = $1 ORDER BY name', [req.user.clientId]);
        const items = { produto: [], comprador: [], compra: [], fornecedor: [] };
        result.rows.forEach(item => { if (items[item.type]) { items[item.type].push({ id: item.id, name: item.name }); } });
        res.json(items);
    } catch (err) {  console.error(err.message); res.status(500).json({ error: 'Erro no servidor ao buscar itens.' });  }
};

exports.addItem = async (req, res) => {
    const { type, name } = req.body;
    if (!type || !name) { return res.status(400).json({ error: 'Tipo e nome são obrigatórios.' }); }
    try {
        const result = await db.query('INSERT INTO items (client_id, type, name) VALUES ($1, $2, $3) RETURNING id, name, type', [req.user.clientId, type, name]);
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
        const result = await db.query('UPDATE items SET name = $1 WHERE id = $2 AND client_id = $3 RETURNING id, name, type', [name, id, req.user.clientId]);
        if (result.rowCount === 0) { return res.status(404).json({ error: 'Item não encontrado.' }); }
        res.json(result.rows[0]);
    } catch (err) {  console.error(err.message); res.status(500).json({ error: 'Erro no servidor ao atualizar item.' });  }
};

exports.deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM items WHERE id = $1 AND client_id = $2', [id, req.user.clientId]);
        if (result.rowCount === 0) { return res.status(404).json({ error: 'Item não encontrado.' }); }
        res.json({ msg: 'Item deletado com sucesso.' });
    } catch (err) {  console.error(err.message); res.status(500).json({ error: 'Erro no servidor ao deletar item.' });  }
};

const validateTransactionItems = async (clientId, type, description, category) => {
    const descriptionType = type === 'venda' ? 'produto' : 'compra';
    const categoryType = type === 'venda' ? 'comprador' : 'fornecedor';
    const descResult = await db.query('SELECT 1 FROM items WHERE client_id = $1 AND type = $2 AND name = $3', [clientId, descriptionType, description]);
    if (descResult.rowCount === 0) { throw new Error(`O item '${description}' não está cadastrado como um(a) ${descriptionType}.`); }
    if (category && category.trim() !== '') {
        const catResult = await db.query('SELECT 1 FROM items WHERE client_id = $1 AND type = $2 AND name = $3', [clientId, categoryType, category]);
        if (catResult.rowCount === 0) { throw new Error(`O item '${category}' não está cadastrado como um(a) ${categoryType}.`); }
    }
    return true;
};

exports.getTransactions = async (req, res) => {
    const clientId = req.user.clientId;
    const { employeeId, startDate, endDate, status, product, buyer, purchase, supplier } = req.query;
    let queryText = ` SELECT t.*, e.name as employee_name, a.id as attachment_id, a.file_path, a.file_name FROM transactions t JOIN employees e ON t.employee_id = e.id LEFT JOIN attachments a ON t.id = a.transaction_id WHERE t.client_id = $1 `;
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

exports.addTransaction = async (req, res) => {
    const { employee_id, type, transaction_date, description, category, quantity, unit_price, status } = req.body;
    if (!employee_id || !type || !transaction_date || !description || !quantity || !unit_price || !status) { return res.status(400).json({ error: "Todos os campos são obrigatórios." }); }
    const total_price = parseFloat(quantity) * parseFloat(unit_price);
    try {
        await validateTransactionItems(req.user.clientId, type, description, category);
        const result = await db.query( 'INSERT INTO transactions (client_id, employee_id, type, transaction_date, description, category, quantity, unit_price, total_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *', [req.user.clientId, employee_id, type, transaction_date, description, category, quantity, unit_price, total_price, status] );
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
        const result = await db.query( 'UPDATE transactions SET employee_id = $1, transaction_date = $2, description = $3, category = $4, quantity = $5, unit_price = $6, total_price = $7, status = $8, type = $9 WHERE id = $10 AND client_id = $11 RETURNING *', [employee_id, transaction_date, description, category, quantity, unit_price, total_price, status, type, id, req.user.clientId] );
        if (result.rowCount === 0) { return res.status(404).json({ error: 'Transação não encontrada.' }); }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM transactions WHERE id = $1 AND client_id = $2', [id, req.user.clientId]);
        if (result.rowCount === 0) { return res.status(404).json({ error: 'Transação não encontrada ou não pertence a este cliente.' }); }
        res.json({ msg: 'Transação deletada com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao deletar transação.' });
    }
};

exports.batchDeleteTransactions = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) { return res.status(400).json({ error: 'Uma lista de IDs é necessária.' }); }
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        await client.query( 'DELETE FROM transactions WHERE id = ANY($1) AND client_id = $2', [ids, req.user.clientId] );
        await client.query('COMMIT');
        res.json({ msg: 'Lançamentos selecionados foram deletados com sucesso.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao deletar lançamentos.' });
    } finally {
        client.release();
    }
};

exports.generateReport = async (req, res) => {
    const clientId = req.user.clientId;
    const { filteredData, summary, filters, viewType, employeeName } = req.body;
    
    try {
        const clientInfo = await db.query('SELECT company_name, logo_path, contact_phone, full_address FROM clients WHERE id = $1', [clientId]);
        const profile = clientInfo.rows[0] || {};
        
        const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
        const formatQuantity = (value) => new Intl.NumberFormat('pt-BR').format(value || 0);
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return new Date(date.getTime() + (date.getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR');
        };

        filteredData.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

        let title = "Relatório de Fechamento";
        let subtitle = "";
        const isCompradorEspecifico = viewType === 'vendas' && filters.buyer !== 'todos';
        const isFornecedorEspecifico = viewType === 'gastos' && filters.supplier !== 'todos';
        const isFuncionarioEspecifico = filters.employeeId !== 'todos';

        if (isCompradorEspecifico) {
            title = "Relatório de Fechamento - Venda";
            subtitle = `<h2 style="font-size: 1.5em; margin: 10px 0;">Comprador: ${filters.buyer.toUpperCase()}</h2>`;
        } else if (isFornecedorEspecifico) {
            title = "Relatório de Fechamento - Compra";
            subtitle = `<h2 style="font-size: 1.5em; margin: 10px 0;">Fornecedor: ${filters.supplier.toUpperCase()}</h2>`;
        } else if (isFuncionarioEspecifico) {
            subtitle = `<h2 style="font-size: 1.5em; margin: 10px 0;">Funcionário: ${employeeName.toUpperCase()}</h2>`;
            if (viewType === 'vendas') title = "Relatório de Fechamento - Venda";
            else if (viewType === 'gastos') title = "Relatório de Fechamento - Compra";
        } else {
            title = "Relatório de Fechamento - Geral";
        }

        let finalTableHeaders = [];
        let tableRows = '';

        if (isCompradorEspecifico || isFornecedorEspecifico) {
            finalTableHeaders = ['Data', 'Quantidade', viewType === 'vendas' ? 'Produto' : 'Compra', 'Valor Unitário', 'Valor Total', 'Status'];
            tableRows = filteredData.map(item => `
                <tr>
                    <td>${formatDate(item.transaction_date)}</td>
                    <td>${formatQuantity(item.quantity)}</td>
                    <td>${item.description || ''}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td style="color:${item.type === 'venda' ? 'green' : 'red'};">${formatCurrency(item.total_price)}</td>
                    <td>${item.status || ''}</td>
                </tr>
            `).join('');
        } else {
            finalTableHeaders = ['Data', 'Funcionário', 'Quantidade', 'Produto/Compra', 'Valor Unitário', 'Valor Total', 'Comprador/Forn.', 'Status'];
            if (isFuncionarioEspecifico) {
                finalTableHeaders = finalTableHeaders.filter(h => h !== 'Funcionário');
            }
            tableRows = filteredData.map(item => `
                <tr>
                    <td>${formatDate(item.transaction_date)}</td>
                    ${!isFuncionarioEspecifico ? `<td>${item.employee_name || ''}</td>` : ''}
                    <td>${formatQuantity(item.quantity)}</td>
                    <td>${item.description || ''}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td style="color:${item.type === 'venda' ? 'green' : 'red'};">${formatCurrency(item.total_price)}</td>
                    <td>${item.category || ''}</td>
                    <td>${item.status || ''}</td>
                </tr>
            `).join('');
        }
        
        const logoUrl = profile.logo_path ? `${process.env.BACKEND_URL}/${profile.logo_path.replace(/\\/g, '/')}` : '';

        const html = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Fechamento</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; margin: 20px;} .header{display:flex; justify-content: space-between; align-items:center; border-bottom: 2px solid #ccc; padding-bottom:10px; margin-bottom: 20px;} .header-logo{flex: 1; text-align: left;} .header-logo img{max-width:120px; max-height:100px; object-fit: contain;} .header-center{flex: 2; text-align: center;} .header-placeholder{flex: 1;} table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background-color:#f2f2f2}.resumo{margin-top:20px;padding:15px;border:1px solid #ccc;background:#f9f9f9}@media print{.no-print{display:none}}</style></head>
            <body>
                <div class="header">
                    <div class="header-logo">
                        ${profile.logo_path ? `<img src="${logoUrl}" alt="Logo">` : ''}
                    </div>
                    <div class="header-center">
                        <h1 style="margin:0; font-size: 1.8em;">${profile.company_name || req.user.companyName}</h1>
                        <p style="margin:0;">${profile.full_address || ''}</p>
                        <p style="margin:0;">${profile.contact_phone || ''}</p>
                    </div>
                    <div class="header-placeholder"></div>
                </div>
                <h2>${title}</h2>
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
    } catch (err) {
        console.error(err.message);
        res.status(500).send("<h1>Erro interno ao gerar o relatório.</h1>");
    }
};

exports.addAttachment = async (req, res) => {
    upload.single('attachment')(req, res, async function (err) {
        if (err) { console.error("Multer error:", err); return res.status(500).json({ error: "Erro no upload do ficheiro." }); }
        if (!req.file) { return res.status(400).json({ error: "Nenhum ficheiro enviado." }); }
        const { transactionId } = req.params;
        const { originalname, path: filePath, mimetype } = req.file;
        try {
            const trxResult = await db.query('SELECT id FROM transactions WHERE id = $1 AND client_id = $2', [transactionId, req.user.clientId]);
            if (trxResult.rowCount === 0) {
                fs.unlinkSync(filePath);
                return res.status(403).json({ error: "Acesso negado a esta transação." });
            }
            await db.query('DELETE FROM attachments WHERE transaction_id = $1', [transactionId]);
            await db.query( 'INSERT INTO attachments (client_id, transaction_id, file_name, file_path, file_type) VALUES ($1, $2, $3, $4, $5) RETURNING id', [req.user.clientId, transactionId, originalname, filePath, mimetype] );
            res.status(201).json({ msg: 'Anexo adicionado com sucesso!' });
        } catch (dbErr) {
            console.error(dbErr.message);
            fs.unlinkSync(filePath); 
            res.status(500).json({ error: 'Erro ao guardar a referência do anexo.' });
        }
    });
};

exports.deleteAttachment = async (req, res) => {
    const { attachmentId } = req.params;
    const clientId = req.user.clientId;
    try {
        const attachResult = await db.query( 'SELECT file_path FROM attachments WHERE id = $1 AND client_id = $2', [attachmentId, clientId] );
        if (attachResult.rowCount === 0) { return res.status(404).json({ error: "Anexo não encontrado ou não pertence a este cliente." }); }
        const { file_path } = attachResult.rows[0];
        await db.query('DELETE FROM attachments WHERE id = $1', [attachmentId]);
        if (fs.existsSync(file_path)) { fs.unlinkSync(file_path); }
        res.json({ msg: 'Anexo excluído com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao excluir o anexo.' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT company_name, logo_path, contact_phone, full_address FROM clients WHERE id = $1',
            [req.user.clientId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Perfil do cliente não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao buscar perfil.' });
    }
};

exports.updateProfile = (req, res) => {
    upload.single('logo')(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ error: "Erro no upload do logo." });
        }

        const { companyName, contactPhone, fullAddress } = req.body;
        const clientId = req.user.clientId;
        let logoPath = null;
        if (req.file) {
            logoPath = req.file.path;
        }

        try {
            if (logoPath) {
                const oldProfile = await db.query('SELECT logo_path FROM clients WHERE id = $1', [clientId]);
                if (oldProfile.rows[0] && oldProfile.rows[0].logo_path) {
                    if (fs.existsSync(oldProfile.rows[0].logo_path)) {
                        fs.unlinkSync(oldProfile.rows[0].logo_path);
                    }
                }
            }
            
            const fieldsToUpdate = [];
            const values = [];
            let queryIndex = 1;

            if (companyName) {
                fieldsToUpdate.push(`company_name = $${queryIndex++}`);
                values.push(companyName);
            }
            if (contactPhone) {
                fieldsToUpdate.push(`contact_phone = $${queryIndex++}`);
                values.push(contactPhone);
            }
            if (fullAddress) {
                fieldsToUpdate.push(`full_address = $${queryIndex++}`);
                values.push(fullAddress);
            }
            if (logoPath) {
                fieldsToUpdate.push(`logo_path = $${queryIndex++}`);
                values.push(logoPath);
            }

            if (fieldsToUpdate.length === 0 && !logoPath) {
                // Se nenhum campo de texto foi alterado E nenhum ficheiro foi enviado, não faz nada.
                return res.json({ msg: 'Nenhum dado para atualizar.' });
            }

            // Se apenas o logo foi enviado mas nenhum outro campo de texto
            if (fieldsToUpdate.length > 0) {
                 values.push(clientId);
                const queryText = `UPDATE clients SET ${fieldsToUpdate.join(', ')} WHERE id = $${queryIndex} RETURNING *`;
                const result = await db.query(queryText, values);
                return res.json({ msg: 'Perfil atualizado com sucesso!', updatedProfile: result.rows[0] });
            } else if (logoPath) {
                // Caso especial onde SÓ o logo é atualizado
                 const result = await db.query('UPDATE clients SET logo_path = $1 WHERE id = $2 RETURNING *', [logoPath, clientId]);
                 return res.json({ msg: 'Perfil atualizado com sucesso!', updatedProfile: result.rows[0] });
            }
            
        } catch (dbErr) {
            console.error(dbErr.message);
            if (logoPath) { fs.unlinkSync(logoPath); }
            res.status(500).json({ error: 'Erro ao atualizar o perfil na base de dados.' });
        }
    });
};