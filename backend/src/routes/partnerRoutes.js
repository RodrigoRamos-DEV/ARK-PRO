const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../controllers/adminController').ensureAdmin;

router.use(authMiddleware, adminMiddleware);

// Rotas para Sócios
router.get('/', partnerController.getPartners);

// Rotas para Pagamentos
router.get('/payments', partnerController.getPayments);
router.post('/payments', partnerController.addPayment);
router.put('/payments/:id', partnerController.updatePayment);
router.delete('/payments/:id', partnerController.deletePayment);

// Rotas para Retiradas
router.get('/withdrawals', partnerController.getWithdrawals);
router.post('/withdrawals', partnerController.addWithdrawal);
router.put('/withdrawals/:id', partnerController.updateWithdrawal);   // <-- NOVA ROTA DE EDIÇÃO
router.delete('/withdrawals/:id', partnerController.deleteWithdrawal); // <-- NOVA ROTA DE EXCLUSÃO

module.exports = router;