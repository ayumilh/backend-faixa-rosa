import express from 'express';
import {
  createPayment,
  listPaymentsByUser,
  updatePaymentStatus,
  receiveWebhook,
  getPaymentStatus,
  getSavedCards,
} from '../../controllers/companion/paymentCompanionController.js';

const router = express.Router();

router.post('/checkout', createPayment); // Criar pagamento
router.post('/webhook', receiveWebhook); // Webhook para atualizações
router.get('/checkout/status/:transactionId', getPaymentStatus);
router.get('/cards', getSavedCards);

router.get('/pagamento/:userId', listPaymentsByUser);
router.patch('/pagamento/:id/status', updatePaymentStatus);

export default router;
