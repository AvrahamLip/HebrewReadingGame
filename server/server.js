const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Dynamic configuration endpoint
app.get('/env.js', (req, res) => {
    // If API_URL env var is set (Prod), use it. 
    // Fallback: Default to Render URL so it works out-of-the-box
    const apiUrl = process.env.API_URL || 'https://hebrewreadinggame.onrender.com';
    res.type('application/javascript');
    res.send(`window.env = { API_URL: "${apiUrl}" };`);
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    const apiUrl = process.env.API_URL || 'Not Set (Using Relative/Local default)';
    res.status(200).json({
        status: 'alive',
        message: 'Server is running smoothly 🦁',
        api_url: apiUrl
    });
});

// Get all words
app.get('/api/words', (req, res) => {
    const sql = "SELECT * FROM words ORDER BY id ASC";
    const params = [];
    console.log("Fetching all words...");
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching words:", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Get words by level
app.get('/api/words/:level', (req, res) => {
    const sql = "SELECT * FROM words WHERE level = ?";
    const params = [req.params.level];
    console.log(`Fetching words for level ${req.params.level}...`);
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching level words:", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
