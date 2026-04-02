import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, CheckCircle, Shield } from 'lucide-react'
import { api } from '../api/client'

const VerifyOtp = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email
  const authScope = location.state?.authScope
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password')
    }
  }, [email, navigate])

  const handleChange = (index, value) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await api.verifyPasswordOtp({
        email,
        otp: otpString,
        authScope
      })
      
      if (response?.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/reset-password', { state: { email, otp: otpString, authScope: response.authScope || authScope } })
        }, 1500)
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/60"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 mb-4">
            <Shield className="size-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Verify OTP
          </h1>
          <p className="text-black/60 text-base">Enter the 6-digit code sent to</p>
          <p className="text-rose-600 font-semibold">{email}</p>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle className="size-5" />
            OTP verified successfully! Redirecting...
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-rose-400 focus:bg-white outline-none transition-all"
              />
            ))}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading} 
            className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              'Verify OTP'
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            to="/forgot-password" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 font-semibold transition"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyOtp
