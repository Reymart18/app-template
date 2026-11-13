import { getSession } from './session'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getAuthorizationHeader() {
  const session = getSession()
  if (!session) throw new Error('Your session has ended. Please sign in again.')
  return { Authorization: `Bearer ${session.accessToken}` }
}

export async function getBillings() {
  let response
  try {
    response = await fetch(`${apiUrl}/billing`, { headers: getAuthorizationHeader() })
  } catch {
    throw new Error('Unable to load billing records. Please try again later.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message ?? 'Billing records could not be loaded.')
  return body
}

export async function generateBilling(billing) {
  let response
  try {
    response = await fetch(`${apiUrl}/billing/generate`, {
      method: 'POST',
      headers: { ...getAuthorizationHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(billing),
    })
  } catch {
    throw new Error('Unable to reach the billing service. Please try again later.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message ?? 'The billing run could not be completed.')
  return body
}
