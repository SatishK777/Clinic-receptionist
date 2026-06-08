import express from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { resolveTenant } from '../middlewares/tenant.js';

const router = express.Router();

// Apply auth protection & tenant resolver globally for appointment routes
router.use(protect);
router.use(resolveTenant);

router.get('/', getAppointments);
router.post('/', authorize('super-admin', 'hospital-admin', 'receptionist'), createAppointment);
router.put('/:id', authorize('super-admin', 'hospital-admin', 'receptionist'), updateAppointment);
router.delete('/:id', authorize('super-admin', 'hospital-admin', 'receptionist'), deleteAppointment);

export default router;
