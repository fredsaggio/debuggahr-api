const express = require('express');
const cors = require('cors');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const submissionRoutes = require('./routes/submissionRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hackaton-api' });
});

// API Routes
app.use('/api/submissions', submissionRoutes);
app.use('/api/chat', chatRoutes);

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
