import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Clock, Package, CreditCard, ChefHat, Bike, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'
import { generateOrderPDF } from '../utils/pdfExport'
import { useAuth } from '../context/AuthContext'
import { normalizeOrderStatus, toAmount, formatDeliveryAddress } from '../utils/orderHelpers'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!id) {
      setError('Invalid order id')
      setLoading(false)
      return
    }

    api.getOrder(id)
      .then(async (data) => {
        if (!mounted) return
        const deliveryAddress = data?.deliveryAddress ?? data?.DeliveryAddress
        const deliveryAddressId = data?.deliveryAddressId ?? data?.DeliveryAddressId

        if (deliveryAddress || !deliveryAddressId) {
          setOrder(data)
        } else {
          try {
            const addressDetails = await api.getCustomerAddress(deliveryAddressId)
            const formattedAddress = formatDeliveryAddress(addressDetails)
            setOrder({
              ...data,
              deliveryAddress: formattedAddress || deliveryAddress,
              DeliveryAddress: formattedAddress || deliveryAddress
            })
          } catch {
            setOrder(data)
          }
        }
        // Clear any existing "not found" flag when order loads
        try {
          sessionStorage.removeItem('orderNotFound')
          window.dispatchEvent(new CustomEvent('orderNotFoundUpdate'))
        } catch (err) {
          /* ignore */
        }
      })
      .catch((e) => {
        if (!mounted) return
        const msg = e.message || 'Failed to load order'
        setError(msg)
        toast.error(msg)
        // If the server returns a "Not Found" message, set a flag so the Header can show an indicator
        if (/not\s*found/i.test(msg)) {
          try {
            sessionStorage.setItem('orderNotFound', String(id))
            window.dispatchEvent(new CustomEvent('orderNotFoundUpdate', { detail: { id } }))
          } catch (err) {
            /* ignore */
          }
        }
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [id])

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    setCancelling(true)
    try {
      const result = await api.refundOrder(id)
      toast.success('Order cancelled successfully!')
      if (result?.refundStatus === 'Refunded') {
        toast.success('Refund has been initiated')
      }
      // Reload order to get updated status
      const updatedOrder = await api.getOrder(id)
      setOrder(updatedOrder)
    } catch (e) {
      console.error('Failed to cancel order:', e)
      toast.error(e.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      'Pending': { color: 'bg-yellow-500', icon: Clock, text: 'Pending' },
      'Confirmed': { color: 'bg-blue-500', icon: CheckCircle2, text: 'Confirmed' },
      'Preparing': { color: 'bg-purple-500', icon: ChefHat, text: 'Preparing' },
      'OutForDelivery': { color: 'bg-indigo-500', icon: Bike, text: 'Out for Delivery' },
      'Delivered': { color: 'bg-green-500', icon: CheckCircle2, text: 'Delivered' },
      'Cancelled': { color: 'bg-red-500', icon: XCircle, text: 'Cancelled' },
    }
    return statusMap[status] || { color: 'bg-gray-500', icon: AlertCircle, text: status }
  }

  const getPaymentStatusColor = (status) => {
    const statusMap = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Failed': 'bg-red-100 text-red-800 border-red-200',
      'Refunded': 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="size-16 rounded-full border-4 border-rose-500/20 border-t-rose-500"
        />
      </div>
    )
  }

  if (error || !order) {
    const isNotFound = /not\s*found|404/i.test(error || '')
    const isUnauthorized = /unauthorized|403|invalid.*order/i.test(error || '')
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="size-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="size-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {isNotFound || isUnauthorized ? 'Order Not Found' : 'Unable to Load Order'}
            </h1>
            <p className="text-gray-600 mb-8">
              {isNotFound 
                ? 'This order does not exist or you do not have permission to view it. Please check the order ID and try again.'
                : isUnauthorized
                ? 'You do not have permission to view this order. Please make sure you are viewing your own orders.'
                : error || 'This order may not exist or has been removed.'}
            </p>
            <button
              onClick={() => {
                try { sessionStorage.removeItem('orderNotFound'); window.dispatchEvent(new CustomEvent('orderNotFoundUpdate')); } catch (err) {}
                navigate('/orders')
              }}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Back to Orders
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  const items = order.orderItems ?? order.OrderItems ?? []
  const orderStatus = normalizeOrderStatus(order.orderStatus ?? order.OrderStatus ?? order.status)
  const paymentStatus = order.paymentStatus ?? order.PaymentStatus ?? 'Pending'
  const paymentMethod = order.paymentMethod ?? order.PaymentMethod ?? 'Unknown'
  const subtotal = toAmount(
    order.subTotal,
    order.SubTotal,
    order.subtotal,
    order.Subtotal,
    items.reduce((sum, item) => sum + toAmount(item.totalPrice, item.TotalPrice), 0)
  )
  const deliveryFee = toAmount(order.deliveryCharge, order.DeliveryCharge, order.deliveryFee, order.DeliveryFee)
  const tax = toAmount(order.tax, order.Tax)
  const total = toAmount(order.totalAmount, order.TotalAmount, subtotal + deliveryFee + tax)
  const addressText = (
    order.deliveryAddress
    || order.DeliveryAddress
    || formatDeliveryAddress(order.address)
    || formatDeliveryAddress(order.Address)
  )
  const statusInfo = getStatusInfo(orderStatus)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group"
          >
            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Orders</span>
          </button>
          
          <button
            onClick={() => generateOrderPDF(order)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl"
          >
            <Download className="size-5" />
            Export PDF
          </button>
        </motion.div>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 rounded-3xl shadow-2xl p-8 mb-6 text-white"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Order Number</p>
              <h1 className="text-4xl font-bold mb-3">#{order.orderId ?? order.OrderId}</h1>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                <Package className="size-4" />
                <span className="text-sm font-medium">{order.restaurantName || order.RestaurantName || 'Restaurant'}</span>
              </div>
            </div>
            <div className={`${statusInfo.color} px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg`}>
              <StatusIcon className="size-5" />
              <span className="font-bold text-white">{statusInfo.text}</span>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="grid grid-cols-4 gap-2">
              {['Pending', 'Confirmed', 'Preparing', 'OutForDelivery'].map((status, idx) => {
                const statusNames = ['Pending', 'Confirmed', 'Preparing', 'OutForDelivery', 'Delivered']
                const currentIdx = statusNames.indexOf(orderStatus)
                const isActive = idx <= currentIdx
                return (
                  <div key={status} className="text-center">
                    <div className={`size-8 mx-auto rounded-full flex items-center justify-center mb-2 ${isActive ? 'bg-white text-orange-500' : 'bg-white/20'}`}>
                      {isActive && <CheckCircle2 className="size-4" />}
                    </div>
                    <p className="text-xs text-white/80">{status.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <Package className="size-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
            </div>
            
            <div className="space-y-4">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <motion.div
                    key={item.orderItemId ?? item.OrderItemId ?? index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-lg bg-white flex items-center justify-center text-2xl shadow-sm">
                        🍽️
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.itemName || item.ItemName}</h3>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity ?? item.Quantity} × ${(item.unitPrice ?? item.UnitPrice)?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                      ${(item.totalPrice ?? item.TotalPrice)?.toFixed(2) || '0.00'}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No items in this order</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-300">
                <span>Total</span>
                <span className="bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Order Details Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <MapPin className="size-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Delivery Address</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {addressText || 'No address provided'}
              </p>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <CreditCard className="size-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Payment</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Method</span>
                  <span className="font-semibold text-gray-900 capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getPaymentStatusColor(paymentStatus)}`}>
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Time */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Clock className="size-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Order Time</h3>
              </div>
              <p className="text-gray-700">
                {order.createdAt || order.CreatedAt || order.orderDate || order.OrderDate
                  ? new Date(order.createdAt || order.CreatedAt || order.orderDate || order.OrderDate).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </motion.div>
        </div>

        {user?.role === 'Customer' && orderStatus !== 'Delivered' && orderStatus !== 'Cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="w-full px-4 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="size-5 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="size-5" />
                  Cancel Order
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default OrderDetail