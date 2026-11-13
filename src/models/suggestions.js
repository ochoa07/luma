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

export async function createSuggestion(
    userId,
    { title, message, topic, resourceType }
) {
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

export async function listSuggestionsForReview() {
    const { rows } = await pool.query(
        `SELECT id, title, message, topic, resource_type, status
         FROM resource_suggestions
         WHERE status IN ('submitted', 'under_review')
         ORDER BY created_at, id`
    );

    return rows;
}

export async function startSuggestionReview(suggestionId, reviewerId) {
    const { rowCount } = await pool.query(
        `WITH updated_suggestion AS (
            UPDATE resource_suggestions
            SET status = 'under_review'
            WHERE id = $1 AND status = 'submitted'
            RETURNING id, status
         )
         INSERT INTO suggestion_status_history
             (suggestion_id, changed_by, status)
         SELECT id, $2, status FROM updated_suggestion`,
        [suggestionId, reviewerId]
    );

    return rowCount > 0;
}

export async function recordSuggestionDecision(
    suggestionId,
    reviewerId,
    decision,
    feedback
) {
    const { rowCount } = await pool.query(
        `WITH updated_suggestion AS (
            UPDATE resource_suggestions
            SET status = $2
            WHERE id = $1 AND status = 'under_review'
            RETURNING id, status
         )
         INSERT INTO suggestion_status_history
             (suggestion_id, changed_by, status, feedback)
         SELECT id, $3, status, $4 FROM updated_suggestion`,
        [suggestionId, decision, reviewerId, feedback]
    );

    return rowCount > 0;
}