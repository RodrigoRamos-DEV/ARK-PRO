const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Protege todas as rotas de admin
router.use(authMiddleware, adminController.ensureAdmin);

// Rota para LER todos os clientes
router.get('/clients', adminController.getAllClients);

// Rota para CRIAR um novo cliente
router.post('/clients', adminController.createClient);

// Rota para ATUALIZAR um cliente
router.put('/clients/:id', adminController.updateClient);

// Rota para DELETAR um cliente
router.delete('/clients/:id', adminController.deleteClient);

module.exports = router;