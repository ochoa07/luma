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