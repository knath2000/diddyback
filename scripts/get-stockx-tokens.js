const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 8080;

const CLIENT_ID = process.env.STOCKX_CLIENT_ID || 'IGdS7Rqqgitf2VHVVhM8uX4UeZg6S0i0';
const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET || 'hUQXulxd0JC9m0R0TayZAaQWDXj8cKwIIp8kJrlwEe5NUQ3bO0YZ59yxKS2Qo0mT';
const REDIRECT_URI = 'http://localhost:8080/oauth/callback';

console.log('🚀 StockX Token Helper Starting...');
console.log('\n📋 INSTRUCTIONS:');
console.log('1. This server runs locally on http://localhost:8080');
console.log('2. Open the authorization URL printed below in your browser');
console.log('3. Log in with your StockX developer account and approve');
console.log('4. The callback will display your tokens – copy them into diddyback/.env');

app.get('/oauth/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    console.error('❌ OAuth Error:', error);
    return res.send(`<h1>OAuth Error</h1><p>${error}</p>`);
  }
  if (!code) {
    console.error('❌ No authorization code received');
    return res.send('<h1>Error</h1><p>No authorization code received</p>');
  }

  try {
    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await axios.post('https://accounts.stockx.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    console.log('\n🎉 SUCCESS! Got tokens:');
    console.log('─'.repeat(50));
    console.log(`STOCKX_ACCESS_TOKEN="${access_token}"`);
    console.log(`STOCKX_REFRESH_TOKEN="${refresh_token}"`);
    console.log('─'.repeat(50));
    console.log('Add these (and your STOCKX_API_KEY) to diddyback/.env');

    res.send(`
      <h1>✅ StockX Tokens Obtained!</h1>
      <p>Copy and paste the following into your <code>.env</code> file:</p>
      <pre style="background:#f0f0f0;padding:20px;white-space:pre-wrap">STOCKX_ACCESS_TOKEN="${access_token}"
STOCKX_REFRESH_TOKEN="${refresh_token}"
STOCKX_API_KEY="YOUR_API_KEY_HERE"</pre>
      <p>Access token expires in: ${expires_in} seconds (${Math.round(expires_in / 3600)} hours)</p>
      <p>You still need to grab <code>STOCKX_API_KEY</code> from your StockX developer dashboard.</p>
    `);
  } catch (err) {
    console.error('❌ Token exchange failed:', err.response?.data || err.message);
    res.send(`<h1>Token Exchange Failed</h1><pre>${err.response?.data || err.message}</pre>`);
  }
});

app.listen(PORT, () => {
  const authUrl = `https://accounts.stockx.com/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=offline_access%20openid&audience=gateway.stockx.com&state=random_state_123`;
  console.log(`🌐 Local server listening on http://localhost:${PORT}`);
  console.log('\n🔗 AUTHORIZATION URL:');
  console.log(authUrl);
  console.log('\n⏳ Awaiting OAuth callback...');
});
