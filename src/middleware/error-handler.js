export function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const status = error.status ?? error.statusCode;
    const isClientError =
        Number.isInteger(status) && status >= 400 && status < 500;

    if (isClientError) {
        return res.status(status).render('error', {
            message: 'We couldn’t process that request. Please try again.',
        });
    }

    console.error(`Error handling ${req.method} ${req.path}`, error);

    return res.status(500).render('error', {
        message: 'Please try again in a moment.',
    });
}