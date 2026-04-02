import { Link } from 'react-router-dom'
import { ArrowRight, Package, Store, Clock, CheckCircle2, XCircle, AlertCircle, Bike } from 'lucide-react'
import { motion } from 'framer-motion'
import { normalizeOrderStatus } from '../utils/orderHelpers'

const OrderCard = ({ order }) => {
  const orderId = order?.orderId ?? order?.OrderId
  const restaurantName = order?.restaurantName ?? order?.RestaurantName ?? 'Restaurant'
  const totalAmount = order?.totalAmount ?? order?.TotalAmount ?? 0
  const orderStatus = normalizeOrderStatus(order?.orderStatus ?? order?.OrderStatus ?? order?.status)
  const orderItems = order?.orderItems ?? order?.OrderItems ?? order?.items ?? []
  const backendItemCount = Number(order?.itemCount ?? order?.ItemCount)
  const calculatedItemCount = orderItems.reduce((sum, item) => {
    const quantity = item?.quantity ?? item?.Quantity ?? 1
    return sum + quantity
  }, 0)
  const itemCount = Number.isFinite(backendItemCount) && backendItemCount > 0
    ? backendItemCount
    : calculatedItemCount
  const createdAt = order?.createdAt ?? order?.CreatedAt

  const getStatusInfo = (status) => {
    const statusMap = {
      'Pending': { color: 'bg-yellow-500', icon: Clock, text: 'Pending', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
      'Confirmed': { color: 'bg-blue-500', icon: CheckCircle2, text: 'Confirmed', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
      'Preparing': { color: 'bg-purple-500', icon: Package, text: 'Preparing', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
      'OutForDelivery': { color: 'bg-indigo-500', icon: Bike, text: 'Out for Delivery', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
      'Delivered': { color: 'bg-green-500', icon: CheckCircle2, text: 'Delivered', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
      'Cancelled': { color: 'bg-red-500', icon: XCircle, text: 'Cancelled', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    }
    return statusMap[status] || { color: 'bg-gray-500', icon: AlertCircle, text: status, bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
  }

  const statusInfo = getStatusInfo(orderStatus)
  const StatusIcon = statusInfo.icon

  return (
    <Link to={`/orders/${orderId}`} className="block">
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all border border-gray-100 overflow-hidden h-full"
      >
        {/* Header */}
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Package className="size-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Order #{orderId}</p>
                <p className="text-sm font-bold text-gray-900">{restaurantName}</p>
              </div>
            </div>
            <div className={`${statusInfo.color} px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm`}>
              <StatusIcon className="size-3.5 text-white" />
              <span className="text-xs font-bold text-white">{statusInfo.text}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Store className="size-4" />
              <span className="text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            {createdAt && (
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="size-4" />
                <span className="text-xs">{new Date(createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          <motion.button
            whileHover={{ x: 5 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            View Details
            <ArrowRight className="size-4" />
          </motion.button>
        </div>
      </motion.div>
    </Link>
  )
}

export default OrderCard
