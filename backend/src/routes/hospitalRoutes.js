import express from 'express';
import { getHospitals } from '../controllers/hospitalController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super-admin'));

router.get('/', getHospitals);

export default router;

