require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const REDIRECT_URI = 'https://newot-linkedin-proxy.onrender.com/linkedin/callback';

app.get('/linkedin/callback', async (req, res) => {
  const { code } = req.query;

  console.log('Received code:', code);
  console.log('Using redirect URI:', REDIRECT_URI);

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('client_id', process.env.LINKEDIN_CLIENT_ID);
    params.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);

    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = response.data;
    console.log('Token exchange successful!');

    res.redirect(
      `newotai://linkedin/callback?access_token=${access_token}&expires_in=${expires_in}`
    );
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Token exchange failed', details: err.response?.data });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'NeWOT LinkedIn Proxy is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});