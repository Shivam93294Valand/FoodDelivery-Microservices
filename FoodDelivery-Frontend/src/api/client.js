const rawBase = import.meta.env.VITE_API_BASE_URL
const BASE_URL = (rawBase === undefined ? 'https://localhost:7000' : (rawBase || '')).replace(/\/$/, '')

const HTTPS_TO_HTTP_PORTS = {
  7000: 5000,
  7001: 5001,
  7002: 5002,
  7003: 5003,
  7004: 5004,
  7005: 5005,
  7006: 5006,
  7007: 5007
}

const HTTP_TO_HTTPS_PORTS = Object.fromEntries(
  Object.entries(HTTPS_TO_HTTP_PORTS).map(([httpsPort, httpPort]) => [httpPort, Number(httpsPort)])
)

const getHttpFallbackUrl = (url) => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'localhost') return null
    const port = parseInt(parsed.port || '443', 10)
    const mapped = HTTPS_TO_HTTP_PORTS[port]
    if (!mapped) return null
    parsed.protocol = 'http:'
    parsed.port = String(mapped)
    return parsed.toString()
  } catch (e) {
    return null
  }
}

const getHttpsFallbackUrl = (url) => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' || parsed.hostname !== 'localhost') return null
    const port = parseInt(parsed.port || '80', 10)
    const mapped = HTTP_TO_HTTPS_PORTS[port]
    if (!mapped) return null
    parsed.protocol = 'https:'
    parsed.port = String(mapped)
    return parsed.toString()
  } catch (e) {
    return null
  }
}

const parseErrorResponse = async (resp) => {
  const text = await resp.text().catch(() => '')
  let message = text || `Request failed: ${resp.status}`
  try {
    const parsed = JSON.parse(text)
    if (parsed && parsed.message) message = parsed.message
  } catch (e) {
  }
  return message
}

const performFetch = async (url, options, headers) => {
  const resp = await fetch(url, {
    ...options,
    headers,
  })

  if (!resp.ok) {
    if (resp.status === 401) {
      console.warn('Unauthorized request - notifying auth context')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      throw new Error('Unauthorized. Please sign in again.')
    }

    if (resp.status === 429) {
      const retryAfter = resp.headers.get('Retry-After') || resp.headers.get('retry-after')
      const seconds = retryAfter ? parseInt(retryAfter, 10) : 60
      throw new Error(`Too many requests. Please try again in ${seconds} seconds.`)
    }

    const message = await parseErrorResponse(resp)
    throw new Error(message)
  }

  if (resp.status === 204) return null
  const ct = resp.headers.get('content-type') || ''
  if (ct.includes('application/json')) return resp.json()
  return resp.text()
}

async function request(path, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(path)
  const url = isAbsolute ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    return await performFetch(url, options, headers)
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const httpsFallback = getHttpsFallbackUrl(url)
      if (httpsFallback) {
        try {
          return await performFetch(httpsFallback, options, headers)
        } catch (fallbackError) {
          throw fallbackError
        }
      }

      const httpFallback = getHttpFallbackUrl(url)
      if (httpFallback) {
        try {
          return await performFetch(httpFallback, options, headers)
        } catch (fallbackError) {
          throw fallbackError
        }
      }

      throw new Error('Network error - please check your connection')
    }
    throw error
  }
}

export const api = {
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  adminLogin: async (data) => {
    try {
      return await request('/api/admin/auth/login', { method: 'POST', body: JSON.stringify(data) })
    } catch (e) {
      if (e.message !== 'Network error - please check your connection') throw e
      console.warn('adminLogin via gateway unavailable, trying direct service:', e)
      return request('https://localhost:7007/api/Auth/login', { method: 'POST', body: JSON.stringify(data) })
    }
  },
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: async (data) => {
    const shouldTryNext = (error) => {
      const msg = (error?.message || '').toLowerCase()
      return msg.includes('no account found') || msg.includes('not found') || msg.includes('invalid')
    }

    let lastError = null

    try {
      const result = await request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) })
      return { ...result, authScope: 'customer' }
    } catch (error) {
      lastError = error
      if (!shouldTryNext(error)) throw error
    }

    try {
      const result = await request('/api/admin/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) })
      return { ...result, authScope: 'admin' }
    } catch (error) {
      lastError = error
      if (!shouldTryNext(error)) throw error
    }

    try {
      const result = await request('https://localhost:7004/api/Auth/forgot-password', { method: 'POST', body: JSON.stringify(data) })
      return { ...result, authScope: 'delivery' }
    } catch (error) {
      throw error || lastError
    }
  },
  verifyPasswordOtp: async ({ authScope, ...data }) => {
    const customerRequest = () => request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) })
    const adminRequest = () => request('/api/admin/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) })
    const deliveryRequest = () => request('https://localhost:7004/api/Auth/verify-otp', { method: 'POST', body: JSON.stringify(data) })

    if (authScope === 'delivery') {
      const result = await deliveryRequest()
      return { ...result, authScope: 'delivery' }
    }

    if (authScope === 'admin') {
      try {
        const result = await adminRequest()
        return { ...result, authScope: 'admin' }
      } catch (adminError) {
        try {
          const result = await customerRequest()
          return { ...result, authScope: 'customer' }
        } catch (customerError) {
          const result = await deliveryRequest()
          return { ...result, authScope: 'delivery' }
        }
      }
    }

    try {
      const result = await customerRequest()
      return { ...result, authScope: 'customer' }
    } catch (customerError) {
      try {
        const result = await adminRequest()
        return { ...result, authScope: 'admin' }
      } catch (adminError) {
        const result = await deliveryRequest()
        return { ...result, authScope: 'delivery' }
      }
    }
  },
  resetPassword: async ({ authScope, ...data }) => {
    const customerRequest = () => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) })
    const adminRequest = () => request('/api/admin/auth/reset-password', { method: 'POST', body: JSON.stringify(data) })
    const deliveryRequest = () => request('https://localhost:7004/api/Auth/reset-password', { method: 'POST', body: JSON.stringify(data) })

    if (authScope === 'delivery') {
      const result = await deliveryRequest()
      return { ...result, authScope: 'delivery' }
    }

    if (authScope === 'admin') {
      try {
        const result = await adminRequest()
        return { ...result, authScope: 'admin' }
      } catch (adminError) {
        try {
          const result = await customerRequest()
          return { ...result, authScope: 'customer' }
        } catch (customerError) {
          const result = await deliveryRequest()
          return { ...result, authScope: 'delivery' }
        }
      }
    }

    try {
      const result = await customerRequest()
      return { ...result, authScope: 'customer' }
    } catch (customerError) {
      try {
        const result = await adminRequest()
        return { ...result, authScope: 'admin' }
      } catch (adminError) {
        const result = await deliveryRequest()
        return { ...result, authScope: 'delivery' }
      }
    }
  },

  getRestaurants: () => request('/api/restaurant'),
  getRestaurant: (id) => request(`/api/restaurant/${id}`),
  createRestaurant: (data) => request('/api/restaurant', { method: 'POST', body: JSON.stringify(data) }),
  updateRestaurant: (id, data) => request(`/api/restaurant/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRestaurant: (id) => request(`/api/restaurant/${id}`, { method: 'DELETE' }),

  _tryWithRetries: async (fn, retries = 1, delay = 300) => {
    let lastErr
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn()
      } catch (e) {
        lastErr = e
        if (i < retries) await new Promise(r => setTimeout(r, delay * (i + 1)))
      }
    }
    throw lastErr
  },

  getMenuItems: async (restaurantId) => {
    const attempts = [
      () => request(`/api/menu/restaurant/${restaurantId}`),
      () => request(`https://localhost:7001/api/Menu/Restaurant/${restaurantId}`),
      () => request(`http://localhost:5001/api/Menu/Restaurant/${restaurantId}`)
    ]

    const errors = []
    for (const attempt of attempts) {
      try {
        const res = await api._tryWithRetries(attempt, 1, 300)
        return Array.isArray(res) ? res : []
      } catch (e) {
        console.warn('getMenuItems attempt failed:', e)
        errors.push(e.message || String(e))
      }
    }

    console.error(`All getMenuItems attempts failed for ${restaurantId}:`, errors.join(' | '))
    return []
  },
  getMenuItem: async (id) => {
    try {
      return await request(`/api/menu/${id}`)
    } catch (e) {
      console.warn(`getMenuItem failed for ${id}:`, e)
      try {
        return await request(`https://localhost:7001/api/Menu/${id}`)
      } catch (e2) {
        console.warn('Direct restaurant service menu item fetch failed:', e2)
        throw e2
      }
    }
  },
  createMenuItem: (data) => request('/api/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id, data) => request(`/api/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id) => request(`/api/menu/${id}`, { method: 'DELETE' }),

  getCustomers: () => request('/api/customer'),
  getCustomer: (id) => request(`/api/customer/${id}`),
  createCustomer: (data) => request('/api/customer', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/api/customer/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/api/customer/${id}`, { method: 'DELETE' }),

  getOrders: async () => {
    const savedToken = localStorage.getItem('token')
    const authHeaders = savedToken ? { Authorization: `Bearer ${savedToken}` } : {}
    try {
      return await request('/api/order')
    } catch (e) {
      console.warn('getOrders via gateway failed:', e)
      try {
        const url = 'https://localhost:7003/api/Order'
        const headers = { 'Content-Type': 'application/json', ...authHeaders }
        const resp = await fetch(url, { headers })
        if (!resp.ok) throw new Error(`Direct OrderService failed: ${resp.status}`)
        if (resp.status === 204) return null
        return resp.json()
      } catch (e2) {
        console.warn('Direct OrderService fetch failed:', e2)
        throw e2
      }
    }
  },
  getCustomerOrders: async (customerId) => {
    try {
      return await request(`/api/order/customer/${customerId}`)
    } catch (e) {
      console.warn(`getCustomerOrders via gateway failed:`, e)
      try {
        return await request(`https://localhost:7003/api/Order/Customer/${customerId}`)
      } catch (e2) {
        console.warn('Direct OrderService customer orders fetch failed:', e2)
        throw e2
      }
    }
  },
  getOrder: async (id) => {
    try {
      return await request(`/api/order/${id}`)
    } catch (e) {
      console.warn(`getOrder ${id} via gateway failed:`, e)
      try {
        return await request(`https://localhost:7003/api/Order/${id}`)
      } catch (e2) {
        console.warn('Direct OrderService fetch by id failed:', e2)
        throw e2
      }
    }
  },
  createOrder: async (data) => {
    try {
      return await request('/api/order/Create', { method: 'POST', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('createOrder via gateway failed:', e)
      return request('https://localhost:7003/api/Order/Create', { method: 'POST', body: JSON.stringify(data) })
    }
  },
  updateOrderStatus: async (id, status) => {
    try {
      return await request(`/api/order/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    } catch (e) {
      console.warn(`updateOrderStatus ${id} via gateway failed:`, e)
      return request(`https://localhost:7003/api/Order/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    }
  },
  cancelOrder: async (id) => {
    try {
      return await request(`/api/order/${id}/cancel`, { method: 'POST' })
    } catch (e) {
      console.warn(`cancelOrder ${id} via gateway failed:`, e)
      return request(`https://localhost:7003/api/Order/${id}/cancel`, { method: 'POST' })
    }
  },

  getDeliveries: async () => {
    try {
      return await request('/api/delivery')
    } catch (e) {
      console.warn('getDeliveries via gateway failed:', e)
      try {
        return await request('https://localhost:7004/api/Delivery')
      } catch (e2) {
        console.warn('Direct DeliveryService fetch failed:', e2)
        throw e2
      }
    }
  },
  getDelivery: async (id) => {
    try {
      return await request(`/api/delivery/${id}`)
    } catch (e) {
      console.warn(`getDelivery ${id} via gateway failed:`, e)
      try {
        return await request(`https://localhost:7004/api/Delivery/${id}`)
      } catch (e2) {
        console.warn('Direct DeliveryService fetch by id failed:', e2)
        throw e2
      }
    }
  },
  updateDeliveryStatus: async (id, status) => {
    try {
      return await request(`/api/delivery/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    } catch (e) {
      console.warn(`updateDeliveryStatus ${id} via gateway failed:`, e)
      return request(`https://localhost:7004/api/Delivery/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    }
  },
  getDeliveryRoute: async (id) => {
    try {
      return await request(`/api/delivery/${id}/route`)
    } catch (e) {
      console.warn(`getDeliveryRoute ${id} via gateway failed:`, e)
      return request(`https://localhost:7004/api/Delivery/${id}/route`)
    }
  },
  verifyDeliveryOtp: async (deliveryId, otp) => {
    try {
      return await request(`/api/delivery/${deliveryId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ deliveryId, otp }),
      })
    } catch (e) {
      console.warn('verifyDeliveryOtp via gateway failed:', e)
      return request(`https://localhost:7004/api/Delivery/${deliveryId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ deliveryId, otp }),
      })
    }
  },
  sendDeliveryOtp: async (deliveryId) => {
    try {
      return await request(`/api/delivery/${deliveryId}/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ deliveryId }),
      })
    } catch (e) {
      console.warn('sendDeliveryOtp via gateway failed:', e)
      return request(`https://localhost:7004/api/Delivery/${deliveryId}/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ deliveryId }),
      })
    }
  },
  saveProofOfDelivery: async (deliveryId, proofUrl, notes = '') => {
    const payload = { proofUrl, notes }
    try {
      return await request(`/api/delivery/${deliveryId}/proof`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (e) {
      console.warn('saveProofOfDelivery via gateway failed:', e)
      return request(`https://localhost:7004/api/Delivery/${deliveryId}/proof`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
  },
  addDeliveryTip: async (deliveryId, tipAmount) => {
    const payload = { tipAmount }
    try {
      return await request(`/api/delivery/${deliveryId}/tip`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (e) {
      console.warn('addDeliveryTip via gateway failed:', e)
      return request(`https://localhost:7004/api/Delivery/${deliveryId}/tip`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
  },
  assignDelivery: async (id, data) => {
    try {
      return await request(`/api/delivery/${id}/assign`, { method: 'PATCH', body: JSON.stringify(data) })
    } catch (e) {
      console.warn(`assignDelivery ${id} via gateway failed:`, e)
      return request(`https://localhost:7004/api/Delivery/${id}/assign`, { method: 'PATCH', body: JSON.stringify(data) })
    }
  },

  getDeliveryPersons: async () => {
    const attempts = [
      () => request('/api/deliveryperson'), // gateway deliveryperson routing
      () => request('/api/delivery/persons'), // gateway delivery controller public endpoint
      () => request('https://localhost:7004/api/DeliveryPerson'), // direct admin-protected endpoint
      () => request('https://localhost:7004/api/Delivery/Persons') // direct public endpoint
    ]

    const errors = []
    for (const attempt of attempts) {
      try {
        const res = await attempt()
        return Array.isArray(res) ? res : []
      } catch (err) {
        errors.push(err.message || String(err))
      }
    }

    const errMsg = errors.join(' | ')
    console.error('All getDeliveryPersons attempts failed:', errMsg)
    throw new Error('Failed to load delivery persons: ' + errMsg)
  },
  createDeliveryPerson: async (data) => {
    try {
      return await request('/api/deliveryperson', { method: 'POST', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('createDeliveryPerson via gateway failed:', e)
      return request('https://localhost:7004/api/DeliveryPerson', { method: 'POST', body: JSON.stringify(data) })
    }
  },
  updateDeliveryPerson: async (id, data) => {
    try {
      return await request(`/api/deliveryperson/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('updateDeliveryPerson via gateway failed:', e)
      return request(`https://localhost:7004/api/DeliveryPerson/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }
  },
  deleteDeliveryPerson: async (id) => {
    try {
      return await request(`/api/deliveryperson/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.warn('deleteDeliveryPerson via gateway failed:', e)
      return request(`https://localhost:7004/api/DeliveryPerson/${id}`, { method: 'DELETE' })
    }
  },

  deliveryLogin: async (data) => {
    try {
      return await request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('deliveryLogin via gateway failed:', e)
      return request('https://localhost:7004/api/Auth/login', { method: 'POST', body: JSON.stringify(data) })
    }
  },
  updateDeliveryPersonAvailability: async (id, isAvailable) => {
    try {
      return await request(`/api/deliveryperson/${id}/availability`, { method: 'PATCH', body: JSON.stringify(isAvailable) })
    } catch (e) {
      console.warn('updateDeliveryPersonAvailability via gateway failed:', e)
      return request(`https://localhost:7004/api/DeliveryPerson/${id}/availability`, { method: 'PATCH', body: JSON.stringify(isAvailable) })
    }
  },
  updateDeliveryPersonLocation: async (id, location) => {
    try {
      return await request(`/api/deliveryperson/${id}/location`, { method: 'PATCH', body: JSON.stringify(location) })
    } catch (e) {
      console.warn('updateDeliveryPersonLocation via gateway failed:', e)
      return request(`https://localhost:7004/api/DeliveryPerson/${id}/location`, { method: 'PATCH', body: JSON.stringify(location) })
    }
  },
  getDeliveryPersonStats: async (id) => {
    try {
      return await request(`/api/deliveryperson/${id}/stats`)
    } catch (e) {
      console.warn('getDeliveryPersonStats via gateway failed:', e)
      return request(`https://localhost:7004/api/DeliveryPerson/${id}/stats`)
    }
  },
  getDeliveryPersonShiftStatus: async (id) => {
    try {
      return await request(`/api/deliveryperson/${id}/shift/status`)
    } catch (e) {
      return request(`https://localhost:7004/api/DeliveryPerson/${id}/shift/status`)
    }
  },
  startDeliveryPersonShift: async (id) => {
    try {
      return await request(`/api/deliveryperson/${id}/shift/start`, { method: 'POST' })
    } catch (e) {
      return request(`https://localhost:7004/api/DeliveryPerson/${id}/shift/start`, { method: 'POST' })
    }
  },
  endDeliveryPersonShift: async (id) => {
    try {
      return await request(`/api/deliveryperson/${id}/shift/end`, { method: 'POST' })
    } catch (e) {
      return request(`https://localhost:7004/api/DeliveryPerson/${id}/shift/end`, { method: 'POST' })
    }
  },
  toggleDeliveryPersonBreak: async (id) => {
    try {
      return await request(`/api/deliveryperson/${id}/shift/break`, { method: 'POST' })
    } catch (e) {
      return request(`https://localhost:7004/api/DeliveryPerson/${id}/shift/break`, { method: 'POST' })
    }
  },
  updateDeliveryPerson: async (id, data) => {
    try {
      return await request(`/api/deliveryperson/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('updateDeliveryPerson via gateway failed:', e)
      return request(`https://localhost:7004/api/DeliveryPerson/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }
  },
  raiseEmergencyAlert: async (deliveryPersonId, payload) => {
    try {
      return await request(`/api/deliveryperson/${deliveryPersonId}/emergency`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (e) {
      console.warn('raiseEmergencyAlert via gateway failed:', e)
      return request(`https://localhost:7004/api/DeliveryPerson/${deliveryPersonId}/emergency`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
  },
  getEmergencyAlerts: async (deliveryPersonId) => {
    try {
      return await request(`/api/deliveryperson/${deliveryPersonId}/emergency`)
    } catch (e) {
      return request(`https://localhost:7004/api/DeliveryPerson/${deliveryPersonId}/emergency`)
    }
  },

  getPayments: async () => {
    const savedToken = localStorage.getItem('token')
    const authHeaders = savedToken ? { Authorization: `Bearer ${savedToken}` } : {}
    try {
      return await request('/api/payment')
    } catch (e) {
      console.warn('getPayments via gateway failed:', e)
      try {
        const url = 'https://localhost:7005/api/Payment'
        const headers = { 'Content-Type': 'application/json', ...authHeaders }
        const resp = await fetch(url, { headers })
        if (!resp.ok) throw new Error(`Direct PaymentService failed: ${resp.status}`)
        if (resp.status === 204) return null
        return resp.json()
      } catch (e2) {
        console.warn('Direct PaymentService fetch failed:', e2)
        throw e2
      }
    }
  },
  getPayment: (id) => request(`/api/payment/${id}`),
  processPayment: (data) => request('/api/payment/process', { method: 'POST', body: JSON.stringify(data) }),

  getCustomerAddresses: async (customerId) => {
    try {
      return await request(`/api/customeraddress/customer/${customerId}`)
    } catch (e) {
      console.warn('getCustomerAddresses via gateway failed:', e)
      return request(`https://localhost:7001/api/CustomerAddress/Customer/${customerId}`)
    }
  },
  getCustomerAddress: async (addressId) => {
    try {
      return await request(`/api/customeraddress/${addressId}`)
    } catch (e) {
      console.warn('getCustomerAddress via gateway failed:', e)
      return request(`https://localhost:7001/api/CustomerAddress/${addressId}`)
    }
  },
  createAddress: async (data) => {
    try {
      return await request('/api/customeraddress', { method: 'POST', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('createAddress via gateway failed:', e)
      return request('https://localhost:7001/api/CustomerAddress', { method: 'POST', body: JSON.stringify(data) })
    }
  },
  updateAddress: async (id, data) => {
    try {
      return await request(`/api/customeraddress/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('updateAddress via gateway failed:', e)
      return request(`https://localhost:7001/api/CustomerAddress/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }
  },
  deleteAddress: async (id) => {
    try {
      return await request(`/api/customeraddress/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.warn('deleteAddress via gateway failed:', e)
      return request(`https://localhost:7001/api/CustomerAddress/${id}`, { method: 'DELETE' })
    }
  },

  getAdminDashboardStats: async () => {
    try {
      return await request('/api/admin/dashboard/stats')
    } catch (e) {
      return null
    }
  },
  getAdminRestaurants: async () => {
    try {
      return await request('/api/admin/restaurants')
    } catch (e) {
      return request('/api/restaurant')
    }
  },
  getAdminRestaurant: async (id) => {
    try {
      return await request(`/api/admin/restaurants/${id}`)
    } catch (e) {
      return request(`/api/restaurant/${id}`)
    }
  },
  createAdminRestaurant: async (data) => {
    try {
      return await request('/api/admin/restaurants', { method: 'POST', body: JSON.stringify(data) })
    } catch (e) {
      return request('/api/restaurant', { method: 'POST', body: JSON.stringify(data) })
    }
  },
  updateAdminRestaurant: async (id, data) => {
    try {
      return await request(`/api/admin/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    } catch (e) {
      return request(`/api/restaurant/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }
  },
  toggleRestaurantStatus: async (id) => {
    try {
      return await request(`/api/admin/restaurants/${id}/toggle-status`, { method: 'PATCH' })
    } catch (e) {
      return request(`/api/restaurant/${id}`, { method: 'DELETE' })
    }
  },
  updateRestaurantActiveStatus: async (id, isActive) => {
    try {
      return await request(`/api/restaurant/${id}/activate`, { 
        method: 'PATCH', 
        body: JSON.stringify(isActive),
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (e) {
      console.warn('updateRestaurantActiveStatus via gateway failed:', e)
      return request(`https://localhost:7003/api/Restaurant/${id}/activate`, { 
        method: 'PATCH', 
        body: JSON.stringify(isActive),
        headers: { 'Content-Type': 'application/json' }
      })
    }
  },
  deleteAdminRestaurant: async (id) => {
    try {
      return await request(`/api/admin/restaurants/${id}`, { method: 'DELETE' })
    } catch (e) {
      return request(`/api/restaurant/${id}`, { method: 'DELETE' })
    }
  },
  getAdminUsers: async () => {
    try {
      return await request('/api/admin/users')
    } catch (e) {
      return request('/api/customer')
    }
  },
  toggleUserStatus: async (id) => {
    try {
      return await request(`/api/admin/users/${id}/toggle-status`, { method: 'PATCH' })
    } catch (e) {
      throw e
    }
  },

  refundOrder: async (orderId) => {
    try {
      return await request(`/api/order/${orderId}/cancel`, { method: 'POST' })
    } catch (e) {
      console.warn('Cancel order via gateway failed:', e)
      return request(`https://localhost:7003/api/Order/${orderId}/cancel`, { method: 'POST' })
    }
  },

  confirmCashPayment: async (deliveryId) => {
    try {
      return await request(`/api/delivery/${deliveryId}/confirmpayment`, { method: 'POST' })
    } catch (e) {
      console.warn('Confirm payment via gateway failed:', e)
      return request(`https://localhost:7004/api/Delivery/${deliveryId}/ConfirmPayment`, { method: 'POST' })
    }
  },
}

export default api