import { Router } from 'express';
import {
    showReviewQueue,
    startReview,
    submitDecision,
} from '../controllers/review-suggestions.js';
import { requireSignIn } from '../middleware/require-sign-in.js';
import { requireReviewer } from '../middleware/require-reviewer.js';

const router = Router();

router.use(requireSignIn, requireReviewer);

router.get('/', showReviewQueue);
router.post('/:id/start', startReview);
router.post('/:id/decision', submitDecision);

export default router;