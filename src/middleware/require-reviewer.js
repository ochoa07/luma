import { pool } from '../db.js';

export async function requireReviewer(req, res, next) {
    const { rows } = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [req.session.userId]
    );

    const role = rows[0]?.role;

    if (role !== 'contributor' && role !== 'admin') {
        return res.status(403).send('You don’t have access to the review queue.');
    }

    return next();
}