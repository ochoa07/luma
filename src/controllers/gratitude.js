import {
    listEntries,
    insertEntry,
    updateEntry,
    removeEntry,
} from '../models/gratitude.js';

export async function showGratitude(req, res) {
    const { rows: entries } = await listEntries(req.session.userId);
    const error = req.query.invalid === '1'
        ? 'Write between 1 and 500 characters before saving.'
        : null;

    return res.render('gratitude', { entries, error });
}

export async function addEntry(req, res) {
    const entry = typeof req.body?.entry === 'string'
        ? req.body.entry.trim()
        : '';

    if (!entry || entry.length > 500) {
        return res.redirect(303, '/gratitude?invalid=1');
    }

    await insertEntry(req.session.userId, entry);
    return res.redirect(303, '/gratitude');
}

export async function editEntry(req, res) {
    const id = Number(req.params.id);
    const entry = typeof req.body?.entry === 'string'
        ? req.body.entry.trim()
        : '';

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Entry not found.');
    }

    if (!entry || entry.length > 500) {
        return res.redirect(303, '/gratitude?invalid=1');
    }

    const result = await updateEntry(id, req.session.userId, entry);

    if (result.rowCount === 0) {
        return res.status(404).send('Entry not found.');
    }

    return res.redirect(303, '/gratitude');
}

export async function deleteEntry(req, res) {
    const id = Number(req.params.id);

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Entry not found.');
    }

    const result = await removeEntry(id, req.session.userId);

    if (result.rowCount === 0) {
        return res.status(404).send('Entry not found.');
    }

    return res.redirect(303, '/gratitude');
}