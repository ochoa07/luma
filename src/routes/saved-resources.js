import { Router } from 'express';
import {
    showSavedResources,
    saveMessage,
    unsaveMessage,
} from '../controllers/saved-resources.js';
import { requireSignIn } from '../middleware/require-sign-in.js';

const router = Router();

router.get('/saved', requireSignIn, showSavedResources);
router.post('/resources/:id/save', requireSignIn, saveMessage);
router.post('/resources/:id/unsave', requireSignIn, unsaveMessage);

export default router;