import { Router } from 'express';
import { createSuggestionsController } from '../controllers/suggestions.js';
import { requireSignIn } from '../middleware/require-sign-in.js';

export default function createSuggestionsRouter(options) {
    const router = Router();
    const { showSuggestions, submitSuggestion } = createSuggestionsController(options);

    router.get('/', requireSignIn, showSuggestions);
    router.post('/', requireSignIn, submitSuggestion);

    return router;
}