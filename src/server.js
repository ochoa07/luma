import express from 'express';
import { fileURLToPath } from 'node:url';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db.js';
import authRouter from './routes/auth.js';
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

app.use(authRouter);

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