"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenExpiry = getTokenExpiry;
exports.getAccessToken = getAccessToken;
exports.fetchWithAuth = fetchWithAuth;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Environment variables required
// STOCKX_CLIENT_ID, STOCKX_CLIENT_SECRET, STOCKX_REFRESH_TOKEN, STOCKX_API_KEY
let cachedToken = process.env.STOCKX_ACCESS_TOKEN || null;
let tokenExpiresAt = 0; // epoch ms
function getTokenExpiry() {
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
    const res = await axios_1.default.post('https://accounts.stockx.com/oauth/token', {
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
async function getAccessToken() {
    if (!cachedToken || Date.now() > tokenExpiresAt) {
        return refreshAccessToken();
    }
    return cachedToken;
}
async function fetchWithAuth(url, opts = {}) {
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