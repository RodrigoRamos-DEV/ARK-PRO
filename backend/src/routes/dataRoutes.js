const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// --- NOVAS ROTAS PARA O PERFIL ---
router.get('/profile', dataController.getProfile);
router.put('/profile', dataController.updateProfile);

// Rotas de Funcionários
router.get('/employees', dataController.getEmployees);
router.post('/employees', dataController.addEmployee);

// Rotas para Itens de Cadastro
router.get('/items', dataController.getAllItems);
router.post('/items', dataController.addItem);
router.put('/items/:id', dataController.updateItem);
router.delete('/items/:id', dataController.deleteItem);

// Rotas de Transações
router.get('/transactions', dataController.getTransactions);
router.post('/transactions', dataController.addTransaction);
router.put('/transactions/:id', dataController.updateTransaction);
router.delete('/transactions/:id', dataController.deleteTransaction);
router.post('/transactions/batch-delete', dataController.batchDeleteTransactions);

// Rota para Upload de Anexos
router.post('/transactions/:transactionId/attach', dataController.addAttachment);

// Rota para Exclusão de Anexos
router.delete('/attachments/:attachmentId', dataController.deleteAttachment);

// Rota para o Relatório
router.post('/generate-report', dataController.generateReport);

module.exports = router;