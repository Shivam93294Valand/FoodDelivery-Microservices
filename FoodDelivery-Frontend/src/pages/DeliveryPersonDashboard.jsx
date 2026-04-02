import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'
import {
  Package,
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle,
  TrendingUp,
  DollarSign,
  User,
  ChevronRight,
  Star,
  Target,
  Calendar,
  Award,
  Activity,
  Map,
  Bell,
  Settings,
  LogOut,
  Filter,
  Search,
  ArrowRight,
  Bike,
  ShoppingBag,
  Timer,
  Zap,
  TrendingDown,
  AlertCircle,
  MapPinned,
  Route,
  ExternalLink
} from 'lucide-react'

const DeliveryPersonDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [deliveries, setDeliveries] = useState([])
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    total: 0,
    earnings: 0,
    onTimeRate: 0,
    avgRating: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active') // active, completed, all
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDelivery, setSelectedDelivery] = useState(null)

  useEffect(() => {
    loadDeliveries()
    const interval = setInterval(loadDeliveries, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      const data = await api.getDeliveries()
      const myDeliveries = Array.isArray(data)
        ? data.filter(d => d.deliveryPersonId === user?.deliveryPersonId)
        : []

      setDeliveries(myDeliveries)

      const allStats = user?.deliveryPersonId
        ? await api.getDeliveryPersonStats(user.deliveryPersonId)
        : null

      // Calculate comprehensive stats
      const now = new Date()
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))

      const todayDeliveries = myDeliveries.filter(d =>
        new Date(d.assignedAt || d.createdAt) >= todayStart
      )
      const weekDeliveries = myDeliveries.filter(d =>
        new Date(d.assignedAt || d.createdAt) >= weekStart
      )
      const completedDeliveries = myDeliveries.filter(d => d.status === 'Delivered')
      const onTimeDeliveries = completedDeliveries.filter(d => d.onTime !== false)
      const pendingDeliveries = myDeliveries.filter(d => d.status === 'Assigned')
      const inProgressDeliveries = myDeliveries.filter(d => ['PickedUp', 'InTransit'].includes(d.status))

      setStats({
        today: Number(allStats?.today?.deliveries ?? todayDeliveries.length),
        thisWeek: Number(allStats?.week?.deliveries ?? weekDeliveries.length),
        total: Number(allStats?.totalDeliveries ?? completedDeliveries.length),
        earnings: Number(allStats?.year?.earnings ?? allStats?.month?.earnings ?? 0),
        onTimeRate: completedDeliveries.length > 0
          ? Math.round((onTimeDeliveries.length / completedDeliveries.length) * 100)
          : 100,
        avgRating: 4.8, // Mock rating - would come from API
        pending: pendingDeliveries.length,
        inProgress: inProgressDeliveries.length,
        completed: completedDeliveries.length
      })
    } catch (e) {
      console.error('Failed to load deliveries:', e)
      toast.error('Could not load deliveries')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (deliveryId, currentStatus, paymentMethod) => {
    const statusFlow = {
      'Assigned': 'PickedUp',
      'PickedUp': 'InTransit',
      'InTransit': 'Delivered'
    }
    const nextStatus = statusFlow[currentStatus]

    if (!nextStatus) {
      toast.info('Delivery already completed')
      return
    }

    try {
      if (currentStatus === 'InTransit') {
        const otp = window.prompt('Enter customer OTP to complete delivery')
        if (!otp) {
          toast.error('OTP is required to complete the delivery')
          return
        }
        await api.verifyDeliveryOtp(deliveryId, otp)

        const proofUrl = window.prompt('Optional proof URL (photo link). Leave empty to skip')
        if (proofUrl) {
          await api.saveProofOfDelivery(deliveryId, proofUrl, 'Captured by delivery partner')
        }
      }

      await api.updateDeliveryStatus(deliveryId, nextStatus)
      toast.success(`Status updated to ${nextStatus}`)

      if (nextStatus === 'Delivered' && paymentMethod === 'Cash') {
        const confirmed = window.confirm('Have you received the cash payment from the customer?')
        if (confirmed) {
          await api.confirmCashPayment(deliveryId)
          toast.success('Cash payment confirmed!')
        }
      }

      loadDeliveries()
    } catch (e) {
      console.error('Failed to update status:', e)
      toast.error(e.message || 'Failed to update status')
    }
  }

  const getFilteredDeliveries = () => {
    let filtered = deliveries

    // Tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(d => !['Delivered', 'Failed', 'Cancelled'].includes(d.status))
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(d => d.status === 'Delivered')
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus)
    }

    // Sort by priority: Assigned first, then PickedUp, then InTransit, then others
    filtered.sort((a, b) => {
      const priority = { 'Assigned': 1, 'PickedUp': 2, 'InTransit': 3, 'Delivered': 4 }
      return (priority[a.status] || 99) - (priority[b.status] || 99)
    })

    return filtered
  }

  const getStatusColor = (status) => {
    const colors = {
      'Assigned': 'bg-indigo-600',
      'PickedUp': 'bg-violet-600',
      'InTransit': 'bg-blue-600',
      'Delivered': 'bg-emerald-600',
      'Failed': 'bg-rose-600',
      'Cancelled': 'bg-slate-600'
    }
    return colors[status] || 'bg-slate-600'
  }

  const getStatusLabel = (status) => {
    return status === 'PickedUp' ? 'Picked Up' :
      status === 'InTransit' ? 'In Transit' : status
  }

  const getNextActionLabel = (status) => {
    const labels = {
      'Assigned': 'Pick Up Order',
      'PickedUp': 'Start Delivery',
      'InTransit': 'Complete Delivery'
    }
    return labels[status] || 'Update Status'
  }

  const openInMaps = (address) => {
    if (address) {
      const mapsUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
      window.open(mapsUrl, '_blank')
    }
  }

  const openDirections = (delivery) => {
    if (!delivery?.restaurantLatitude || !delivery?.restaurantLongitude || !delivery?.deliveryLatitude || !delivery?.deliveryLongitude) {
      openInMaps(delivery?.deliveryAddress)
      return
    }

    const routeUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${delivery.restaurantLatitude}%2C${delivery.restaurantLongitude}%3B${delivery.deliveryLatitude}%2C${delivery.deliveryLongitude}`
    window.open(routeUrl, '_blank')
  }

  const filteredDeliveries = getFilteredDeliveries()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="size-20 rounded-full border-4 border-blue-600/20 border-t-blue-600 mx-auto mb-4"
          />
          <p className="text-lg font-semibold text-slate-600">Loading your deliveries...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl"
      >
        <div className="absolute -top-12 -left-12 w-56 h-56 bg-indigo-700/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-8 w-48 h-48 bg-violet-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-sm font-semibold">Live</span>
            </div>
            <h1 className="text-3xl font-black mb-1">Welcome back, {user?.firstName}!</h1>
            <p className="text-slate-400">Let's make today productive and deliver excellence</p>
          </div>
        </div>
      </motion.div>

      {/* Real-Time Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package className="text-white" size={28} />
            </div>
            {stats.pending > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold animate-pulse">
                {stats.pending} New
              </span>
            )}
          </div>
            <h3 className="text-3xl font-black text-slate-900 mb-0.5">{stats.today}</h3>
          <p className="text-xs font-semibold text-slate-500">Today's Deliveries</p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">This Week</span>
              <span className="font-bold text-slate-900">{stats.thisWeek}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <DollarSign className="text-white" size={28} />
            </div>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-0.5">${stats.earnings}</h3>
          <p className="text-xs font-semibold text-slate-500">Total Earnings</p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Per Delivery</span>
              <span className="font-bold text-green-600">$5</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Star className="text-white" size={28} fill="white" />
            </div>
            <span className="text-2xl">⭐</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-0.5">{stats.avgRating}</h3>
          <p className="text-xs font-semibold text-slate-500">Average Rating</p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-amber-400" fill="#fbbf24" />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Target className="text-white" size={28} />
            </div>
            {stats.onTimeRate >= 90 && (
              <Award className="text-purple-600" size={24} />
            )}
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-0.5">{stats.onTimeRate}%</h3>
          <p className="text-sm font-semibold text-slate-500">On-Time Rate</p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.onTimeRate}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200"
      >
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <Activity className="text-blue-600" size={28} />
          Active Status Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                <Clock className="text-white" size={20} />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">{stats.pending}</p>
                <p className="text-xs font-bold text-slate-600">Pending Pickup</p>
              </div>
            </div>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-violet-600 flex items-center justify-center shadow-md">
                <Bike className="text-white" size={20} />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">{stats.inProgress}</p>
                <p className="text-xs font-bold text-slate-600">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
                <CheckCircle className="text-white" size={20} />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">{stats.completed}</p>
                <p className="text-xs font-bold text-slate-600">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delivery Orders Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        {/* Section Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <ShoppingBag className="text-indigo-600" size={22} />
                My Deliveries
              </h2>
              <p className="text-sm text-slate-500">Manage and track your active delivery orders</p>
            </div>
            <div className="flex items-center gap-3">
              {['active', 'completed', 'all'].map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'active' && stats.pending + stats.inProgress > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {stats.pending + stats.inProgress}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="p-6">
          {filteredDeliveries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Package className="text-slate-400" size={64} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">No deliveries found</h3>
              <p className="text-lg text-slate-500 mb-8">
                {activeTab === 'active'
                  ? 'You have no active deliveries at the moment. Take a break!'
                  : 'No deliveries match your current filter'}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all"
                >
                  View All Deliveries
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-6">
              {filteredDeliveries.map((delivery, index) => (
                <motion.div
                  key={delivery.deliveryId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group"
                >
                  {/* Status Header */}
                  <div className={`${getStatusColor(delivery.status)} p-5 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                    <div className="relative flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30">
                          <Bike className="text-white" size={28} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Delivery ID</p>
                          <p className="text-2xl font-black">#{delivery.deliveryId}</p>
                          <p className="text-sm opacity-90">Order #{delivery.orderId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-4 py-2 bg-white/25 backdrop-blur-md rounded-2xl text-sm font-black border-2 border-white/30">
                          {getStatusLabel(delivery.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      {/* Delivery Address */}
                      <div className="bg-white rounded-2xl p-5 border-2 border-blue-100 hover:border-blue-300 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                            <MapPin className="text-white" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Delivery Address</p>
                            <p className="text-sm font-bold text-slate-900 leading-relaxed mb-3">
                              {delivery.deliveryAddress || 'Address available in order details'}
                            </p>
                            {delivery.deliveryAddress && (
                              <button
                                onClick={() => openInMaps(delivery.deliveryAddress)}
                                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group/btn"
                              >
                                <MapPinned size={14} />
                                Open in OSM
                                <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Estimated Time */}
                      <div className="bg-white rounded-2xl p-5 border-2 border-green-100 hover:border-green-300 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                            <Clock className="text-white" size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-2">Estimated Time</p>
                            <p className="text-lg font-black text-slate-900">
                              {delivery.estimatedDeliveryTime || '~30 mins'}
                            </p>
                            {delivery.assignedAt && (
                              <p className="text-xs text-slate-500 mt-2">
                                Assigned {new Date(delivery.assignedAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Distance & Payment */}
                      <div className="bg-white rounded-2xl p-5 border-2 border-purple-100 hover:border-purple-300 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                            {delivery.distanceInKm > 0 ? (
                              <Route className="text-white" size={24} />
                            ) : (
                              <DollarSign className="text-white" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-widest text-purple-600 mb-2">
                              {delivery.distanceInKm > 0 ? 'Distance' : 'Payment'}
                            </p>
                            <p className="text-lg font-black text-slate-900">
                              {delivery.distanceInKm > 0
                                ? `${delivery.distanceInKm.toFixed(1)} km`
                                : delivery.paymentMethod || 'N/A'}
                            </p>
                            {delivery.distanceInKm > 0 && (
                              <p className="text-xs text-slate-500 mt-2">
                                ~{Math.ceil(delivery.distanceInKm * 3)} mins
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {delivery.status !== 'Delivered' && delivery.status !== 'Failed' && delivery.status !== 'Cancelled' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/live-track-delivery/${delivery.deliveryId}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all group/btn"
                          >
                            <Navigation size={24} className="group-hover/btn:rotate-12 transition-transform" />
                            Live Track & Update
                            <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                          </motion.button>
                          {delivery.deliveryAddress && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openDirections(delivery)}
                              className="px-5 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                            >
                              <MapPinned size={20} />
                              <span className="hidden sm:inline">Navigate</span>
                            </motion.button>
                          )}
                        </>
                      )}

                      {delivery.status === 'Delivered' && (
                        <div className="flex-1 flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl py-3.5 border border-emerald-200">
                          <CheckCircle size={18} />
                          <span className="font-bold text-sm">Delivery Completed Successfully</span>
                          <Award className="text-amber-500" size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default DeliveryPersonDashboard