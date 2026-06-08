import express from 'express';
import {
  getPhoneNumbers,
  assignPhoneNumber,
  updatePhoneNumber,
  deletePhoneNumber,
} from '../controllers/phoneNumberController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { resolveTenant } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(resolveTenant);

router.get('/', getPhoneNumbers);
router.post('/assign', authorize('super-admin', 'hospital-admin'), assignPhoneNumber);
router.put('/:id', authorize('super-admin', 'hospital-admin'), updatePhoneNumber);
router.delete('/:id', authorize('super-admin', 'hospital-admin'), deletePhoneNumber);

export default router;
