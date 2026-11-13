import {
    listSuggestionsByUser,
    createSuggestion,
} from '../models/suggestions.js';

export function createSuggestionsController({ topics, types }) {
    async function showSuggestions(req, res) {
        const suggestions = await listSuggestionsByUser(req.session.userId);

        return res.render('suggestions', {
            suggestions,
            topics,
            types,
            invalid: req.query.invalid === '1',
        });
    }

    async function submitSuggestion(req, res) {
        const { title, message, topic, resourceType } = req.body ?? {};
        const cleanTitle = typeof title === 'string' ? title.trim() : '';
        const cleanMessage = typeof message === 'string' ? message.trim() : '';

        if (
            !cleanTitle || cleanTitle.length > 150 ||
            !cleanMessage || cleanMessage.length > 1000 ||
            !topics.includes(topic) || !types.includes(resourceType)
        ) {
            return res.redirect(303, '/suggestions?invalid=1');
        }

        await createSuggestion(req.session.userId, {
            title: cleanTitle,
            message: cleanMessage,
            topic,
            resourceType,
        });

        return res.redirect(303, '/suggestions');
    }

    return { showSuggestions, submitSuggestion };
}