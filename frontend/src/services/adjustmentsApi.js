import { getSession } from './session'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getAuthorizationHeader() {
  const session = getSession()
  if (!session) {
    throw new Error('Your session has ended. Please sign in again.')
  }
  return { Authorization: `Bearer ${session.accessToken}` }
}

async function request(url, options = {}) {
  let response
  try {
    response = await fetch(`${apiUrl}${url}`, {
      ...options,
      headers: { ...getAuthorizationHeader(), ...options.headers },
    })
  } catch {
    throw new Error('Unable to reach the adjustment service. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'The adjustment request could not be completed.')
  }
  return body
}

export function getAdjustments() {
  return request('/adjustments')
}

export function createAdjustment(values) {
  return request('/adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
}

export function deleteAdjustment(id) {
  return request(`/adjustments/${id}`, { method: 'DELETE' })
}
