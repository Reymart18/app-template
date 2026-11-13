import { getSession } from './session'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getAuthorizationHeader() {
  const session = getSession()
  if (!session) {
    throw new Error('Your session has ended. Please sign in again.')
  }

  return { Authorization: `Bearer ${session.accessToken}` }
}

export async function createCollection(collection) {
  let response
  try {
    response = await fetch(`${apiUrl}/collections`, {
      method: 'POST',
      headers: {
        ...getAuthorizationHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collection),
    })
  } catch {
    throw new Error('Unable to reach the collection service. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'The collection could not be recorded.')
  }

  return body
}

export async function getCollections() {
  let response
  try {
    response = await fetch(`${apiUrl}/collections`, {
      headers: getAuthorizationHeader(),
    })
  } catch {
    throw new Error('Unable to load collection records. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'Collection records could not be loaded.')
  }

  return body
}

async function mutateCollection(id, method, collection) {
  let response
  try {
    response = await fetch(`${apiUrl}/collections/${id}`, {
      method,
      headers: {
        ...getAuthorizationHeader(),
        'Content-Type': 'application/json',
      },
      body: collection ? JSON.stringify(collection) : undefined,
    })
  } catch {
    throw new Error('Unable to reach the collection service. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'The collection record could not be updated.')
  }
  return body
}

export function updateCollection(id, collection) {
  return mutateCollection(id, 'PATCH', collection)
}

export function deleteCollection(id) {
  return mutateCollection(id, 'DELETE')
}
