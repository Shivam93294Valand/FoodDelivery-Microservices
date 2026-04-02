import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  Phone,
  ArrowLeft,
  Calendar,
  User,
  Store,
  Navigation,
  AlertCircle
} from 'lucide-react'
import { toast } from '../components/ToastContainer'
import { normalizeOrderStatus } from '../utils/orderHelpers'

const TrackOrder = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = searchParams.get('orderId')
    if (id) {
      setOrderId(id)
      handleTrackOrder(id)
    }
  }, [searchParams])

  const handleTrackOrder = async (id = orderId) => {
    if (!id || id.trim() === '') {
      toast.error('Please enter an order ID')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const data = await api.getOrder(id)
      setOrder(data)
      setSearchParams({ orderId: id })
    } catch (e) {
      setError(e.message || 'Order not found')
      toast.error('Could not find order. Please check the order ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    handleTrackOrder()
  }

  const getStatusSteps = () => {
    const status = normalizeOrderStatus(order?.orderStatus || order?.OrderStatus || order?.status || order?.Status).toLowerCase()
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: Clock },
      { key: 'outfordelivery', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ]

    const statusMap = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      outfordelivery: 3,
      delivered: 4,
      cancelled: 0
    }

    const currentStep = statusMap[status] ?? 0

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStep,
      active: index === currentStep
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-20">
      {/* Header */}
      <div className="border-b border-slate-200/60 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Track Your Order</h1>
              <p className="text-xs text-slate-500">Real-time order tracking</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Search className="size-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Find Your Order</h2>
              <p className="text-sm text-slate-500">Enter your order ID to track</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g., 123)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="size-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="size-5" />
                  Track Order
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center"
          >
            <div className="size-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-8 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-rose-900 mb-2">Order Not Found</h3>
            <p className="text-sm text-rose-600">{error}</p>
          </motion.div>
        )}

        {/* Order Details */}
        <AnimatePresence>
          {order && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Status Timeline */}
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-8">Order Status</h3>

                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(getStatusSteps().filter(s => s.completed).length - 1) * 33.33}%` }}
                      className="bg-green-500 w-full rounded-full"
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative space-y-8">
                    {getStatusSteps().map((step, index) => (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <div className={`relative z-10 size-12 rounded-2xl flex items-center justify-center transition-all ${
                          step.completed
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : step.active
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          <step.icon className="size-6" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          {step.active && (
                            <p className="text-xs text-blue-600 font-medium mt-1">In Progress...</p>
                          )}
                        </div>
                        {step.completed && (
                          <CheckCircle className="size-5 text-green-500" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Info */}
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <MapPin className="size-5 text-orange-600" />
                    </div>
                    <h4 className="font-bold text-slate-900">Delivery Address</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {order.deliveryAddress || order.DeliveryAddress || 'Address not available'}
                  </p>
                </div>

                {/* Restaurant Info */}
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Store className="size-5 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-slate-900">Restaurant</h4>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {order.restaurantName || order.RestaurantName || 'Restaurant'}
                  </p>
                </div>

                {/* Order Date */}
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Calendar className="size-5 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-slate-900">Order Date</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    {new Date(order.orderDate || order.OrderDate || Date.now()).toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Total Amount */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Package className="size-5 text-white" />
                    </div>
                    <h4 className="font-bold">Order Total</h4>
                  </div>
                  <p className="text-3xl font-black">
                    ${(order.totalAmount || order.TotalAmount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(`/orders/${order.orderId || order.OrderId}`)}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                  View Full Details
                  <ChevronRight className="size-5" />
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 py-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  All Orders
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!order && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="size-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Navigation className="size-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Start Tracking</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Enter your order ID above to see real-time tracking information and delivery status.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default TrackOrder
