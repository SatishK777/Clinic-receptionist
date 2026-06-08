import express from 'express';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { resolveTenant } from '../middlewares/tenant.js';

const router = express.Router();

// Apply auth protection & tenant resolver globally for doctor routes
router.use(protect);
router.use(resolveTenant);

router.get('/', getDoctors);
router.post('/', authorize('super-admin', 'hospital-admin'), createDoctor);
router.put('/:id', authorize('super-admin', 'hospital-admin'), updateDoctor);
router.delete('/:id', authorize('super-admin', 'hospital-admin'), deleteDoctor);

export default router;
