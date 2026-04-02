import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { api } from '../api/client'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.forgotPassword({ email })
      
      if (response?.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/verify-otp', { state: { email, authScope: response.authScope } })
        }, 1500)
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
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
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Forgot Password
          </h1>
          <p className="text-black/60 text-base">Enter your email to receive an OTP</p>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle className="size-5" />
            OTP sent successfully! Redirecting...
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-rose-400 focus:bg-white outline-none transition-all" 
                placeholder="name@example.com" 
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            </div>
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
              'Send OTP'
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 font-semibold transition"
          >
            <ArrowLeft className="size-4" />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
