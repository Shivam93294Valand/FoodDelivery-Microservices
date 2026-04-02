import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { api } from '../api/client'

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email
  const otp = location.state?.otp
  const authScope = location.state?.authScope
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password')
    }
  }, [email, otp, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await api.resetPassword({
        email,
        otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
        authScope
      })
      
      if (response?.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login', { state: { message: 'Password reset successfully! Please login with your new password.' } })
        }, 2000)
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
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
            Reset Password
          </h1>
          <p className="text-black/60 text-base">Enter your new password</p>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle className="size-5" />
            Password reset successfully! Redirecting to login...
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
            <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={formData.newPassword} 
                onChange={e => setFormData(prev => ({ ...prev, newPassword: e.target.value }))} 
                className="w-full pl-11 pr-14 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-rose-400 focus:bg-white outline-none transition-all" 
                placeholder="Enter new password" 
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                required 
                value={formData.confirmPassword} 
                onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} 
                className="w-full pl-11 pr-14 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-rose-400 focus:bg-white outline-none transition-all" 
                placeholder="Re-enter new password" 
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
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
              'Reset Password'
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

export default ResetPassword
