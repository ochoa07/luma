import { Router } from 'express';
import { showAdminDashboard } from '../controllers/admin.js';
import { requireSignIn } from '../middleware/require-sign-in.js';
import { requireAdmin } from '../middleware/require-admin.js';

const router = Router();

router.use(requireSignIn, requireAdmin);

router.get('/', showAdminDashboard);

export default router;