BEGIN;

CREATE TABLE resource_suggestions (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 150),
    message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 1000),
    topic text NOT NULL CHECK (btrim(topic) <> ''),
    resource_type text NOT NULL
        CHECK (resource_type IN ('Scripture', 'Quote', 'Conference talk')),
    status text NOT NULL DEFAULT 'submitted'
        CHECK (status IN (
            'submitted', 'under_review', 'needs_changes',
            'approved', 'rejected', 'published'
        )),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE suggestion_status_history (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    suggestion_id integer NOT NULL
        REFERENCES resource_suggestions(id) ON DELETE CASCADE,
    changed_by integer REFERENCES users(id) ON DELETE SET NULL,
    status text NOT NULL
        CHECK (status IN (
            'submitted', 'under_review', 'needs_changes',
            'approved', 'rejected', 'published'
        )),
    feedback text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;