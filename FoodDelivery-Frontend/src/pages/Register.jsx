import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader2, User, Mail, Lock, Phone, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate('/login', { state: { message: 'Registration successful! Please login.' } }), 1400)
      return () => clearTimeout(t)
    }
  }, [success, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(formData)
      setSuccess('Account created successfully! Redirecting to login...')
    } catch (e) {
      setError(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const isValid = formData.firstName && formData.lastName && formData.email && formData.password

  return (
    <div className="min-h-[calc(100vh-80px)] grid place-items-center p-6 bg-[radial-gradient(60%_50%_at_10%_10%,rgba(255,240,230,0.4),transparent),radial-gradient(40%_40%_at_90%_80%,rgba(255,235,205,0.3),transparent)]">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Hero Side */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative hidden lg:block rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-10"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1400&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
          <div className="relative z-10 text-white">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6"
            >
              <Sparkles className="size-4" />
              Join Us Today!
            </motion.div>
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">Start your<br />food journey</h2>
            <p className="text-white/90 text-lg mb-8 leading-relaxed">Create an account to order from 500+ restaurants, track deliveries, and enjoy exclusive offers.</p>
            
            <div className="space-y-4">
              {[
                { icon: '⚡', text: 'Quick 5-minute signup' },
                { icon: '🎁', text: 'Get special welcome offers' },
                { icon: '📱', text: 'Easy order management' },
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
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-black/60 text-base">Join us for delicious food delivered fast</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">First Name</label>
                <div className="relative">
                  <input 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white outline-none transition-all" 
                    placeholder="John" 
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">Last Name</label>
                <div className="relative">
                  <input 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white outline-none transition-all" 
                    placeholder="Doe" 
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white outline-none transition-all" 
                  placeholder="name@example.com" 
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">Phone Number</label>
              <div className="relative">
                <input 
                  name="phoneNumber" 
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white outline-none transition-all" 
                  placeholder="+1 234 567 890" 
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 inline-block">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-11 pr-14 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white outline-none transition-all" 
                  placeholder="Create a strong password" 
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

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={!isValid || loading} 
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <>
                  Create Account
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
                <span className="px-4 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
            <Link 
              to="/login" 
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 font-semibold text-gray-700 hover:text-purple-700 transition-all"
            >
              Sign in instead
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register