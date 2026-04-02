import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, CheckCircle, Download } from 'lucide-react'
import { api } from '../api/client'
import OrderCard from '../components/OrderCard'
import { generateAllOrdersPDF } from '../utils/pdfExport'
import { toast } from '../components/ToastContainer'
import { normalizeOrderStatus } from '../utils/orderHelpers'

const Orders = () => {
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    api.getOrders()
      .then((data) => {
        if (!mounted) return
        const orderList = (Array.isArray(data) ? data : []).filter((order) => {
          const status = normalizeOrderStatus(order?.orderStatus ?? order?.OrderStatus ?? order?.status)
          return status !== 'Cancelled'
        })
        if (location.state?.newOrder) {
          const merged = [location.state.newOrder, ...orderList]
          const filtered = merged.filter((order) => {
            const status = normalizeOrderStatus(order?.orderStatus ?? order?.OrderStatus ?? order?.status)
            return status !== 'Cancelled'
          })
          setOrders(filtered)
        } else {
          setOrders(orderList)
        }
      })
      .catch((e) => {
        if (!mounted) return
        setError(e.message || 'Failed to load orders')
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [location.state])

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent mb-2">
              Your Orders
            </h1>
            <p className="text-gray-600">Track and manage all your orders</p>
          </div>
          
          {orders.length > 0 && (
            <button
              onClick={() => {
                try {
                  generateAllOrdersPDF(orders)
                  toast.success('Generating PDF...')
                } catch (e) {
                  toast.error('Failed to generate PDF')
                }
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Download className="size-5" />
              Export All Orders
            </button>
          )}
        </motion.div>

        <AnimatePresence>
          {location.state?.newOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="size-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Order Placed Successfully!</h3>
                  <p className="text-sm text-green-700">We'll notify you about the status updates.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6"
          >
            <p className="text-red-800 font-medium">{error}</p>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl h-64 shadow-md animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-16 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <Package className="size-20 text-gray-300 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h2>
            <p className="text-gray-600">Start ordering from your favorite restaurants!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.orderId || order.OrderId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders