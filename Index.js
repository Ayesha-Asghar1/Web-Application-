const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
app.use(bodyParser.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access denied. No token provided.');

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.status(500).send('Failed to authenticate token.');

    req.userId = decoded.id;
    next();
  });
};

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, age, gender, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 8);

  pool.query('INSERT INTO users (username, age, gender, password) VALUES ($1, $2, $3, $4)',
    [username, age, gender, hashedPassword],
    (err, result) => {
      if (err) return res.status(500).send(err);

      const token = jwt.sign({ id: result.insertId }, process.env.SECRET_KEY, { expiresIn: '1h' });
      res.status(201).json({ token });
    }
  );
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  pool.query('SELECT * FROM users WHERE username = $1', [username], async (err, result) => {
    if (err) return res.status(500).send(err);

    const user = result.rows[0];
    if (!user) return res.status(400).send('User not found.');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send('Access denied. Wrong password.');

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
  });
});

// Get user profile endpoint
app.get('/profile', verifyToken, (req, res) => {
  pool.query('SELECT * FROM users WHERE id = $1', [req.userId], (err, result) => {
    if (err) return res.status(500).send(err);

    res.status(200).json(result.rows[0]);
  });
});

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
