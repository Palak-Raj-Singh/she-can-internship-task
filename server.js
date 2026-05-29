const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const DB_FILE = path.join(__dirname, 'submissions.json');

// Middleware rules configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Create file database if missing
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// 1. POST API: Submit Form Data
app.post('/api/submit', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || name.trim().length < 2 || !email || !message) {
        return res.status(400).json({ success: false, error: "Validation failed." });
    }

    try {
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        const submissions = JSON.parse(fileData);

        const newSubmission = {
            id: Date.now(),
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
            date: new Date().toLocaleString()
        };

        submissions.push(newSubmission);
        fs.writeFileSync(DB_FILE, JSON.stringify(submissions, null, 2));

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: "Database error." });
    }
});

// 2. GET API: Secure Admin Fetch Guard
app.get('/api/admin/data', (req, res) => {
    const adminPassword = req.headers['authorization'];

    if (adminPassword !== 'admin123') {
        return res.status(401).json({ error: "Access denied." });
    }

    try {
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        res.json(JSON.parse(fileData));
    } catch (err) {
        res.status(500).json({ error: "Read error." });
    }
});


// 3. DELETE API: Remove log entry by ID (Protected)
app.delete('/api/admin/delete/:id', (req, res) => {
    const adminPassword = req.headers['authorization'];
    
    if (adminPassword !== 'admin123') {
        return res.status(401).json({ error: "Access denied." });
    }

    const targetId = parseInt(req.params.id);
    try {
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        let submissions = JSON.parse(fileData);
        
        submissions = submissions.filter(item => item.id !== targetId);
        
        fs.writeFileSync(DB_FILE, JSON.stringify(submissions, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: "Database update failed." });
    }
});

// Start listening explicitly on port 3000
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});