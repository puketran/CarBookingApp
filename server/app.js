require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const api = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Liveness probe — no DB dependency.
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'carbooking-server' });
});

app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`carbooking-server listening on http://localhost:${PORT}`);
});

module.exports = app;
