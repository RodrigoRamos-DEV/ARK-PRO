const db = require('../config/db');

// Busca todos os sócios
exports.getPartners = async (req, res) => {
    try {
        const partners = await db.query('SELECT * FROM partners ORDER BY name');
        res.json(partners.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar sócios.' });
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
    try {
        const newPayment = await db.query(
            'INSERT INTO payments (client_id, amount, payment_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [clientId, amount, paymentDate, notes]
        );
        res.status(201).json(newPayment.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao adicionar pagamento.' });
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

// Busca todas as retiradas
exports.getWithdrawals = async (req, res) => {
    try {
        const withdrawals = await db.query(`
            SELECT w.*, p.name as partner_name
            FROM withdrawals w
            JOIN partners p ON w.partner_id = p.id
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