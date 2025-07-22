const axios = require('axios');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Production callback URL approved in StockX developer dashboard
const PROD_REDIRECT = 'https://diddyback.fly.dev/oauth/stockx/callback';

// Pull client credentials from env so we never hard-code secrets in git
const CLIENT_ID = process.env.STOCKX_CLIENT_ID || '';
const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET || '';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ STOCKX_CLIENT_ID / STOCKX_CLIENT_SECRET env vars are required');
  process.exit(1);
}

console.log('🚀  StockX Token Helper (Fixed Version)');
console.log('\n📋  INSTRUCTIONS:');
console.log('1. Open the authorization URL below in your browser');
console.log('2. Complete the StockX OAuth flow');
console.log('3. You will land on the "StockX OAuth Success" page hosted by diddyback');
console.log('4. Copy the full callback URL from the browser address bar');
console.log('5. Paste it back into this terminal and hit <enter> to extract tokens');
console.log('\n────────────────────────────────────────────────────────\n');

// Build authorization URL using production redirect URI
const state = `local-manual-${Date.now()}`;
const AUTH_URL = `https://accounts.stockx.com/authorize?response_type=code&client_id=${encodeURIComponent(
  CLIENT_ID
)}&redirect_uri=${encodeURIComponent(
  PROD_REDIRECT
)}&scope=offline_access%20openid&audience=gateway.stockx.com&state=${state}`;

console.log('🔗  AUTHORIZATION URL:');
console.log(AUTH_URL + '\n');

// Prompt user to paste callback URL
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('📎  Paste the callback URL here: ', async (callbackUrl) => {
  rl.close();
  try {
    const url = new URL(callbackUrl.trim());
    const code = url.searchParams.get('code');

    if (!code) {
      console.error('❌  Authorization code not found in the provided URL.');
      process.exit(1);
    }

    console.log('🔄  Exchanging authorization code for tokens...');

    const tokenRes = await axios.post('https://accounts.stockx.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: PROD_REDIRECT,
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    console.log('\n🎉  SUCCESS! Tokens received from StockX');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Access token length: ${access_token.length} characters`);
    console.log(`Expires in: ${expires_in} seconds`);
    console.log('\n🔑  REFRESH TOKEN (save as secret):');
    console.log(refresh_token);
    console.log('════════════════════════════════════════════════════════\n');

    console.log('Run the following command to persist the refresh token on Fly.io:');
    console.log(`flyctl secrets set STOCKX_REFRESH_TOKEN="${refresh_token}" -a diddyback`);
  } catch (err) {
    console.error('❌  Error exchanging code for tokens:', err.response?.data || err.message);
    process.exit(1);
  }
}); 