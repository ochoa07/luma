import express from 'express';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { pool } from './db.js';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const PgSessionStore = connectPgSimple(session);

if (!sessionSecret) {
    throw new Error('SESSION_SECRET is missing.');
}

app.set('view engine', 'ejs');
app.set('views', fileURLToPath(new URL('./views/', import.meta.url)));

if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    store: new PgSessionStore({
        pool,
        createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
    },
}));

app.get('/', (req, res) => {
    res.render('home', {
        firstName: req.session.firstName ?? null,
    });
});

app.get('/signup', (req, res) => {
    res.render('signup', {
        error: null,
        accountCreated: req.query.created === '1',
    });
});

app.post('/signup', async (req, res, next) => {
    const firstName = String(req.body?.firstName ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (
        !firstName || firstName.length > 80 ||
        email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        password.length < 8 || Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).render('signup', {
            error: 'Enter your first name, a valid email, and a password between 8 characters and 72 bytes.',
            accountCreated: false,
        });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (first_name, email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO NOTHING`,
            [firstName, email, passwordHash]
        );

        if (result.rowCount === 0) {
            return res.status(409).render('signup', {
                error: 'An account already exists with that email.',
                accountCreated: false,
            });
        }

        return res.redirect(303, '/signup?created=1');
    } catch (error) {
        return next(error);
    }
});

app.get('/signin', (req, res) => {
    res.render('signin', { error: null });
});

app.post('/signin', async (req, res, next) => {
    const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
    const password = typeof req.body?.password === 'string'
        ? req.body.password
        : '';

    if (
        !email || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !password || Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).render('signin', {
            error: 'Enter a valid email and password.',
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, first_name, password_hash
             FROM users
             WHERE email = $1`,
            [email]
        );
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).render('signin', {
                error: 'The email or password is incorrect.',
            });
        }

        req.session.regenerate((error) => {
            if (error) return next(error);

            req.session.userId = user.id;
            req.session.firstName = user.first_name;

            req.session.save((error) => {
                if (error) return next(error);
                return res.redirect(303, '/');
            });
        });
    } catch (error) {
        return next(error);
    }
});

app.post('/signout', (req, res, next) => {
    req.session.destroy((error) => {
        if (error) return next(error);

        res.clearCookie('connect.sid', { path: '/' });
        return res.redirect(303, '/');
    });
});

function requireSignIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/signin');
    }

    return next();
}

const feelings = ['Stressed', 'Sad', 'Lonely', 'Hopeful', 'Grateful', 'Not sure'];

app.get('/check-in', requireSignIn, (req, res) => {
    res.render('check-in', { feelings, error: null });
});

app.post('/check-in', requireSignIn, (req, res, next) => {
    if (req.body?.action === 'skip') {
        delete req.session.checkInDraft;
    } else {
        const reflection = req.body?.reflection;
        const submitted = req.body?.feelings ?? [];
        const selected = Array.isArray(submitted) ? submitted : [submitted];

        if (
            typeof reflection !== 'string' ||
            reflection.length > 500 ||
            selected.some((feeling) => !feelings.includes(feeling))
        ) {
            return res.status(400).render('check-in', {
                feelings,
                error: 'Keep your note under 500 characters and choose from the feelings shown.',
            });
        }

        req.session.checkInDraft = {
            reflection: reflection.trim(),
            feelings: [...new Set(selected)],
        };
    }

    req.session.save((error) => {
        if (error) return next(error);
        return res.redirect(303, '/check-in/comfort');
    });
});

const comfortTopics = [
    'Peace', 'Hope', 'Strength', 'Feeling loved', 'Direction',
    'Just something encouraging',
];

const resourceTypes = ['Anything', 'Scripture', 'Quote', 'Conference talk'];

app.get('/check-in/comfort', requireSignIn, (req, res) => {
    res.render('check-in-comfort', { resource: null, error: null });
});

app.post('/check-in/comfort', requireSignIn, async (req, res, next) => {
    const { topic, resourceType } = req.body ?? {};

    if (!comfortTopics.includes(topic) || !resourceTypes.includes(resourceType)) {
        return res.status(400).render('check-in-comfort', {
            resource: null,
            error: 'Choose what would help and what kind of message you’d like.',
        });
    }

    try {
        const result = await pool.query(
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

        return res.render('check-in-comfort', {
            resource: result.rows[0] ?? null,
            error: result.rows.length ? null : 'There’s no message available yet.',
        });
    } catch (error) {
        return next(error);
    }
});

app.get('/gratitude', requireSignIn, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, entry_text, created_at
             FROM gratitude_entries
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC`,
            [req.session.userId]
        );

        const error = req.query.invalid === '1'
            ? 'Write between 1 and 500 characters before saving.'
            : null;

        return res.render('gratitude', { entries: result.rows, error });
    } catch (error) {
        return next(error);
    }
});

app.post('/gratitude', requireSignIn, async (req, res, next) => {
    const entry = typeof req.body?.entry === 'string'
        ? req.body.entry.trim()
        : '';

    if (!entry || entry.length > 500) {
        return res.redirect(303, '/gratitude?invalid=1');
    }

    try {
        await pool.query(
            `INSERT INTO gratitude_entries (user_id, entry_text)
             VALUES ($1, $2)`,
            [req.session.userId, entry]
        );

        return res.redirect(303, '/gratitude');
    } catch (error) {
        return next(error);
    }
});

app.post('/gratitude/:id/edit', requireSignIn, async (req, res, next) => {
    const id = Number(req.params.id);
    const entry = typeof req.body?.entry === 'string'
        ? req.body.entry.trim()
        : '';

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Entry not found.');
    }

    if (!entry || entry.length > 500) {
        return res.redirect(303, '/gratitude?invalid=1');
    }

    try {
        const result = await pool.query(
            `UPDATE gratitude_entries
             SET entry_text = $1
             WHERE id = $2 AND user_id = $3`,
            [entry, id, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Entry not found.');
        }

        return res.redirect(303, '/gratitude');
    } catch (error) {
        return next(error);
    }
});

app.post('/gratitude/:id/delete', requireSignIn, async (req, res, next) => {
    const id = Number(req.params.id);

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Entry not found.');
    }

    try {
        const result = await pool.query(
            `DELETE FROM gratitude_entries
             WHERE id = $1 AND user_id = $2`,
            [id, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Entry not found.');
        }

        return res.redirect(303, '/gratitude');
    } catch (error) {
        return next(error);
    }
});

app.post('/resources/:id/save', requireSignIn, async (req, res, next) => {
    const id = Number(req.params.id);

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Message not found.');
    }

    try {
        await pool.query(
            `INSERT INTO saved_resources (user_id, resource_id)
             SELECT $1, id
             FROM resources
             WHERE id = $2 AND is_published = true
             ON CONFLICT (user_id, resource_id) DO NOTHING`,
            [req.session.userId, id]
        );

        return res.redirect(303, '/saved');
    } catch (error) {
        return next(error);
    }
});

app.get('/saved', requireSignIn, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.title, r.message, r.resource_type
             FROM saved_resources AS s
             JOIN resources AS r ON r.id = s.resource_id
             WHERE s.user_id = $1 AND r.is_published = true
             ORDER BY s.saved_at DESC, s.resource_id DESC`,
            [req.session.userId]
        );

        return res.render('saved', { resources: result.rows });
    } catch (error) {
        return next(error);
    }
});

app.post('/resources/:id/unsave', requireSignIn, async (req, res, next) => {
    const id = Number(req.params.id);

    if (!/^[1-9][0-9]*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Message not found.');
    }

    try {
        await pool.query(
            'DELETE FROM saved_resources WHERE user_id = $1 AND resource_id = $2',
            [req.session.userId, id]
        );

        return res.redirect(303, '/saved');
    } catch (error) {
        return next(error);
    }
});

app.get('/suggestions', requireSignIn, async (req, res, next) => {
    try {
        const result = await pool.query(
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
            [req.session.userId]
        );

        return res.render('suggestions', {
            suggestions: result.rows,
            topics: comfortTopics,
            types: resourceTypes.filter((type) => type !== 'Anything'),
            invalid: req.query.invalid === '1',
        });
    } catch (error) {
        return next(error);
    }
});

app.post('/suggestions', requireSignIn, async (req, res, next) => {
    const { title, message, topic, resourceType } = req.body ?? {};
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (
        !cleanTitle || cleanTitle.length > 150 ||
        !cleanMessage || cleanMessage.length > 1000 ||
        !comfortTopics.includes(topic) ||
        !resourceTypes.includes(resourceType) || resourceType === 'Anything'
    ) {
        return res.redirect(303, '/suggestions?invalid=1');
    }

    try {
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
            [req.session.userId, cleanTitle, cleanMessage, topic, resourceType]
        );

        return res.redirect(303, '/suggestions');
    } catch (error) {
        return next(error);
    }
});

async function requireReviewer(req, res, next) {
    try {
        const result = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [req.session.userId]
        );
        const role = result.rows[0]?.role;

        if (role !== 'contributor' && role !== 'admin') {
            return res.status(403).send('You don’t have access to the review queue.');
        }

        return next();
    } catch (error) {
        return next(error);
    }
}

app.get('/review/suggestions', requireSignIn, requireReviewer, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, title, message, topic, resource_type, status
             FROM resource_suggestions
             WHERE status IN ('submitted', 'under_review')
             ORDER BY created_at, id`
        );

        return res.render('review-suggestions', { suggestions: result.rows });
    } catch (error) {
        return next(error);
    }
});

app.post('/review/suggestions/:id/start', requireSignIn, requireReviewer, async (req, res, next) => {
    const id = Number(req.params.id);

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Suggestion not found.');
    }

    try {
        const result = await pool.query(
            `WITH updated_suggestion AS (
                UPDATE resource_suggestions
                SET status = 'under_review'
                WHERE id = $1 AND status = 'submitted'
                RETURNING id, status
             )
             INSERT INTO suggestion_status_history
                 (suggestion_id, changed_by, status)
             SELECT id, $2, status FROM updated_suggestion`,
            [id, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(409).send('This suggestion is no longer available to start reviewing.');
        }

        return res.redirect(303, '/review/suggestions');
    } catch (error) {
        return next(error);
    }
});

app.post('/review/suggestions/:id/decision', requireSignIn, requireReviewer, async (req, res, next) => {
    const id = Number(req.params.id);
    const { decision, feedback } = req.body ?? {};
    const note = typeof feedback === 'string' ? feedback.trim() : '';

    if (!/^[1-9]\d*$/.test(req.params.id) || id > 2147483647) {
        return res.status(404).send('Suggestion not found.');
    }

    if (decision !== 'approved' && decision !== 'needs_changes') {
        return res.status(400).send('Choose a review decision.');
    }

    if (note.length > 500 || (decision === 'needs_changes' && !note)) {
        return res.status(400).send(
            'Keep feedback to 500 characters or fewer. Add a note if you’re asking for changes.'
        );
    }

    try {
        const result = await pool.query(
            `WITH updated_suggestion AS (
                UPDATE resource_suggestions
                SET status = $2
                WHERE id = $1 AND status = 'under_review'
                RETURNING id, status
             )
             INSERT INTO suggestion_status_history
                 (suggestion_id, changed_by, status, feedback)
             SELECT id, $3, status, $4 FROM updated_suggestion`,
            [id, decision, req.session.userId, note || null]
        );

        if (result.rowCount === 0) {
            return res.status(409).send('This suggestion is no longer under review.');
        }

        return res.redirect(303, '/review/suggestions');
    } catch (error) {
        return next(error);
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Luma is running on port ${port}`);
});