import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2,
  Package,
  Mail,
  AlertCircle,
  Star,
  ThumbsUp
} from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'
import { useAuth } from '../context/AuthContext'

const CustomerDeliveryVerify = () => {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const deliveryId = searchParams.get('deliveryId')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    loadOrderData()
  }, [orderId])

  const loadOrderData = async () => {
    try {
      setLoading(true)
      const orderData = await api.getOrder(orderId)
      setOrder(orderData)
    } catch (e) {
      toast.error(e.message || 'Failed to load order data')
      console.error('Failed to load order data:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last character
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`customer-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`customer-otp-${index - 1}`)
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
      
      // Verify OTP
      const verifyDeliveryId = deliveryId || order?.deliveryId
      if (!verifyDeliveryId) {
        throw new Error('Delivery ID not found')
      }
      
      await api.verifyDeliveryOtp(verifyDeliveryId, otpString)
      
      toast.success('Delivery verified successfully! 🎉')
      setVerified(true)
      
      // Reload order to get updated status
      setTimeout(() => {
        loadOrderData()
      }, 1000)
    } catch (e) {
      toast.error(e.message || 'Invalid OTP. Please check your email and try again.')
      console.error('Failed to verify OTP:', e)
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', ''])
      document.getElementById('customer-otp-0')?.focus()
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
      document.getElementById('customer-otp-5')?.focus()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-green-100 border-t-green-600 mx-auto mb-4"
          />
          <p className="text-slate-600 font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="size-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30"
          >
            <CheckCircle2 className="text-white" size={64} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-black text-slate-900 mb-4"
          >
            Delivery Confirmed! 🎉
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-600 font-medium mb-8"
          >
            Thank you for verifying your delivery. We hope you enjoy your meal!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 mb-8"
          >
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Order ID</p>
            <p className="text-3xl font-black text-slate-900">#{orderId}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/30 transition-all"
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-slate-100 text-slate-700 py-5 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
            >
              Back to Home
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-8 border-t border-slate-200"
          >
            <p className="text-sm text-slate-500 font-medium mb-4">How was your delivery experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-2 hover:scale-110 transition-transform"
                >
                  <Star className="text-amber-400 hover:text-amber-500" size={32} fill="#fbbf24" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">Verify Delivery</h1>
              <p className="text-xs text-slate-500 font-medium">Order #{orderId}</p>
            </div>
          </div>
          <ShieldCheck className="text-green-600" size={32} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Package className="text-white" size={32} />
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Your Order</p>
              <p className="text-3xl font-black">#{orderId}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-lg font-bold">🎉 Your order has arrived!</p>
            <p className="text-sm opacity-90 mt-1">Verify your delivery by entering the OTP sent to your email</p>
          </div>
        </motion.div>

        {/* OTP Entry Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200"
        >
          <div className="text-center mb-8">
            <div className="size-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Mail className="text-green-600" size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Enter OTP</h2>
            <p className="text-slate-600 font-medium">
              Check your email for the 6-digit verification code
              <br />
              <span className="text-sm text-slate-500">({user?.email || 'your registered email'})</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`customer-otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-16 text-center text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-600 focus:bg-white focus:outline-none transition-all"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyOtp}
            disabled={verifying || otp.join('').length !== 6}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                Verify Delivery
              </>
            )}
          </button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 rounded-3xl p-6 border border-blue-200"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="text-blue-600 size-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-blue-900 mb-2">Important Information</h3>
              <ul className="text-sm text-blue-800 space-y-1 font-medium">
                <li>• OTP is sent to your registered email address</li>
                <li>• Check your spam folder if you don't see the email</li>
                <li>• OTP is valid for 10 minutes only</li>
                <li>• Only enter OTP after receiving your order from delivery person</li>
                <li>• This verification helps ensure secure delivery</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Didn't receive OTP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-slate-600 font-medium mb-4">Didn't receive the OTP?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={loadOrderData}
              className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-slate-300 hover:shadow-lg transition-all"
            >
              Check Email Again
            </button>
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              Back to Order
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default CustomerDeliveryVerify
