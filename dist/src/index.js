"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const items_1 = __importDefault(require("./routes/items"));
// Load environment variables from .env if present
dotenv_1.default.config();
const app = (0, express_1.default)();
console.log('Environment PORT variable:', process.env.PORT);
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// Root endpoint (Railway health checks default to "/")
app.get('/', (req, res) => {
    res.status(200).send('OK');
});
app.use('/items', items_1.default);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});
app.listen(port, () => {
    console.log(`diddyback server listening on port ${port}`);
});
