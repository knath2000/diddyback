"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateState = generateState;
exports.validateState = validateState;
exports.requireAdmin = requireAdmin;
const crypto_1 = __importDefault(require("crypto"));
const stateStore = new Map(); // state -> expiry timestamp
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
function generateState() {
    const state = crypto_1.default.randomBytes(16).toString('hex');
    stateStore.set(state, Date.now() + STATE_TTL_MS);
    return state;
}
function validateState(state) {
    const exp = stateStore.get(state);
    if (!exp)
        return false;
    stateStore.delete(state);
    return Date.now() <= exp;
}
function requireAdmin(req) {
    const token = req.headers['x-admin-token'] || req.query.adminToken;
    return token === process.env.OAUTH_ADMIN_TOKEN;
}
//# sourceMappingURL=oauthSecurity.js.map