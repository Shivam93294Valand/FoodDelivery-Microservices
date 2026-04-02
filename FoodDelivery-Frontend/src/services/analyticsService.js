import axios from 'axios'

const ORDER_SERVICE_URL = import.meta.env.VITE_ORDER_SERVICE_URL || 'https://localhost:7003'
const RESTAURANT_SERVICE_URL = import.meta.env.VITE_RESTAURANT_SERVICE_URL || 'https://localhost:7001'
const DELIVERY_SERVICE_URL = import.meta.env.VITE_DELIVERY_SERVICE_URL || 'https://localhost:7004'
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'https://localhost:7005'

const HTTPS_TO_HTTP_PORTS = {
    7001: 5001,
    7003: 5003,
    7004: 5004,
    7005: 5005
}

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

const requestWithFallback = async (url, options) => {
    try {
        return await axios.get(url, options)
    } catch (error) {
        const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network'))
        if (isNetworkError) {
            const fallbackUrl = getHttpFallbackUrl(url)
            if (fallbackUrl) {
                return axios.get(fallbackUrl, options)
            }
        }
        throw error
    }
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export const analyticsService = {

    async getOrderStats(period = 'month', year = new Date().getFullYear()) {
        try {
            const response = await requestWithFallback(
                `${ORDER_SERVICE_URL}/api/Analytics/Orders`,
                {
                    params: { period, year },
                    headers: getAuthHeaders()
                }
            )
            const data = response.data
            
            // Backend now returns an array of OrderStatsDto objects
            if (Array.isArray(data)) {
                return data.map(item => ({
                    month: item.period || item.Period || item.month,
                    orderCount: item.count || item.Count || 0,
                    totalRevenue: item.totalRevenue || item.TotalRevenue || 0
                }))
            }

            // Legacy support for old Dictionary format
            if (data && typeof data === 'object') {
                return Object.entries(data).map(([key, value]) => ({
                    month: key,
                    orderCount: Number(value) || 0,
                    totalRevenue: 0
                }))
            }

            return []
        } catch (error) {
            console.error('Failed to fetch order stats:', error)
            return []
        }
    },

    async getTopCustomers(count = 5) {
        try {
            const response = await requestWithFallback(
                `${ORDER_SERVICE_URL}/api/Analytics/TopCustomers`,
                {
                    params: { count },
                    headers: getAuthHeaders()
                }
            )
            const data = Array.isArray(response.data) ? response.data : []
            return data.map(item => ({
                customerName: item.customerName || item.CustomerName || `Customer #${item.customerId || item.CustomerId || ''}`,
                totalSpent: item.totalSpent || item.TotalSpent || 0,
                orderCount: item.orderCount || item.OrderCount || 0,
                customerId: item.customerId || item.CustomerId
            }))
        } catch (error) {
            console.error('Failed to fetch top customers:', error)
            return []
        }
    },

    async getFrequentItems(count = 5) {
        try {
            const response = await requestWithFallback(
                `${ORDER_SERVICE_URL}/api/Analytics/FrequentItems`,
                {
                    params: { count },
                    headers: getAuthHeaders()
                }
            )
            const data = Array.isArray(response.data) ? response.data : []
            return data.map(item => ({
                itemName: item.itemName || item.ItemName || item.menuItemName || item.MenuItemName || 'Item',
                orderCount: item.orderCount || item.count || item.Count || 0,
                menuItemId: item.menuItemId || item.MenuItemId
            }))
        } catch (error) {
            console.error('Failed to fetch frequent items:', error)
            return []
        }
    },

    async getDailyStats() {
        try {
            const response = await requestWithFallback(
                `${ORDER_SERVICE_URL}/api/Analytics/DailyStats`,
                { headers: getAuthHeaders() }
            )
            const data = response.data || {}
            return {
                orderCount: data.orderCount || data.totalOrders || data.TotalOrders || 0,
                totalRevenue: data.totalRevenue || data.TotalRevenue || 0
            }
        } catch (error) {
            console.error('Failed to fetch daily stats:', error)
            return { orderCount: 0, totalRevenue: 0 }
        }
    },

    async getRestaurantStats() {
        try {
            const response = await requestWithFallback(
                `${RESTAURANT_SERVICE_URL}/api/Analytics/Stats`,
                { headers: getAuthHeaders() }
            )
            return response.data
        } catch (error) {
            console.error('Failed to fetch restaurant stats:', error)
            return null
        }
    },

    async getDeliveryPersonStats(deliveryPersonId, period = 'all') {
        try {
            const response = await requestWithFallback(
                `${DELIVERY_SERVICE_URL}/api/DeliveryPerson/${deliveryPersonId}/stats`,
                {
                    params: { period },
                    headers: getAuthHeaders()
                }
            )
            return response.data
        } catch (error) {
            console.error('Failed to fetch delivery person stats:', error)
            return null
        }
    },

    async getPaymentStats() {
        try {
            const response = await requestWithFallback(
                `${PAYMENT_SERVICE_URL}/api/Analytics/Stats`,
                { headers: getAuthHeaders() }
            )
            const data = response.data || {}
            const overview = data.overview || data.Overview || {}
            const today = data.today || data.Today || {}
            const thisMonth = data.thisMonth || data.ThisMonth || {}
            return {
                overview: {
                    totalRevenue: overview.totalRevenue || overview.TotalRevenue || 0,
                    totalPayments: overview.totalPayments || overview.TotalPayments || 0,
                    successRate: overview.successRate || overview.SuccessRate || 0
                },
                today: {
                    revenue: today.revenue || today.Revenue || 0,
                    transactions: today.transactions || today.Transactions || 0
                },
                thisMonth: {
                    revenue: thisMonth.revenue || thisMonth.Revenue || 0,
                    transactions: thisMonth.transactions || thisMonth.Transactions || 0
                },
                paymentMethods: data.paymentMethods || data.PaymentMethods || []
            }
        } catch (error) {
            console.error('Failed to fetch payment stats:', error)
            return {
                overview: { totalRevenue: 0, totalPayments: 0 },
                today: { revenue: 0, transactions: 0 },
                thisMonth: { revenue: 0, transactions: 0 }
            }
        }
    },

    async getRevenueStats(period = 'month', year = new Date().getFullYear()) {
        try {
            const response = await requestWithFallback(
                `${PAYMENT_SERVICE_URL}/api/Analytics/Revenue`,
                {
                    params: { period, year },
                    headers: getAuthHeaders()
                }
            )
            return response.data
        } catch (error) {
            console.error('Failed to fetch revenue stats:', error)
            return {}
        }
    },

    async getTopSpenders(count = 10) {
        try {
            const response = await requestWithFallback(
                `${PAYMENT_SERVICE_URL}/api/Analytics/TopSpenders`,
                {
                    params: { count },
                    headers: getAuthHeaders()
                }
            )
            return response.data
        } catch (error) {
            console.error('Failed to fetch top spenders:', error)
            return []
        }
    }
}
