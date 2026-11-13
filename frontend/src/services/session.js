const tokenKey = 'pvhaiAccessToken'
const userKey = 'pvhaiUser'

function readSession(storage) {
  const accessToken = storage.getItem(tokenKey)
  const serializedUser = storage.getItem(userKey)

  if (!accessToken || !serializedUser) {
    return null
  }

  try {
    return { accessToken, user: JSON.parse(serializedUser) }
  } catch {
    storage.removeItem(tokenKey)
    storage.removeItem(userKey)
    return null
  }
}

export function getSession() {
  return readSession(sessionStorage) ?? readSession(localStorage)
}

export function saveSession(session, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage
  const otherStorage = rememberMe ? sessionStorage : localStorage

  otherStorage.removeItem(tokenKey)
  otherStorage.removeItem(userKey)
  storage.setItem(tokenKey, session.accessToken)
  storage.setItem(userKey, JSON.stringify(session.user))
}

export function clearSession() {
  for (const storage of [sessionStorage, localStorage]) {
    storage.removeItem(tokenKey)
    storage.removeItem(userKey)
  }
}
