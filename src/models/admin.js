import { pool } from '../db.js';

export async function getDashboardCounts() {
    const { rows } = await pool.query(
        `SELECT
            (SELECT COUNT(*)::integer FROM users) AS users,
            (SELECT COUNT(*)::integer FROM resources) AS resources,
            (SELECT COUNT(*)::integer FROM resource_suggestions) AS suggestions`
    );

    return rows[0];
}