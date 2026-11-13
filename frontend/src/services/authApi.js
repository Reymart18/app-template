const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function login({ identifier, password }) {
  let response

  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })
  } catch {
    throw new Error('Unable to reach the login service. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.message ?? 'Unable to sign in. Please try again.')
  }

  return body
}

