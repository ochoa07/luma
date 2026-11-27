import { findUserRoleById } from '../models/users.js';

export async function requireAdmin(req, res, next) {
    const role = await findUserRoleById(req.session.userId);

    if (role !== 'admin') {
        return res.status(403).render('error', {
            message: 'You don’t have access to the admin dashboard.',
        });
    }

    return next();
}