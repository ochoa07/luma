CREATE TABLE gratitude_entries (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_text text NOT NULL
        CHECK (char_length(btrim(entry_text)) BETWEEN 1 AND 500),
    created_at timestamptz NOT NULL DEFAULT now()
);