import express from 'express';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { pool } from './db.js';

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', fileURLToPath(new URL('./views/', import.meta.url)));

app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.render('home');
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

    if (!firstName || firstName.length > 80 ||
        email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
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

app.listen(port, '0.0.0.0', () => {
    console.log(`Luma is running on port ${port}`);
});