import express from 'express';
import { getCalls, getCall, handleVapiWebhook } from '../controllers/callController.js';
import { protect } from '../middlewares/auth.js';
import { resolveTenant } from '../middlewares/tenant.js';

const router = express.Router();

// PUBLIC Webhook Endpoint (No protect/resolveTenant here, Vapi calls this externally)
router.post('/webhook', handleVapiWebhook);

// PROTECTED Dashboard Endpoints (Requires User Session Auth)
router.get('/', protect, resolveTenant, getCalls);
router.get('/:id', protect, resolveTenant, getCall);

export default router;
