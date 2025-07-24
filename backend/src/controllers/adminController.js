const db = require('../config/db');
const crypto = require('crypto'); // Módulo nativo do Node.js para gerar tokens seguros

const ensureAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
};

const getAllClients = async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.company_name, c.license_status, c.license_expires_at, 
                   (SELECT u.email FROM users u WHERE u.client_id = c.id LIMIT 1) as email
            FROM clients c
            ORDER BY c.company_name;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao buscar clientes.' });
    }
};

const createClient = async (req, res) => {
    const { companyName, licenseExpiresAt } = req.body;
    if (!companyName || !licenseExpiresAt) {
        return res.status(400).json({ error: 'Nome da empresa e data de vencimento são obrigatórios.' });
    }

    const client = await db.query('BEGIN');
    try {
        const newClientResult = await db.query(
            'INSERT INTO clients (company_name, license_expires_at) VALUES ($1, $2) RETURNING id',
            [companyName, licenseExpiresAt]
        );
        const newClientId = newClientResult.rows[0].id;

        // Gera um token de registo seguro
        const registrationToken = crypto.randomBytes(32).toString('hex');
        // Guarda o hash do token na base de dados por segurança
        const tokenHash = crypto.createHash('sha256').update(registrationToken).digest('hex');
        
        // Define a validade do token (ex: 7 dias)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.query(
            'INSERT INTO registration_tokens (client_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [newClientId, tokenHash, expiresAt]
        );

        await db.query('COMMIT');
        // Retorna o token original (não o hash) para o admin
        res.status(201).json({ 
            msg: 'Cliente criado com sucesso! Envie o token abaixo para o cliente se registar.',
            registrationToken: registrationToken 
        });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao criar cliente.' });
    }
};

const updateClient = async (req, res) => {
    const { id } = req.params;
    const { companyName, licenseStatus, licenseExpiresAt } = req.body;
    try {
        const result = await db.query(
            'UPDATE clients SET company_name = $1, license_status = $2, license_expires_at = $3 WHERE id = $4 RETURNING *',
            [companyName, licenseStatus, licenseExpiresAt, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao atualizar cliente.' });
    }
};

const deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM clients WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.json({ msg: 'Cliente e todos os seus dados foram deletados com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao deletar cliente.' });
    }
};

module.exports = {
    ensureAdmin,
    getAllClients,
    createClient,
    updateClient,
    deleteClient
};