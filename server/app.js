require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const api = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP off so the served SPA assets load
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN } : undefined));
app.use(express.json());

// Liveness probe — no DB dependency.
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'carbooking-server' });
});

app.use('/api/v1', api);

// Production: serve the built React app from the same service (single Railway deploy).
// Dev uses the Vite dev server + proxy instead, so this is a no-op when dist is absent.
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback for any non-API route.
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(notFound); // unmatched /api/* → JSON 404
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`carbooking-server listening on http://localhost:${PORT}`);
});

module.exports = app;
