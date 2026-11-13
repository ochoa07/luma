import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../models/users.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function showSignup(req, res) {
    return res.render('signup', {
        error: null,
        accountCreated: req.query.created === '1',
    });
}

export async function signup(req, res) {
    const firstName = String(req.body?.firstName ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (
        !firstName || firstName.length > 80 ||
        email.length > 254 || !emailPattern.test(email) ||
        password.length < 8 || Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).render('signup', {
            error: 'Enter your first name, a valid email, and a password between 8 characters and 72 bytes.',
            accountCreated: false,
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await createUser({ firstName, email, passwordHash });

    if (!created) {
        return res.status(409).render('signup', {
            error: 'An account already exists with that email.',
            accountCreated: false,
        });
    }

    return res.redirect(303, '/signup?created=1');
}

export function showSignin(req, res) {
    return res.render('signin', { error: null });
}

export async function signin(req, res, next) {
    const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
    const password = typeof req.body?.password === 'string'
        ? req.body.password
        : '';

    if (
        !email || email.length > 254 || !emailPattern.test(email) ||
        !password || Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).render('signin', {
            error: 'Enter a valid email and password.',
        });
    }

    const user = await findUserByEmail(email);

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
}

export function signout(req, res, next) {
    req.session.destroy((error) => {
        if (error) return next(error);

        res.clearCookie('connect.sid', { path: '/' });
        return res.redirect(303, '/');
    });
}