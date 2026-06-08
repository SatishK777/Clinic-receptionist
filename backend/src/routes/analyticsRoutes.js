import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/auth.js';
import { resolveTenant } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(resolveTenant);

router.get('/dashboard', getDashboardAnalytics);

export default router;
