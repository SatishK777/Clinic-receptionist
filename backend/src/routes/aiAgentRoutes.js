import express from 'express';
import { getAIAgent, updateAIAgent } from '../controllers/aiAgentController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { resolveTenant } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(resolveTenant);

router.get('/', getAIAgent);
router.put('/:id', authorize('super-admin', 'hospital-admin'), updateAIAgent);

export default router;
