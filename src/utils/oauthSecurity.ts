import crypto from 'crypto'
import { Request } from 'express'

const stateStore = new Map<string, number>() // state -> expiry timestamp
const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function generateState(): string {
  const state = crypto.randomBytes(16).toString('hex')
  stateStore.set(state, Date.now() + STATE_TTL_MS)
  return state
}

export function validateState(state: string): boolean {
  const exp = stateStore.get(state)
  if (!exp) return false
  stateStore.delete(state)
  return Date.now() <= exp
}

export function requireAdmin(req: Request): boolean {
  const token = req.headers['x-admin-token'] || req.query.adminToken
  return token === process.env.OAUTH_ADMIN_TOKEN
} 