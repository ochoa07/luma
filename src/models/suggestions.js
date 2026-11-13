import { pool } from '../db.js';

export async function listSuggestionsByUser(userId) {
    const { rows } = await pool.query(
        `SELECT s.title, s.status,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'status', h.status,
                            'feedback', h.feedback,
                            'createdAt', h.created_at
                        )
                        ORDER BY h.created_at, h.id
                    )
                    FROM suggestion_status_history AS h
                    WHERE h.suggestion_id = s.id
                ),
                '[]'::json
            ) AS history
         FROM resource_suggestions AS s
         WHERE s.user_id = $1
         ORDER BY s.created_at DESC, s.id DESC`,
        [userId]
    );

    return rows;
}

export async function createSuggestion(userId, { title, message, topic, resourceType }) {
    await pool.query(
        `WITH new_suggestion AS (
            INSERT INTO resource_suggestions
                (user_id, title, message, topic, resource_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, status
         )
         INSERT INTO suggestion_status_history
             (suggestion_id, changed_by, status)
         SELECT id, user_id, status FROM new_suggestion`,
        [userId, title, message, topic, resourceType]
    );
}