import { Router } from 'express';
import { createCheckInController } from '../controllers/check-in.js';
import { requireSignIn } from '../middleware/require-sign-in.js';

export default function createCheckInRouter(options) {
    const router = Router();
    const {
        showCheckIn,
        submitCheckIn,
        showComfort,
        submitComfort,
    } = createCheckInController(options);

    router.use(requireSignIn);

    router.get('/', showCheckIn);
    router.post('/', submitCheckIn);
    router.get('/comfort', showComfort);
    router.post('/comfort', submitComfort);

    return router;
}