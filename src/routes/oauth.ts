import { Router } from 'express'
import axios from 'axios'
import { generateState, validateState, requireAdmin } from '../utils/oauthSecurity'
import { getAccessToken, getTokenExpiry } from '../utils/stockxAuth'

const router: Router = Router()

const CLIENT_ID = process.env.STOCKX_CLIENT_ID!
const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET!
const REDIRECT_URI = process.env.STOCKX_REDIRECT_URI || 'http://localhost:8080/oauth/stockx/callback'

// 1. Initiate authorization
router.get('/authorize', (_req, res) => {
  const state = generateState()
  const authUrl = `https://accounts.stockx.com/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=offline_access%20openid&audience=gateway.stockx.com&state=${state}`
  res.redirect(authUrl)
})

// 2. Callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query
  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.status(400).send('Missing code or state')
  }
  if (!validateState(state)) {
    return res.status(400).send('Invalid state')
  }
  try {
    const tokenResp = await axios.post('https://accounts.stockx.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    })
    const { access_token, refresh_token, expires_in } = tokenResp.data
    process.env.STOCKX_ACCESS_TOKEN = access_token
    process.env.STOCKX_REFRESH_TOKEN = refresh_token
    const expireAt = new Date(Date.now() + expires_in * 1000).toISOString()
    res.send(`<h1>StockX OAuth Success</h1><p>Tokens stored in memory for this runtime.</p><p>Access token expires at ${expireAt}</p>`)
  } catch (e: any) {
    console.error('OAuth callback error', e.response?.data || e.message)
    res.status(500).send('Token exchange failed')
  }
})

// 3. Status (admin)
router.get('/status', (req, res) => {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'unauthorized' })
  const accessToken = process.env.STOCKX_ACCESS_TOKEN
  const refresh = process.env.STOCKX_REFRESH_TOKEN
  res.json({
    hasTokens: Boolean(accessToken && refresh),
    tokenExpiry: getTokenExpiry() ? new Date(getTokenExpiry()).toISOString() : null,
    canRefresh: Boolean(refresh),
  })
})

// 4. Manual refresh (admin)
router.post('/refresh', async (req, res) => {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'unauthorized' })
  try {
    const token = await getAccessToken()
    res.json({ ok: true, token })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// 5. Revoke (admin)
router.delete('/revoke', (req, res) => {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'unauthorized' })
  delete process.env.STOCKX_ACCESS_TOKEN
  delete process.env.STOCKX_REFRESH_TOKEN
  res.json({ ok: true })
})

router.get('/extract-tokens', (req, res) => {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'unauthorized' })
  res.json({
    access_token: process.env.STOCKX_ACCESS_TOKEN || null,
    refresh_token: process.env.STOCKX_REFRESH_TOKEN || null,
    timestamp: new Date().toISOString()
  })
})

export default router 