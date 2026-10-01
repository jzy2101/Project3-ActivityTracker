async function request(url, options) {
  const response = await fetch(url, options)

  if (response.status === 204) {
    if (!response.ok) {
      throw new Error('Something went wrong.')
    }
    return null
  }

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(result?.error || 'Something went wrong.')
  }

  return result
}

export const api = {
  get: (url) => request(url),
  post: (url, body) =>
    request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
  patch: (url, body) =>
    request(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
  delete: (url) => request(url, { method: 'DELETE' })
}
