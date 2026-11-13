import {
    listSavedResources,
    saveResource,
    unsaveResource,
} from '../models/resources.js';

export async function showSavedResources(req, res) {
    const resources = await listSavedResources(req.session.userId);
    return res.render('saved', { resources });
}

export async function saveMessage(req, res) {
    const id = Number(req.params.id);

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Message not found.');
    }

    await saveResource(req.session.userId, id);
    return res.redirect(303, '/saved');
}

export async function unsaveMessage(req, res) {
    const id = Number(req.params.id);

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Message not found.');
    }

    await unsaveResource(req.session.userId, id);
    return res.redirect(303, '/saved');
}