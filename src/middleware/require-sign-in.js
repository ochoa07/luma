export function requireSignIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/signin');
    }

    return next();
}