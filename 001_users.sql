CREATE TABLE users (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name varchar(80) NOT NULL CHECK (btrim(first_name) <> ''),
    email varchar(254) NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'member'
        CHECK (role IN ('member', 'contributor', 'admin')),
    created_at timestamptz NOT NULL DEFAULT now()
);