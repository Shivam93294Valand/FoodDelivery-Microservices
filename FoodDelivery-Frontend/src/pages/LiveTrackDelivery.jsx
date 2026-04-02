import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Package, 
  CheckCircle2, 
  ArrowLeft, 
  Bike,
  Lock,
  Unlock,
  Navigation,
  Phone,
  Clock,
  AlertCircle,
  ShieldCheck
} from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'
import { useAuth } from '../context/AuthContext'

const LiveTrackDelivery = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [delivery, setDelivery] = useState(null)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [lastError, setLastError] = useState(null)

  const deliveryStates = [
    { key: 'Assigned', label: 'Order Assigned', icon: Package, description: 'Order assigned to you' },
    { key: 'PickedUp', label: 'Picked Up', icon: CheckCircle2, description: 'Picked up from restaurant' },
    { key: 'InTransit', label: 'In Transit', icon: Bike, description: 'On the way to customer' },
    { key: 'Delivered', label: 'Delivered', icon: ShieldCheck, description: 'Order delivered successfully' }
  ]

  useEffect(() => {
    loadDeliveryData()
  }, [id])

  const loadDeliveryData = async () => {
    try {
      setLoading(true)
      const deliveryData = await api.getDelivery(id)
      setDelivery(deliveryData)
      
      if (deliveryData.orderId) {
        try {
          const orderData = await api.getOrder(deliveryData.orderId)
          setOrder(orderData)
        } catch (e) {
          console.error('Failed to load order:', e)
        }
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load delivery data')
      console.error('Failed to load delivery data:', e)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStateIndex = () => {
    const currentState = delivery?.status || 'Assigned'
    return deliveryStates.findIndex(s => s.key === currentState)
  }

  const canMoveToNext = () => {
    const currentIndex = getCurrentStateIndex()
    return currentIndex < deliveryStates.length - 1
  }

  const handleNextStatus = async () => {
    const currentIndex = getCurrentStateIndex()
    if (currentIndex >= deliveryStates.length - 1) {
      toast.info('Delivery already completed')
      return
    }

    const nextState = deliveryStates[currentIndex + 1]
    
    // If moving to delivered, need OTP verification
    if (nextState.key === 'Delivered') {
      navigate(`/delivery-otp-verify/${id}`)
      return
    }

    try {
      setUpdating(true)
      setLastError(null) // Clear previous errors
      await api.updateDeliveryStatus(id, nextState.key)
      toast.success(`Status updated to ${nextState.label}`)
      await loadDeliveryData()
      
      // Trigger a custom event that the customer's track order page can listen to
      window.dispatchEvent(new CustomEvent('deliveryStatusUpdate', { 
        detail: { deliveryId: id, status: nextState.key, orderId: delivery.orderId }
      }))
    } catch (e) {
      console.error('Failed to update status:', e)
      setLastError(e.message)
      
      // Provide more helpful error messages
      if (e.message?.includes('sync order status')) {
        toast.error('Unable to sync with order system. Please ensure all services are running and try again.')
      } else if (e.message?.includes('transition from')) {
        toast.error('Invalid status transition. Please refresh and try again.')
      } else {
        toast.error(e.message || 'Failed to update status. Please check your connection.')
      }
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"
          />
          <p className="text-slate-600 font-semibold">Loading delivery details...</p>
        </div>
      </div>
    )
  }

  const currentIndex = getCurrentStateIndex()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">Live Track Delivery</h1>
              <p className="text-xs text-slate-500 font-medium">Delivery #{id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
            <div className="size-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-blue-600">Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Order Information */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200"
          >
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Package className="text-blue-600" />
              Order Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</p>
                <p className="text-lg font-black text-slate-900">#{order.orderId}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                <p className="text-lg font-black text-slate-900">{order.customerName || 'Customer'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Delivery Address</p>
                <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                  <MapPin className="text-blue-600 size-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {delivery?.deliveryAddress || order?.deliveryAddress || 'Address not available'}
                  </p>
                </div>
              </div>
              {order.customerPhone && (
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact</p>
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center gap-3 bg-green-50 rounded-xl p-4 hover:bg-green-100 transition-colors"
                  >
                    <Phone className="text-green-600 size-5 flex-shrink-0" />
                    <span className="text-sm font-bold text-green-700">{order.customerPhone}</span>
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Delivery Status Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200"
        >
          <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <Navigation className="text-blue-600" />
            Delivery Progress
          </h2>

          <div className="space-y-6">
            {deliveryStates.map((state, index) => {
              const isCompleted = index < currentIndex
              const isCurrent = index === currentIndex
              const isLocked = index > currentIndex

              return (
                <motion.div
                  key={state.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-start gap-6 ${
                    isLocked ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {/* Connector Line */}
                  {index < deliveryStates.length - 1 && (
                    <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-slate-200">
                      {(isCompleted || isCurrent) && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: isCompleted ? '100%' : '50%' }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-600 to-indigo-600"
                        />
                      )}
                    </div>
                  )}

                  {/* Status Icon */}
                  <div className={`relative z-10 size-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30' 
                      : isCurrent 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 animate-pulse'
                      : 'bg-slate-200'
                  }`}>
                    {isLocked ? (
                      <Lock className="text-slate-400" size={24} />
                    ) : (
                      <state.icon className="text-white" size={24} />
                    )}
                  </div>

                  {/* Status Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-black ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                      }`}>
                        {state.label}
                      </h3>
                      {isCompleted && (
                        <CheckCircle2 className="text-green-600" size={20} />
                      )}
                      {isCurrent && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                          Current
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isCurrent ? 'text-slate-700' : 'text-slate-500'
                    } font-medium`}>
                      {state.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Action Button */}
        {canMoveToNext() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200"
          >
            <button
              onClick={handleNextStatus}
              disabled={updating}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {updating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 rounded-full border-3 border-white/30 border-t-white"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <Unlock size={24} />
                  Move to Next: {deliveryStates[currentIndex + 1]?.label}
                </>
              )}
            </button>
            {deliveryStates[currentIndex + 1]?.key === 'Delivered' && (
              <div className="mt-4 flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
                <AlertCircle className="text-amber-600 size-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  <strong>Important:</strong> You'll need to verify the customer's OTP before marking as delivered.
                </p>
            
            {/* Error Display */}
            {lastError && (
              <div className="mt-4 flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-200">
                <AlertCircle className="text-red-600 size-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-bold mb-2">Error updating status:</p>
                  <p className="text-sm text-red-700 font-medium">{lastError}</p>
                  {lastError.includes('OrderService') && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                      <p className="text-xs font-bold text-slate-700 mb-2">Troubleshooting:</p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>• Check if OrderService is running (Port 7003)</li>
                        <li>• Verify network connectivity between services</li>
                        <li>• Check service configuration in appsettings.json</li>
                        <li>• Contact system administrator if issue persists</li>
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => setLastError(null)}
                    className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
              </div>
            )}
          </motion.div>
        )}

        {currentIndex === deliveryStates.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 shadow-xl text-white text-center"
          >
            <CheckCircle2 className="size-20 mx-auto mb-4" />
            <h3 className="text-3xl font-black mb-2">Delivery Completed!</h3>
            <p className="text-green-100 mb-6">Great job! The order has been delivered successfully.</p>
            <button
              onClick={() => navigate('/delivery-person-dashboard')}
              className="bg-white text-green-600 px-8 py-4 rounded-2xl font-black hover:shadow-2xl transition-all"
            >
              Back to Dashboard
            </button>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default LiveTrackDelivery
