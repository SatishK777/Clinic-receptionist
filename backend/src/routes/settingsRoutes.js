import express from 'express';
import {
  getSettings,
  updateSettings,
  updateHospitalProfile,
} from '../controllers/settingsController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { resolveTenant } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(resolveTenant);

router.get('/', getSettings);
router.put('/', authorize('super-admin', 'hospital-admin'), updateSettings);
router.put('/hospital', authorize('super-admin', 'hospital-admin'), updateHospitalProfile);

export default router;
