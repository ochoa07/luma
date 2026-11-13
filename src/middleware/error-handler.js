export function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const status = error.status ?? error.statusCode;
    const isClientError = Number.isInteger(status) && status >= 400 && status < 500;

    if (isClientError) {
        return res.status(status).send('We couldn’t process that request.');
    }

    console.error(`Error handling ${req.method} ${req.path}`, error);
    return res.status(500).send('Something went wrong. Please try again.');
}