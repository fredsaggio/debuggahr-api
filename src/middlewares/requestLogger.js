function requestLogger(req, res, next) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n[${timestamp}] 🌐 ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = requestLogger;
