import { Router } from 'express';
import {
    showGratitude,
    addEntry,
    editEntry,
    deleteEntry,
} from '../controllers/gratitude.js';
import { requireSignIn } from '../middleware/require-sign-in.js';

const router = Router();

router.get('/', requireSignIn, showGratitude);
router.post('/', requireSignIn, addEntry);
router.post('/:id/edit', requireSignIn, editEntry);
router.post('/:id/delete', requireSignIn, deleteEntry);

export default router;