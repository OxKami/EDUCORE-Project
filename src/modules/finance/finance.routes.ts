import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();
const financeController = new FinanceController();

// All routes require authentication
router.use(authenticate);

// List transactions
router.get(
  '/transactions',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.listTransactions(req, res)
);

// Get transaction by ID
router.get(
  '/transactions/:id',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.getTransactionById(req, res)
);

// Create transaction
router.post(
  '/transactions',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.createTransaction(req, res)
);

// Update transaction
router.put(
  '/transactions/:id',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.updateTransaction(req, res)
);

// Delete transaction
router.delete(
  '/transactions/:id',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.deleteTransaction(req, res)
);

// Generate invoices (bulk)
router.post(
  '/invoices/generate',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.generateInvoices(req, res)
);

// Financial summary/dashboard
router.get(
  '/summary',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.getFinancialSummary(req, res)
);

// Student payment history
router.get(
  '/students/:studentId/payments',
  authorize('ADMIN', 'ACCOUNTANT', 'STUDENT', 'PARENT'),
  (req, res) => financeController.getStudentPaymentHistory(req, res)
);

// Outstanding fees
router.get(
  '/outstanding',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => financeController.getOutstandingFees(req, res)
);

export default router;