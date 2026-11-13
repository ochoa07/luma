import {
    listSuggestionsForReview,
    startSuggestionReview,
    recordSuggestionDecision,
} from '../models/suggestions.js';

export async function showReviewQueue(req, res) {
    const suggestions = await listSuggestionsForReview();
    return res.render('review-suggestions', { suggestions });
}

export async function startReview(req, res) {
    const id = Number(req.params.id);

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Suggestion not found.');
    }

    const started = await startSuggestionReview(id, req.session.userId);

    if (!started) {
        return res.status(409).send('This suggestion is no longer available to start reviewing.');
    }

    return res.redirect(303, '/review/suggestions');
}

export async function submitDecision(req, res) {
    const id = Number(req.params.id);
    const { decision, feedback } = req.body ?? {};
    const note = typeof feedback === 'string' ? feedback.trim() : '';

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Suggestion not found.');
    }

    if (decision !== 'approved' && decision !== 'needs_changes') {
        return res.status(400).send('Choose a review decision.');
    }

    if (note.length > 500 || (decision === 'needs_changes' && !note)) {
        return res.status(400).send(
            'Keep feedback to 500 characters or fewer. Add a note if you’re asking for changes.'
        );
    }

    const saved = await recordSuggestionDecision(
        id,
        req.session.userId,
        decision,
        note || null
    );

    if (!saved) {
        return res.status(409).send('This suggestion is no longer under review.');
    }

    return res.redirect(303, '/review/suggestions');
}