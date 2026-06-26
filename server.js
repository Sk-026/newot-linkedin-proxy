require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const REDIRECT_URI = 'https://newot-linkedin-proxy.onrender.com/linkedin/callback';
const usedCodes = new Set();

app.get('/linkedin/callback', async (req, res) => {
  const { code } = req.query;

  console.log('Received code:', code?.slice(0, 20) + '...');

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  if (usedCodes.has(code)) {
    console.log('Duplicate code detected, ignoring');
    return res.send(`
      <html>
        <body>
          <p>Already processed. Please go back to the app.</p>
        </body>
      </html>
    `);
  }
  usedCodes.add(code);

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

    // Send HTML page that redirects to app via deep link
    res.send(`
      <html>
        <head>
          <title>Connecting to NeWOT AI...</title>
          <meta http-equiv="refresh" content="0;url=newotai://linkedin/callback?access_token=${access_token}&expires_in=${expires_in}" />
        </head>
        <body>
          <p>Redirecting back to NeWOT AI app...</p>
          <a href="newotai://linkedin/callback?access_token=${access_token}&expires_in=${expires_in}">
            Tap here if not redirected automatically
          </a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).send(`
      <html>
        <body>
          <p>Connection failed. Please go back to the app and try again.</p>
        </body>
      </html>
    `);
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'NeWOT LinkedIn Proxy is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});