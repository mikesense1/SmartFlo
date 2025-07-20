const express = require('express');
const { registerRoutes } = require('../dist/index.js');

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Register all routes
registerRoutes(app);

module.exports = app;