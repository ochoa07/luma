CREATE TABLE resources (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    topic text NOT NULL,
    resource_type text NOT NULL
        CHECK (resource_type IN ('Scripture', 'Quote', 'Conference talk')),
    is_published boolean NOT NULL DEFAULT false
);

INSERT INTO resources (title, message, topic, resource_type, is_published)
VALUES
    ('John 14:27',
     'Read this verse and reflect on the kind of peace Jesus offers.',
     'Peace', 'Scripture', true),
    ('One small step',
     'You don’t have to figure everything out today. Start with one thing you can do.',
     'Just something encouraging', 'Quote', true);