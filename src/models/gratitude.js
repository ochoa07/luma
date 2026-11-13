import { pool } from '../db.js';

export function listEntries(userId) {
    return pool.query(
        `SELECT id, entry_text, created_at
         FROM gratitude_entries
         WHERE user_id = $1
         ORDER BY created_at DESC, id DESC`,
        [userId]
    );
}

export function insertEntry(userId, entry) {
    return pool.query(
        `INSERT INTO gratitude_entries (user_id, entry_text)
         VALUES ($1, $2)`,
        [userId, entry]
    );
}

export function updateEntry(id, userId, entry) {
    return pool.query(
        `UPDATE gratitude_entries
         SET entry_text = $1
         WHERE id = $2 AND user_id = $3`,
        [entry, id, userId]
    );
}

export function removeEntry(id, userId) {
    return pool.query(
        `DELETE FROM gratitude_entries
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
}