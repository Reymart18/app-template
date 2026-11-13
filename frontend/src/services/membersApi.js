import { getSession } from './session'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getAuthorizationHeader() {
  const session = getSession()
  if (!session) {
    throw new Error('Your session has ended. Please sign in again.')
  }

  return { Authorization: `Bearer ${session.accessToken}` }
}

export async function importMasterlist(file) {
  const formData = new FormData()
  formData.append('file', file)

  let response
  try {
    response = await fetch(`${apiUrl}/members/import`, {
      method: 'POST',
      headers: getAuthorizationHeader(),
      body: formData,
    })
  } catch {
    throw new Error('Unable to reach the import service. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'The masterlist could not be imported.')
  }

  return body
}

async function sendMemberRequest(url, method, values) {
  let response
  try {
    response = await fetch(`${apiUrl}${url}`, {
      method,
      headers: { ...getAuthorizationHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
  } catch {
    throw new Error('Unable to reach the member service. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'The member record could not be saved.')
  }
  return body
}

export function createMember(values) {
  return sendMemberRequest('/members', 'POST', values)
}

export function updateMember(id, values) {
  return sendMemberRequest(`/members/${id}`, 'PATCH', values)
}

export async function getMembers({ page = 1, search = '' } = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (search.trim()) {
    params.set('search', search.trim())
  }

  let response
  try {
    response = await fetch(`${apiUrl}/members?${params}`, {
      headers: getAuthorizationHeader(),
    })
  } catch {
    throw new Error('Unable to load the member masterlist. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'The member masterlist could not be loaded.')
  }

  return body
}

export async function lookupMember(block, lot) {
  const params = new URLSearchParams({ block: block.trim(), lot: lot.trim() })

  let response
  try {
    response = await fetch(`${apiUrl}/members/lookup?${params}`, {
      headers: getAuthorizationHeader(),
    })
  } catch {
    throw new Error('Unable to load the member record. Please try again later.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message ?? 'The member record could not be loaded.')
  }

  return body
}
