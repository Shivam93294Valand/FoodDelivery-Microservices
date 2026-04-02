import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2,
  Package,
  Phone,
  Mail,
  AlertCircle,
  RefreshCcw
} from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'
import { useAuth } from '../context/AuthContext'

const DeliveryOtpVerify = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [delivery, setDelivery] = useState(null)
  const [order, setOrder] = useState(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)

  useEffect(() => {
    loadDeliveryData()
    // Auto-send OTP when page loads
    sendOtpToCustomer()
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

  const sendOtpToCustomer = async () => {
    try {
      setSendingOtp(true)
      await api.sendDeliveryOtp(id)
      toast.success('OTP sent to customer')
    } catch (e) {
      toast.error(e.message || 'Failed to send OTP. Customer may have already received it.')
      console.error('Failed to send OTP:', e)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last character
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete 6-digit OTP')
      return
    }

    try {
      setVerifying(true)
      await api.verifyDeliveryOtp(id, otpString)
      await api.updateDeliveryStatus(id, 'Delivered')
      
      toast.success('Delivery verified successfully! 🎉')
      
      // Trigger event for customer's track order page
      window.dispatchEvent(new CustomEvent('deliveryStatusUpdate', { 
        detail: { deliveryId: id, status: 'Delivered', orderId: delivery.orderId }
      }))

      // Navigate to success screen directly without alert blocking
      setTimeout(() => {
        navigate('/delivery-person-dashboard')
      }, 2000)
    } catch (e) {
      toast.error(e.message || 'Invalid OTP. Please check and try again.')
      console.error('Failed to verify OTP:', e)
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally {
      setVerifying(false)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').trim()
    
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split('')
      setOtp(newOtp)
      document.getElementById('otp-5')?.focus()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">Verify Delivery</h1>
              <p className="text-xs text-slate-500 font-medium">Delivery #{id}</p>
            </div>
          </div>
          <ShieldCheck className="text-blue-600" size={32} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white shadow-2xl"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-indigo-700/30 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Package className="text-white" size={26} />
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Delivery ID</p>
              <p className="text-xl font-black">#{id}</p>
            </div>
          </div>
          {order && (
            <div className="space-y-2 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-sm opacity-90">Customer: <strong>{order.customerName || 'Customer'}</strong></p>
              <p className="text-sm opacity-90">Order: <strong>#{order.orderId}</strong></p>
            </div>
          )}
        </motion.div>

        {/* OTP Verification Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Enter OTP</h2>
            <p className="text-slate-600 font-medium">
              OTP has been sent to customer's email.
              <br />
              Ask the customer for the 6-digit code.
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <motion.input
                whileFocus={{ scale: 1.05 }}
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-14 h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none ${
                    digit 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md ring-2 ring-indigo-500/20' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20'
                  }`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerifyOtp}
            disabled={verifying || otp.join('').length !== 6}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {verifying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 rounded-full border-3 border-white/30 border-t-white"
                />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 size={24} />
                Verify & Complete Delivery
              </>
            )}
          </motion.button>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <button
              onClick={sendOtpToCustomer}
              disabled={sendingOtp}
              className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <RefreshCcw size={16} className={sendingOtp ? 'animate-spin' : ''} />
              {sendingOtp ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-50 rounded-2xl p-5 border border-amber-200"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="text-amber-600 size-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-amber-900 mb-2">Important Instructions</h3>
              <ul className="text-sm text-amber-800 space-y-1 font-medium">
                <li>• OTP is sent to customer's registered email via RabbitMQ</li>
                <li>• OTP is valid for 10 minutes only</li>
                <li>• Ask the customer to check their email inbox/spam folder</li>
                <li>• Ensure the customer receives the order before entering OTP</li>
                <li>• After verification, delivery status will automatically update to "Delivered"</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Contact Customer */}
        {order?.customerPhone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200"
          >
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="text-green-600" size={20} />
              Need to contact customer?
            </h3>
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all"
            >
              <Phone size={20} />
              Call {order.customerPhone}
            </a>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default DeliveryOtpVerify
