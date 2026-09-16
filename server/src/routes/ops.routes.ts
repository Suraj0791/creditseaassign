import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { UserRole } from '../models/User';
import {
  getSalesLeads,
  getSanctionQueue,
  approveLoan,
  rejectLoan,
  getDisbursementQueue,
  disburseLoan,
  getCollectionQueue,
  recordPayment,
  getPayments,
} from '../controllers/ops.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/sales',
  authorize(UserRole.ADMIN, UserRole.SALES),
  getSalesLeads
);

router.get(
  '/sanction',
  authorize(UserRole.ADMIN, UserRole.SANCTION),
  getSanctionQueue
);

router.patch(
  '/sanction/:id/approve',
  authorize(UserRole.ADMIN, UserRole.SANCTION),
  approveLoan
);

router.patch(
  '/sanction/:id/reject',
  authorize(UserRole.ADMIN, UserRole.SANCTION),
  rejectLoan
);

router.get(
  '/disbursement',
  authorize(UserRole.ADMIN, UserRole.DISBURSEMENT),
  getDisbursementQueue
);

router.patch(
  '/disbursement/:id/disburse',
  authorize(UserRole.ADMIN, UserRole.DISBURSEMENT),
  disburseLoan
);

router.get(
  '/collection',
  authorize(UserRole.ADMIN, UserRole.COLLECTION),
  getCollectionQueue
);

router.post(
  '/collection/:id/payment',
  authorize(UserRole.ADMIN, UserRole.COLLECTION),
  recordPayment
);

router.get(
  '/collection/:id/payments',
  authorize(UserRole.ADMIN, UserRole.COLLECTION),
  getPayments
);

export default router;
