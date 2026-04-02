export const normalizeOrderStatus = (value) => {
  const raw = (value ?? '').toString().trim()
  if (!raw) return 'Pending'

  const normalized = raw.toLowerCase().replace(/[\s_-]+/g, '')

  const statusMap = {
    pending: 'Pending',
    panding: 'Pending',
    process: 'Pending',
    processing: 'Pending',
    confirmed: 'Confirmed',
    confirm: 'Confirmed',
    assigned: 'Confirmed',
    preparing: 'Preparing',
    readyforpickup: 'Preparing',
    pickedup: 'OutForDelivery',
    intransit: 'OutForDelivery',
    outfordelivery: 'OutForDelivery',
    delivered: 'Delivered',
    completed: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled'
  }

  return statusMap[normalized] || 'Pending'
}

export const toAmount = (...values) => {
  for (const value of values) {
    const numeric = Number(value)
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      return numeric
    }
  }
  return 0
}

export const formatDeliveryAddress = (address) => {
  if (!address || typeof address !== 'object') return ''

  const line1 = address.addressLine1 ?? address.AddressLine1 ?? ''
  const line2 = address.addressLine2 ?? address.AddressLine2 ?? ''
  const city = address.city ?? address.City ?? ''
  const state = address.state ?? address.State ?? ''
  const postalCode = address.postalCode ?? address.PostalCode ?? ''
  const country = address.country ?? address.Country ?? ''

  const parts = [line1, line2, city, state, postalCode, country]
    .map((part) => (part ?? '').toString().trim())
    .filter(Boolean)

  return parts.join(', ')
}