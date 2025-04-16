// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const beehiivRoutes = require('./routes/beehiiv');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', beehiivRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Beehiiv API Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});