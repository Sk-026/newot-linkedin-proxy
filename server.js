require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Exchange auth code for access token
app.get('/linkedin/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const { access_token, expires_in } = response.data;

    // Redirect back to app with token
    res.redirect(
      `newotai://linkedin/callback?access_token=${access_token}&expires_in=${expires_in}`
    );
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'NeWOT LinkedIn Proxy is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});