import express from 'express';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db.js';
import gratitudeRouter from './routes/gratitude.js';
import createCheckInRouter from './routes/check-in.js';
import createSuggestionsRouter from './routes/suggestions.js';
import reviewSuggestionsRouter from './routes/review-suggestions.js';
import savedResourcesRouter from './routes/saved-resources.js';
import { errorHandler } from './middleware/error-handler.js';

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

const comfortTopics = [
    'Peace', 'Hope', 'Strength', 'Feeling loved', 'Direction',
    'Just something encouraging',
];

const resourceTypes = ['Anything', 'Scripture', 'Quote', 'Conference talk'];

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

app.use('/check-in', createCheckInRouter({
    topics: comfortTopics,
    types: resourceTypes,
}));

app.use('/gratitude', gratitudeRouter);

app.use(savedResourcesRouter);

app.use('/suggestions', createSuggestionsRouter({
    topics: comfortTopics,
    types: resourceTypes.filter((type) => type !== 'Anything'),
}));

app.use('/review/suggestions', reviewSuggestionsRouter);

app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
    console.log(`Luma is running on port ${port}`);
});