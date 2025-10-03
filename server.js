// server.js
require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Config ---
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is not defined in your .env file.");
  process.exit(1);
}

// --- Database Connection ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully to Atlas!');

    // --- Routes ---

    // Serve static files (HTML, CSS, JS, images, etc.)
    app.use(express.static(path.join(__dirname)));

    // API routes
    app.use('/api/auth', require('./auth'));

    // Serve admin.html at /admin
    app.get('/admin', (req, res) => {
      res.sendFile(path.join(__dirname, 'admin.html'));
    });

    // Fallback: Serve login.html for all other routes
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, 'login.html'));
    });

    // --- Start Server ---
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
