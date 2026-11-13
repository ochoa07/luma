import { findComfortResource } from '../models/resources.js';

const feelings = ['Stressed', 'Sad', 'Lonely', 'Hopeful', 'Grateful', 'Not sure'];

export function createCheckInController({ topics, types }) {
    function showCheckIn(req, res) {
        return res.render('check-in', { feelings, error: null });
    }

    function submitCheckIn(req, res, next) {
        if (req.body?.action === 'skip') {
            delete req.session.checkInDraft;
        } else {
            const reflection = req.body?.reflection;
            const submitted = req.body?.feelings ?? [];
            const selected = Array.isArray(submitted) ? submitted : [submitted];

            if (
                typeof reflection !== 'string' ||
                reflection.length > 500 ||
                selected.some((feeling) => !feelings.includes(feeling))
            ) {
                return res.status(400).render('check-in', {
                    feelings,
                    error: 'Keep your note to 500 characters or fewer and choose from the feelings shown.',
                });
            }

            req.session.checkInDraft = {
                reflection: reflection.trim(),
                feelings: [...new Set(selected)],
            };
        }

        req.session.save((error) => {
            if (error) return next(error);
            return res.redirect(303, '/check-in/comfort');
        });
    }

    function showComfort(req, res) {
        return res.render('check-in-comfort', { resource: null, error: null });
    }

    async function submitComfort(req, res) {
        const { topic, resourceType } = req.body ?? {};

        if (!topics.includes(topic) || !types.includes(resourceType)) {
            return res.status(400).render('check-in-comfort', {
                resource: null,
                error: 'Choose what would help and what kind of message you’d like.',
            });
        }

        const resource = await findComfortResource(topic, resourceType);

        return res.render('check-in-comfort', {
            resource,
            error: resource ? null : 'There’s no message available yet.',
        });
    }

    return { showCheckIn, submitCheckIn, showComfort, submitComfort };
}