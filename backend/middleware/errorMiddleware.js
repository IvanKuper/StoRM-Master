const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

const errorHandler = (err, req, res, next) => {
  // Bad input caught by Mongoose or multer is the client's fault, not a crash.
  const badInput = ['ValidationError', 'CastError', 'MulterError'].includes(err.name)
  const statusCode =
    res.statusCode !== 200
      ? res.statusCode
      : err.status || (badInput ? 400 : 500)
  res.status(statusCode)
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
}

export { notFound, errorHandler }
