require('dotenv').config({ path: '.env.local' });
const express = require('express');
const app = require('./api/index');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Serve static files from the current directory
// Note: This must come AFTER the API routes to ensure API takes precedence if there's a conflict,
// but usually API routes are specific. app.use(app) might mount routes at root.
// If I use app.use(express.static), it might shadow API if a file exists with same name.
// Standard pattern: API first, then static.
// BUT `api/index.js` has `app.use` which executes.
// The `app` imported IS an express app with routes already mounted.
// So we just need to add static middleware to it?
// No, if I `app.listen`, I am listening on THAT app.
// So I should just add static middleware TO that app.

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log('Serving static files from ' + __dirname);
});
