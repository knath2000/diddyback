import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();
// Environment variables required
// STOCKX_CLIENT_ID, STOCKX_CLIENT_SECRET, STOCKX_REFRESH_TOKEN, STOCKX_API_KEY
let cachedToken = process.env.STOCKX_ACCESS_TOKEN || null;
let tokenExpiresAt = 0; // epoch ms
export function getTokenExpiry() {
    return tokenExpiresAt;
}
async function refreshAccessToken() {
    const refreshToken = process.env.STOCKX_REFRESH_TOKEN;
    if (!refreshToken) {
        throw new Error('Missing STOCKX_REFRESH_TOKEN env variable');
    }
    const clientId = process.env.STOCKX_CLIENT_ID;
    const clientSecret = process.env.STOCKX_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Missing StockX client credentials');
    }
    const res = await axios.post('https://accounts.stockx.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
    });
    const { access_token, expires_in, refresh_token } = res.data;
    cachedToken = access_token;
    tokenExpiresAt = Date.now() + expires_in * 1000 - 60_000; // renew 1 min early
    // If API returns a new refresh token, persist it in process.env for current runtime
    if (refresh_token) {
        process.env.STOCKX_REFRESH_TOKEN = refresh_token;
    }
    return cachedToken;
}
export async function getAccessToken() {
    if (!cachedToken || Date.now() > tokenExpiresAt) {
        return refreshAccessToken();
    }
    return cachedToken;
}
export async function fetchWithAuth(url, opts = {}) {
    const token = await getAccessToken();
    const apiKey = process.env.STOCKX_API_KEY;
    if (!apiKey) {
        throw new Error('Missing STOCKX_API_KEY env variable');
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
    };
    return fetch(url, { ...opts, headers });
}
//# sourceMappingURL=stockxAuth.js.map