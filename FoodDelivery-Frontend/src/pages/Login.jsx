import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { LocalPizza, LocalShipping, CreditCard } from '@mui/icons-material' 

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message)
      const t = setTimeout(() => setSuccess(''), 2500)
      return () => clearTimeout(t)
    }
  }, [location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/')
    } catch (e) {
      setError(e.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Hero Side */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative hidden lg:block rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 p-10"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1400&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
          <div className="relative z-10 text-white">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6"
            >
              <Sparkles className="size-4" />
              Welcome Back!
            </motion.div>
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">Sign in to<br />your account</h2>
            <p className="text-white/90 text-lg mb-8 leading-relaxed">Access your orders, track deliveries in real-time, and discover new restaurants in your area.</p>
            
            <div className="space-y-4">
              {[
                { icon: <LocalPizza sx={{ fontSize: 20, color: 'white' }} />, text: 'Order from 500+ restaurants' },
                { icon: <LocalShipping sx={{ fontSize: 20, color: 'white' }} />, text: 'Track delivery in real-time' },
                { icon: <CreditCard sx={{ fontSize: 20, color: 'white' }} />, text: 'Secure & fast payments' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Form Side */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/60"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-2">
              Sign In
            </h1>
            <p className="text-black/60 text-base">Continue your delicious journey</p>
          </div>

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle className="size-5" />
              {success}
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
                  value={formData.email} 
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-rose-400 focus:bg-white outline-none transition-all" 
                  placeholder="name@example.com" 
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={formData.password} 
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} 
                  className="w-full pl-11 pr-14 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-rose-400 focus:bg-white outline-none transition-all" 
                  placeholder="Enter your password" 
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

            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                <span className="text-gray-600 group-hover:text-gray-900">Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-rose-600 hover:text-rose-700 transition">Forgot password?</Link>
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
                <>
                  Sign In
                  <ArrowRight className="size-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to Food Delivery?</span>
              </div>
            </div>
            <Link 
              to="/register" 
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 font-semibold text-gray-700 hover:text-rose-700 transition-all"
            >
              Create an account
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login