const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// JDoodle execute endpoint
app.post('/api/execute', async (req, res) => {
  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: req.body.script,
      language: req.body.language,
      versionIndex: "0"
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// JDoodle credits endpoint
app.get('/api/credits', async (req, res) => {
  try {
    const response = await axios.post('https://api.jdoodle.com/v1/credit-spent', {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});