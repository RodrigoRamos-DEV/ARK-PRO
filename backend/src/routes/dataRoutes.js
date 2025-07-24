const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

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

// NOVA ROTA PARA O RELATÓRIO
router.post('/generate-report', dataController.generateReport);

module.exports = router;