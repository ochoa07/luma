CREATE TABLE saved_resources (
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id integer NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    saved_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, resource_id)
);