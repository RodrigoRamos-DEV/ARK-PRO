const db = require('../config/db');

// Busca todos os vendedores
exports.getPartners = async (req, res) => {
    console.log('[PARTNERS] Iniciando busca de vendedores...');
    try {
        // Criar tabelas se não existirem
        await db.query(`
            CREATE TABLE IF NOT EXISTS pagamentos_comissoes (
                id SERIAL PRIMARY KEY,
                vendedor_id INTEGER,
                mes_referencia VARCHAR(7),
                valor_comissao DECIMAL(12,2) DEFAULT 0,
                data_pagamento DATE,
                status VARCHAR(20) DEFAULT 'pendente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS comissoes_vendedores (
                id SERIAL PRIMARY KEY,
                vendedor_id INTEGER,
                cliente_id UUID,
                transaction_id UUID,
                valor_venda DECIMAL(12,2) DEFAULT 0,
                valor_vendedor DECIMAL(12,2) DEFAULT 0,
                mes_referencia VARCHAR(7),
                data_venda DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('[PARTNERS] Executando query SELECT vendedores...');
        const vendedores = await db.query('SELECT * FROM vendedores ORDER BY name');
        console.log(`[PARTNERS] Encontrados ${vendedores.rows.length} vendedores`);
        res.json(vendedores.rows);
    } catch (err) {
        console.error('Erro ao buscar vendedores:', err.message);
        res.status(500).json({ error: 'Erro ao buscar vendedores: ' + err.message });
    }
};

// Criar novo vendedor
exports.createVendedor = async (req, res) => {
    console.log('[CREATE_VENDEDOR] Dados recebidos:', req.body);
    
    const { name, porcentagem, pix, endereco, telefone } = req.body;
    if (!name || !porcentagem) {
        console.log('[CREATE_VENDEDOR] Dados obrigatórios ausentes');
        return res.status(400).json({ error: 'Nome e porcentagem são obrigatórios.' });
    }
    
    try {
        const pct = Math.min(Math.max(parseFloat(porcentagem) || 0, 0), 99.99);
        console.log(`[CREATE_VENDEDOR] Inserindo vendedor: ${name}, porcentagem: ${pct}`);
        
        const result = await db.query(
            'INSERT INTO vendedores (name, porcentagem, profit_share, pix, endereco, telefone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, pct, 0, pix || '', endereco || '', telefone || '']
        );
        
        console.log('[CREATE_VENDEDOR] Vendedor criado com sucesso:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[CREATE_VENDEDOR] Erro ao criar vendedor:', err.message);
        console.error('[CREATE_VENDEDOR] Stack:', err.stack);
        res.status(500).json({ error: 'Erro ao criar vendedor: ' + err.message });
    }
};

// Atualizar vendedor
exports.updateVendedor = async (req, res) => {
    const { id } = req.params;
    const { name, porcentagem, pix, endereco, telefone } = req.body;
    try {
        const pct = Math.min(Math.max(parseFloat(porcentagem) || 0, 0), 99.99);
        const result = await db.query(
            'UPDATE vendedores SET name = $1, porcentagem = $2, profit_share = $3, pix = $4, endereco = $5, telefone = $6 WHERE id = $7 RETURNING *',
            [name, pct, 0, pix || '', endereco || '', telefone || '', id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vendedor não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar vendedor:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar vendedor: ' + err.message });
    }
};

// Excluir vendedor
exports.deleteVendedor = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar se vendedor tem clientes associados
        const clientsResult = await db.query('SELECT COUNT(*) as count FROM clients WHERE vendedor_id = $1', [id]);
        const clientCount = parseInt(clientsResult.rows[0].count);
        
        if (clientCount > 0) {
            return res.status(400).json({ 
                error: `Não é possível excluir este vendedor pois ele possui ${clientCount} cliente(s) associado(s). Remova os clientes primeiro.` 
            });
        }
        
        const result = await db.query('DELETE FROM vendedores WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vendedor não encontrado.' });
        }
        res.json({ msg: 'Vendedor excluído com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao excluir vendedor.' });
    }
};

// Buscar comissões dos vendedores
exports.getComissoes = async (req, res) => {
    const { mes } = req.query;
    const mesRef = mes || new Date().toISOString().slice(0, 7);
    
    console.log(`[COMISSOES] Iniciando busca para mês: ${mesRef}`);
    
    try {
        console.log('[COMISSOES] Criando tabelas se necessário...');
        
        // Buscar pagamentos do mês com vendedor associado
        console.log('[COMISSOES] Executando query principal...');
        
        // Primeiro, vamos verificar se as tabelas existem
        const tablesCheck = await db.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('payments', 'clients', 'vendedores')
        `);
        console.log('[COMISSOES] Tabelas encontradas:', tablesCheck.rows.map(r => r.table_name));
        
        const pagamentosVendedoresResult = await db.query(`
            SELECT 
                v.id as vendedor_id,
                v.name as vendedor_nome,
                v.porcentagem,
                v.pix,
                COALESCE(SUM(p.amount), 0) as total_vendas
            FROM payments p
            JOIN clients c ON p.client_id = c.id
            JOIN vendedores v ON c.vendedor_id = v.id
            WHERE TO_CHAR(p.payment_date, 'YYYY-MM') = $1
            GROUP BY v.id, v.name, v.porcentagem, v.pix
            ORDER BY v.name
        `, [mesRef]);
        
        console.log(`[COMISSOES] Query principal executada. Resultados: ${pagamentosVendedoresResult.rows.length}`);
        
        // Buscar total geral de pagamentos do mês
        console.log('[COMISSOES] Buscando total geral...');
        const totalGeralResult = await db.query(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM payments 
            WHERE TO_CHAR(payment_date, 'YYYY-MM') = $1
        `, [mesRef]);
        
        const totalGeral = parseFloat(totalGeralResult.rows[0]?.total || 0);
        
        console.log(`[COMISSOES] Total geral: ${totalGeral}`);
        
        if (totalGeral === 0) {
            console.log('[COMISSOES] Total geral é 0, retornando array vazio');
            return res.json([]);
        }
        
        const resultados = [];
        let totalComissoesPagas = 0;
        
        // Processar vendedores que fizeram vendas
        for (const vendedor of pagamentosVendedoresResult.rows) {
            const porcentagem = parseFloat(vendedor.porcentagem || 0);
            const totalVendas = parseFloat(vendedor.total_vendas || 0);
            
            if (totalVendas > 0 && porcentagem > 0) {
                const comissaoVendedor = (totalVendas * porcentagem) / 100;
                totalComissoesPagas += comissaoVendedor;
                
                // Verificar status de pagamento
                const statusResult = await db.query(
                    'SELECT status FROM pagamentos_comissoes WHERE vendedor_id = $1 AND mes_referencia = $2',
                    [vendedor.vendedor_id, mesRef]
                );
                
                const status = statusResult.rows[0]?.status || 'pendente';
                
                resultados.push({
                    vendedor_nome: vendedor.vendedor_nome,
                    porcentagem: vendedor.porcentagem,
                    pix: vendedor.pix,
                    total_vendas: totalVendas,
                    total_comissao: comissaoVendedor,
                    vendedor_id: vendedor.vendedor_id,
                    status_pagamento: status
                });
            }
        }
        
        // Resetar todos os status para pendente (debug)
        await db.query('UPDATE pagamentos_comissoes SET status = $1', ['pendente']);
        
        res.json(resultados);
    } catch (err) {
        console.error('Erro ao buscar comissões:', err.message);
        res.status(500).json({ error: 'Erro ao buscar comissões: ' + err.message });
    }
};

// Marcar comissão como paga
exports.marcarComissaoPaga = async (req, res) => {
    const { vendedor_id, mes_referencia, valor_comissao } = req.body;
    
    try {
        // Criar tabela se não existir
        await db.query(`
            CREATE TABLE IF NOT EXISTS pagamentos_comissoes (
                id SERIAL PRIMARY KEY,
                vendedor_id INTEGER,
                mes_referencia VARCHAR(7),
                valor_comissao DECIMAL(12,2),
                data_pagamento DATE,
                status VARCHAR(20) DEFAULT 'pendente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(vendedor_id, mes_referencia)
            )
        `);
        
        const result = await db.query(`
            INSERT INTO pagamentos_comissoes (vendedor_id, mes_referencia, valor_comissao, data_pagamento, status)
            VALUES ($1, $2, $3, CURRENT_DATE, 'pago')
            ON CONFLICT (vendedor_id, mes_referencia) 
            DO UPDATE SET status = 'pago', data_pagamento = CURRENT_DATE, valor_comissao = $3
            RETURNING *
        `, [vendedor_id, mes_referencia, parseFloat(valor_comissao) || 0]);
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao marcar pagamento.' });
    }
};

// Marcar comissão como pendente
exports.marcarComissaoPendente = async (req, res) => {
    const { vendedor_id, mes_referencia } = req.body;
    
    try {
        const result = await db.query(`
            UPDATE pagamentos_comissoes 
            SET status = 'pendente', data_pagamento = NULL
            WHERE vendedor_id = $1 AND mes_referencia = $2
            RETURNING *
        `, [vendedor_id, mes_referencia]);
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao alterar status.' });
    }
};

// Buscar status de pagamentos
exports.getStatusPagamentos = async (req, res) => {
    const { mes } = req.query;
    const mesRef = mes || new Date().toISOString().slice(0, 7);
    
    try {
        // Criar tabela se não existir
        await db.query(`
            CREATE TABLE IF NOT EXISTS pagamentos_comissoes (
                id SERIAL PRIMARY KEY,
                vendedor_id INTEGER,
                mes_referencia VARCHAR(7),
                valor_comissao DECIMAL(12,2),
                data_pagamento DATE,
                status VARCHAR(20) DEFAULT 'pendente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(vendedor_id, mes_referencia)
            )
        `);
        
        const result = await db.query(`
            SELECT vendedor_id, status, data_pagamento, valor_comissao
            FROM pagamentos_comissoes
            WHERE mes_referencia = $1
        `, [mesRef]);
        
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar status.' });
    }
};

// Busca todos os pagamentos com filtro de data
exports.getPayments = async (req, res) => {
    const { startDate, endDate } = req.query;
    
    let queryText = `
        SELECT p.*, c.company_name 
        FROM payments p
        JOIN clients c ON p.client_id = c.id
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (startDate) {
        queryText += ` WHERE p.payment_date >= $${paramIndex++}`;
        queryParams.push(startDate);
    }
    if (endDate) {
        queryText += startDate ? ` AND p.payment_date <= $${paramIndex++}` : ` WHERE p.payment_date <= $${paramIndex++}`;
        queryParams.push(endDate);
    }
    
    queryText += ' ORDER BY p.payment_date DESC';

    try {
        const payments = await db.query(queryText, queryParams);
        res.json(payments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar pagamentos.' });
    }
};

// Adiciona um novo pagamento de cliente
exports.addPayment = async (req, res) => {
    const { clientId, amount, paymentDate, notes } = req.body;
    if (!clientId || !amount || !paymentDate) {
        return res.status(400).json({ error: 'Cliente, valor e data são obrigatórios.' });
    }
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        
        // Adicionar pagamento
        const newPayment = await client.query(
            'INSERT INTO payments (client_id, amount, payment_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [clientId, amount, paymentDate, notes]
        );
        
        // Buscar vendedor do cliente
        const clientResult = await client.query('SELECT vendedor_id FROM clients WHERE id = $1', [clientId]);
        const vendedorId = clientResult.rows[0]?.vendedor_id;
        
        if (vendedorId) {
            // Buscar porcentagem do vendedor
            const vendedorResult = await client.query('SELECT porcentagem FROM vendedores WHERE id = $1', [vendedorId]);
            const porcentagem = parseFloat(vendedorResult.rows[0]?.porcentagem || 0);
            
            const valorComissao = porcentagem > 0 ? (parseFloat(amount) * porcentagem) / 100 : 0;
            const mesReferencia = new Date(paymentDate).toISOString().slice(0, 7);
            
            // Calcular valor do Rodrigo (resto)
            const valorRodrigo = parseFloat(amount) - valorComissao;
            
            // Registrar comissão (sempre registra, mesmo que seja 0)
            await client.query(`
                INSERT INTO comissoes_vendedores (vendedor_id, cliente_id, valor_venda, valor_vendedor, mes_referencia, data_venda)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [vendedorId, clientId, parseFloat(amount), valorComissao, mesReferencia, paymentDate]);
        }
        
        await client.query('COMMIT');
        res.status(201).json(newPayment.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao adicionar pagamento.' });
    } finally {
        client.release();
    }
};

// Edita um pagamento existente
exports.updatePayment = async (req, res) => {
    const { id } = req.params;
    const { amount, paymentDate, notes } = req.body;
    try {
        const result = await db.query(
            'UPDATE payments SET amount = $1, payment_date = $2, notes = $3 WHERE id = $4 RETURNING *',
            [amount, paymentDate, notes, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Pagamento não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao atualizar o pagamento.' });
    }
};

// Exclui um pagamento
exports.deletePayment = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM payments WHERE id = $1', [id]);
        res.json({ msg: 'Pagamento excluído com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao excluir o pagamento.' });
    }
};

// Dashboard financeiro
exports.getDashboardFinanceiro = async (req, res) => {
    try {
        // Valores simples para teste
        const totalCaixa = 0;
        const lucroLiquido = 0;
        const aPagarVendedores = 0;
        const disponivelRetirada = 0;
        
        res.json({
            totalCaixa,
            lucroLiquido,
            aPagarVendedores,
            disponivelRetirada,
            vendedoresComissoes: []
        });
    } catch (err) {
        console.error('Erro no dashboard financeiro:', err.message);
        res.status(500).json({ error: 'Erro ao buscar dados financeiros: ' + err.message });
    }
};



// Reverter pagamento quando retirada é excluída
exports.reverterPagamento = async (req, res) => {
    const { withdrawal_id } = req.body;
    try {
        // Simplesmente retorna sucesso (sem lógica de reversão por enquanto)
        res.json({ success: true, message: 'Reversão não implementada ainda.' });
    } catch (err) {
        console.error('Erro ao reverter pagamento:', err.message);
        res.status(500).json({ error: 'Erro ao reverter pagamento: ' + err.message });
    }
};

// Limpar dados de teste
exports.limparDados = async (req, res) => {
    try {
        const result1 = await db.query('DELETE FROM payments');
        const result2 = await db.query('DELETE FROM withdrawals');
        const result3 = await db.query('DELETE FROM comissoes_vendedores');
        const result4 = await db.query('DELETE FROM pagamentos_comissoes');
        
        console.log('Dados removidos:');
        console.log('- Payments:', result1.rowCount);
        console.log('- Withdrawals:', result2.rowCount);
        console.log('- Comissoes:', result3.rowCount);
        console.log('- Pagamentos comissoes:', result4.rowCount);
        
        res.json({ 
            success: true, 
            message: 'Dados limpos com sucesso!',
            removidos: {
                payments: result1.rowCount,
                withdrawals: result2.rowCount,
                comissoes: result3.rowCount,
                pagamentos_comissoes: result4.rowCount
            }
        });
    } catch (err) {
        console.error('Erro ao limpar dados:', err.message);
        res.status(500).json({ error: 'Erro ao limpar dados: ' + err.message });
    }
};

// Endpoint de teste para verificar estrutura
exports.testeEstrutura = async (req, res) => {
    try {
        // Verificar tabela vendedores
        const vendedores = await db.query('SELECT COUNT(*) as count FROM vendedores');
        
        // Verificar tabela pagamentos_comissoes
        let pagamentos = { count: 0 };
        try {
            const pagamentosResult = await db.query('SELECT COUNT(*) as count FROM pagamentos_comissoes');
            pagamentos = pagamentosResult.rows[0];
        } catch (e) {
            // Tabela não existe, será criada
        }
        
        // Verificar tabela comissoes_vendedores
        let comissoes = { count: 0 };
        try {
            const comissoesResult = await db.query('SELECT COUNT(*) as count FROM comissoes_vendedores');
            comissoes = comissoesResult.rows[0];
        } catch (e) {
            // Tabela não existe, será criada
        }
        
        res.json({
            status: 'OK',
            tabelas: {
                vendedores: vendedores.rows[0].count,
                pagamentos_comissoes: pagamentos.count,
                comissoes_vendedores: comissoes.count
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro no teste:', err.message);
        res.status(500).json({ error: 'Erro no teste: ' + err.message });
    }
};

// Busca todas as retiradas
exports.getWithdrawals = async (req, res) => {
    try {
        const withdrawals = await db.query(`
            SELECT w.*, v.name as partner_name
            FROM withdrawals w
            JOIN vendedores v ON w.partner_id = v.id
            ORDER BY w.withdrawal_date DESC
        `);
        res.json(withdrawals.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar retiradas.' });
    }
};

// Adiciona uma nova retirada de sócio
exports.addWithdrawal = async (req, res) => {
    const { partnerId, amount, withdrawalDate } = req.body;
    if (!partnerId || !amount || !withdrawalDate) {
        return res.status(400).json({ error: 'Sócio, valor e data são obrigatórios.' });
    }
    try {
        const newWithdrawal = await db.query(
            'INSERT INTO withdrawals (partner_id, amount, withdrawal_date) VALUES ($1, $2, $3) RETURNING *',
            [partnerId, amount, withdrawalDate]
        );
        res.status(201).json(newWithdrawal.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao adicionar retirada.' });
    }
};

// --- NOVA FUNÇÃO para editar uma retirada ---
exports.updateWithdrawal = async (req, res) => {
    const { id } = req.params;
    const { amount, withdrawalDate } = req.body;
    try {
        const result = await db.query(
            'UPDATE withdrawals SET amount = $1, withdrawal_date = $2 WHERE id = $3 RETURNING *',
            [amount, withdrawalDate, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Retirada não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao atualizar a retirada.' });
    }
};

// --- NOVA FUNÇÃO para excluir uma retirada ---
exports.deleteWithdrawal = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM withdrawals WHERE id = $1', [id]);
        res.json({ msg: 'Retirada excluída com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao excluir a retirada.' });
    }
};