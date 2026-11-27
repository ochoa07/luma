import { pool } from '../db.js';

export async function createUser({ firstName, email, passwordHash }) {
    const { rowCount } = await pool.query(
        `INSERT INTO users (first_name, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        [firstName, email, passwordHash]
    );

    return rowCount > 0;
}

export async function findUserByEmail(email) {
    const { rows } = await pool.query(
        `SELECT id, first_name, password_hash
         FROM users
         WHERE email = $1`,
        [email]
    );

    return rows[0] ?? null;
}

export async function findUserRoleById(userId) {
    const { rows } = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
    );

    return rows[0]?.role ?? null;
}