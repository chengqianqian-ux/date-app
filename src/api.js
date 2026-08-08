const TOKEN_KEY = 'date_app_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

export const api = {
  register: (username, password, nickname) =>
    request('/auth/register', { method: 'POST', body: { username, password, nickname } }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } }),
  genPairCode: () => request('/couples/code', { method: 'POST' }),
  pair: (pair_code) => request('/couples/pair', { method: 'POST', body: { pair_code } }),
  partner: () => request('/couples/partner'),
  getAnniversary: () => request('/couples/anniversary'),
  setAnniversary: (anniversary) =>
    request('/couples/anniversary', { method: 'POST', body: { anniversary } }),
  listInvitations: () => request('/invitations'),
  createInvitation: (payload) => request('/invitations', { method: 'POST', body: payload }),
  respond: (id, action) => request(`/invitations/${id}/respond`, { method: 'POST', body: { action } }),
  cancel: (id) => request(`/invitations/${id}/cancel`, { method: 'POST' }),
  complete: (id) => request(`/invitations/${id}/complete`, { method: 'POST' }),
  listWishlist: () => request('/wishlists'),
  addWishlist: (payload) => request('/wishlists', { method: 'POST', body: payload }),
  deleteWishlist: (id) => request(`/wishlists/${id}`, { method: 'DELETE' }),
  toggleWishlist: (id) => request(`/wishlists/${id}/toggle`, { method: 'POST' }),
}
