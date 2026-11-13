import { pool } from '../db.js';

export async function findComfortResource(topic, resourceType) {
    const { rows } = await pool.query(
        `SELECT id, title, message, resource_type, topic
         FROM resources
         WHERE is_published = true
           AND (topic = $1 OR topic = 'Just something encouraging')
         ORDER BY
            CASE
                WHEN topic = $1 AND ($2 = 'Anything' OR resource_type = $2) THEN 0
                WHEN topic = $1 THEN 1
                ELSE 2
            END,
            id
         LIMIT 1`,
        [topic, resourceType]
    );

    return rows[0] ?? null;
}

export async function saveResource(userId, resourceId) {
    await pool.query(
        `INSERT INTO saved_resources (user_id, resource_id)
         SELECT $1, id
         FROM resources
         WHERE id = $2 AND is_published = true
         ON CONFLICT (user_id, resource_id) DO NOTHING`,
        [userId, resourceId]
    );
}

export async function listSavedResources(userId) {
    const { rows } = await pool.query(
        `SELECT r.id, r.title, r.message, r.resource_type
         FROM saved_resources AS s
         JOIN resources AS r ON r.id = s.resource_id
         WHERE s.user_id = $1 AND r.is_published = true
         ORDER BY s.saved_at DESC, s.resource_id DESC`,
        [userId]
    );

    return rows;
}

export async function unsaveResource(userId, resourceId) {
    await pool.query(
        `DELETE FROM saved_resources
         WHERE user_id = $1 AND resource_id = $2`,
        [userId, resourceId]
    );
}