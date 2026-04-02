import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Users,
  Store,
  Truck,
  BarChart3,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Activity,
  Calendar,
  DollarSign,
  Package,
  Filter,
  Eye,
  Power,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Award,
  Zap
} from 'lucide-react'
import { api } from '../api/client'
import { analyticsService } from '../services/analyticsService'
import {
  OrderTrendsChart,
  TopCustomersChart,
  FrequentItemsChart,
  RestaurantStatsCard,
  AvgOrderValueChart,
  RevenueComparisonChart
} from '../components/AnalyticsCharts'
import AdminProfileModal from '../components/AdminProfileModal'

const AdminDashboard = () => {
  const { user, token } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalOrders: 0,
    totalDeliveries: 0,
    totalPayments: 0,
    activeDeliveryPersons: 0
  })
  const [analytics, setAnalytics] = useState({
    orderTrends: [],
    topCustomers: [],
    frequentItems: [],
    restaurantStats: null,
    dailyStats: null,
    paymentStats: null
  })
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [orderTrendPeriod, setOrderTrendPeriod] = useState('month')
  const [orderTrendYear, setOrderTrendYear] = useState(new Date().getFullYear())
  const [topCustomersCount, setTopCustomersCount] = useState(5)
  const [frequentItemsCount, setFrequentItemsCount] = useState(5)
  const [restaurantFilter, setRestaurantFilter] = useState({ rating: 0, status: 'all' })
  const [filteredRestaurants, setFilteredRestaurants] = useState([])
  const [avgOrderValueData, setAvgOrderValueData] = useState([])
  const [topCustomerPeriod, setTopCustomerPeriod] = useState('all')

  const ensureArray = (value) => (Array.isArray(value) ? value : [])

  useEffect(() => {
    loadDashboardStats()
    loadAnalytics()
    loadRestaurantsForFilter()
  }, [token])

  useEffect(() => {
    filterRestaurants()
  }, [restaurantFilter, stats])

  const loadDashboardStats = async () => {
    setLoading(true)
    try {
      if (!token) return

      const [customers, restaurants, orders, deliveries, payments] = await Promise.allSettled([
        api.getCustomers(),
        api.getRestaurants(),
        api.getOrders(),
        api.getDeliveries(),
        api.getPayments()
      ])

      const customersData = customers.status === 'fulfilled' ? customers.value : []
      const restaurantsData = restaurants.status === 'fulfilled' ? restaurants.value : []
      const ordersData = orders.status === 'fulfilled' ? orders.value : []
      const deliveriesData = deliveries.status === 'fulfilled' ? deliveries.value : []
      const paymentsData = payments.status === 'fulfilled' ? payments.value : []

      let deliveryPersonsCount = 0
      try {
        const delPersons = await api.getDeliveryPersons()
        deliveryPersonsCount = Array.isArray(delPersons) ? delPersons.filter(dp => dp.isAvailable).length : 0
      } catch (e) {
        console.warn('Failed to fetch delivery persons:', e)
      }

      const activeRestaurants = restaurantsData?.filter(r => r.isActive)?.length || 0

      setStats({
        totalUsers: customersData?.length || 0,
        totalRestaurants: restaurantsData?.length || 0,
        activeRestaurants: activeRestaurants,
        totalOrders: ordersData?.length || 0,
        totalDeliveries: deliveriesData?.length || 0,
        totalPayments: paymentsData?.length || 0,
        activeDeliveryPersons: deliveryPersonsCount
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const [orderTrends, topCustomers, frequentItems, restaurantStats, dailyStats, paymentStats] = await Promise.allSettled([
        analyticsService.getOrderStats(orderTrendPeriod, orderTrendYear),
        analyticsService.getTopCustomers(topCustomersCount),
        analyticsService.getFrequentItems(frequentItemsCount),
        analyticsService.getRestaurantStats(),
        analyticsService.getDailyStats(),
        analyticsService.getPaymentStats()
      ])

      const orderTrendsData = orderTrends.status === 'fulfilled' ? ensureArray(orderTrends.value) : []
      
      // Calculate average order values from order trends
      const avgOrderValues = orderTrendsData.map(item => ({
        month: item.month,
        avgOrderValue: item.orderCount > 0 ? (item.totalRevenue / item.orderCount).toFixed(2) : 0
      }))

      setAnalytics({
        orderTrends: orderTrendsData,
        topCustomers: topCustomers.status === 'fulfilled' ? ensureArray(topCustomers.value) : [],
        frequentItems: frequentItems.status === 'fulfilled' ? ensureArray(frequentItems.value) : [],
        restaurantStats: restaurantStats.status === 'fulfilled' ? restaurantStats.value : null,
        dailyStats: dailyStats.status === 'fulfilled' ? dailyStats.value : null,
        paymentStats: paymentStats.status === 'fulfilled' ? paymentStats.value : null
      })
      
      setAvgOrderValueData(avgOrderValues)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const loadRestaurantsForFilter = async () => {
    try {
      const restaurants = await api.getRestaurants()
      setFilteredRestaurants(Array.isArray(restaurants) ? restaurants : [])
    } catch (error) {
      console.error('Failed to load restaurants:', error)
    }
  }

  const filterRestaurants = () => {
    if (!filteredRestaurants.length) return
    
    let filtered = [...filteredRestaurants]
    
    // Filter by rating
    if (restaurantFilter.rating > 0) {
      filtered = filtered.filter(r => (r.rating || 0) >= restaurantFilter.rating)
    }
    
    // Filter by status
    if (restaurantFilter.status !== 'all') {
      const isActiveFilter = restaurantFilter.status === 'open'
      filtered = filtered.filter(r => r.isActive === isActiveFilter)
    }
    
    return filtered
  }


  const handleOrderTrendPeriodChange = async (period) => {
    setOrderTrendPeriod(period)
    setAnalyticsLoading(true)
    try {
      const data = await analyticsService.getOrderStats(period, orderTrendYear)
      setAnalytics(prev => ({ ...prev, orderTrends: ensureArray(data) }))
    } catch (error) {
      console.error('Failed to update order trends:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleTopCustomersCountChange = async (count) => {
    setTopCustomersCount(count)
    setAnalyticsLoading(true)
    try {
      const data = await analyticsService.getTopCustomers(count)
      setAnalytics(prev => ({ ...prev, topCustomers: ensureArray(data) }))
    } catch (error) {
      console.error('Failed to update top customers:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500',
      link: '/admin/users',
      change: '+12%',
      changeType: 'up'
    },
    {
      title: 'Restaurants',
      value: `${stats.activeRestaurants}/${stats.totalRestaurants}`,
      subtitle: 'Active / Total',
      icon: Store,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500',
      link: '/admin/restaurants',
      change: '+8%',
      changeType: 'up'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500',
      link: '/orders',
      change: '+25%',
      changeType: 'up'
    },
    {
      title: 'Active Delivery Staff',
      value: stats.activeDeliveryPersons,
      icon: Truck,
      gradient: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-500',
      link: '/admin/delivery-persons',
      change: '+5%',
      changeType: 'up'
    }
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="size-12 rounded-full border-4 border-purple-600/20 border-t-purple-600"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Welcome back,{' '}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
            >
              {user?.firstName}
            </button>
            . Here's your complete platform overview.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={card.link}
              className="block bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group overflow-hidden relative"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    <card.icon size={28} className="text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                  </div>
                  {card.change && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                      card.changeType === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {card.changeType === 'up' ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
                      <span>{card.change}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </h3>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                {card.subtitle && <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Today's Performance & Payment Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Performance */}
        {analytics.dailyStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Calendar size={24} />
                </div>
                <h2 className="text-2xl font-bold">Today's Performance</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="absolute right-4 top-4 rounded-xl bg-white/15 p-2">
                    <Package size={18} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-white/80 uppercase mb-2 flex items-center gap-2">
                    <Package size={16} />
                    Orders Today
                  </p>
                  <p className="text-4xl font-bold">{analytics.dailyStats.orderCount || 0}</p>
                </div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="absolute right-4 top-4 rounded-xl bg-white/15 p-2">
                    <DollarSign size={18} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-white/80 uppercase mb-2 flex items-center gap-2">
                    <DollarSign size={16} />
                    Revenue Today
                  </p>
                  <p className="text-4xl font-bold">${(analytics.dailyStats.totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Stats Overview */}
        {analytics.paymentStats && analytics.paymentStats.overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <CreditCard size={24} />
                </div>
                <h2 className="text-2xl font-bold">Payment Overview</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="absolute right-4 top-4 rounded-xl bg-white/15 p-2">
                    <CreditCard size={18} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-white/80 uppercase mb-2 flex items-center gap-2">
                    <DollarSign size={16} />
                    Total Revenue
                  </p>
                  <p className="text-4xl font-bold">${(analytics.paymentStats.overview.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="absolute right-4 top-4 rounded-xl bg-white/15 p-2">
                    <CheckCircle2 size={18} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-white/80 uppercase mb-2 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Success Rate
                  </p>
                  <p className="text-4xl font-bold">{(analytics.paymentStats.overview.successRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Trends with Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden lg:col-span-2"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500 text-white">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Order Trends</h2>
                <p className="text-sm text-slate-600">Analyze order patterns over time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={orderTrendPeriod}
                onChange={(e) => handleOrderTrendPeriodChange(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="size-10 rounded-full border-4 border-purple-600/20 border-t-purple-600"
                />
              </div>
            ) : (
              <OrderTrendsChart data={analytics.orderTrends} />
            )}
          </div>
        </motion.div>

        {/* Top Customers with Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500 text-white">
                <Award size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Top Customers</h2>
                <p className="text-sm text-slate-600">Most valuable customers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={topCustomersCount}
                onChange={(e) => handleTopCustomersCountChange(parseInt(e.target.value))}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
                <option value={25}>Top 25</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="size-10 rounded-full border-4 border-blue-600/20 border-t-blue-600"
                />
              </div>
            ) : (
              <TopCustomersChart data={analytics.topCustomers} />
            )}
          </div>
        </motion.div>

        {/* Most Ordered Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500 text-white">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Most Ordered Items</h2>
                <p className="text-sm text-slate-600">Popular menu items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={frequentItemsCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value)
                  setFrequentItemsCount(count)
                  analyticsService.getFrequentItems(count).then(data => {
                    setAnalytics(prev => ({ ...prev, frequentItems: ensureArray(data) }))
                  })
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="size-10 rounded-full border-4 border-orange-600/20 border-t-orange-600"
                />
              </div>
            ) : (
              <FrequentItemsChart data={analytics.frequentItems} />
            )}
          </div>
        </motion.div>

        {/* Average Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden lg:col-span-2"
        >
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500 text-white">
                <DollarSign size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Average Order Value</h2>
                <p className="text-sm text-slate-600">Track average spending per order</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="size-10 rounded-full border-4 border-violet-600/20 border-t-violet-600"
                />
              </div>
            ) : (
              <AvgOrderValueChart data={avgOrderValueData} />
            )}
          </div>
        </motion.div>

        {/* Today's Order Statistics */}
        {analytics.dailyStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden lg:col-span-2"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500 text-white">
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Today's Order Statistics</h2>
                  <p className="text-sm text-slate-600">Real-time order insights for today</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Package size={24} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">TODAY</span>
                  </div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics.dailyStats.orderCount || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign size={24} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">TODAY</span>
                  </div>
                  <p className="text-sm font-medium text-green-700 mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-green-900">${(analytics.dailyStats.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp size={24} className="text-purple-600" />
                    <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">AVG</span>
                  </div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Avg Order</p>
                  <p className="text-3xl font-bold text-purple-900">
                    ${analytics.dailyStats.orderCount > 0 
                      ? ((analytics.dailyStats.totalRevenue || 0) / (analytics.dailyStats.orderCount || 1)).toFixed(2) 
                      : '0'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <Activity size={24} className="text-orange-600" />
                    <span className="text-xs font-semibold text-orange-600 bg-orange-200 px-2 py-1 rounded-full">STATUS</span>
                  </div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Status</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {(analytics.dailyStats.orderCount || 0) > 0 ? '🔥 Active' : '😴 Slow'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Restaurant Filter by Rating & Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden lg:col-span-2"
        >
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Store size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Restaurant Filters</h2>
                  <p className="text-sm text-slate-600">Filter by rating and status</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={restaurantFilter.rating}
                  onChange={(e) => setRestaurantFilter({...restaurantFilter, rating: parseFloat(e.target.value)})}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value={0}>All Ratings</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
                <select
                  value={restaurantFilter.status}
                  onChange={(e) => setRestaurantFilter({...restaurantFilter, status: e.target.value})}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filterRestaurants()?.slice(0, 6).map((restaurant, index) => (
                <motion.div
                  key={restaurant.restaurantId || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{restaurant.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-slate-700">{(restaurant.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      restaurant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {restaurant.isActive ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{restaurant.cuisine}</p>
                </motion.div>
              ))}
            </div>
            {filterRestaurants()?.length > 6 && (
              <div className="mt-4 text-center">
                <Link 
                  to="/admin/restaurants"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
                >
                  View all {filterRestaurants()?.length} restaurants <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Restaurant Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500 text-white">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Restaurant Statistics</h2>
                <p className="text-sm text-slate-600">Overall restaurant metrics</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-32">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="size-10 rounded-full border-4 border-green-600/20 border-t-green-600"
                />
              </div>
            ) : (
              <RestaurantStatsCard stats={analytics.restaurantStats} />
            )}
          </div>
        </motion.div>

        {/* Payment Method Breakdown */}
        {analytics.paymentStats && analytics.paymentStats.paymentMethods && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500 text-white">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Payment Methods</h2>
                  <p className="text-sm text-slate-600">Transaction breakdown</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics.paymentStats.paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{method.method}</p>
                        <p className="text-sm text-slate-600">{method.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">${method.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <Activity className="text-purple-600" size={28} />
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/delivery-persons"
            className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border border-blue-100 transition-all hover:shadow-lg"
          >
            <div className="shrink-0 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Truck size={28} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Manage Delivery Staff</p>
              <p className="text-sm text-slate-600 mt-1">{stats.activeDeliveryPersons} active staff members</p>
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                View all <ArrowUpRight size={14} />
              </p>
            </div>
          </Link>
          
          <Link
            to="/admin/restaurants"
            className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-100 transition-all hover:shadow-lg"
          >
            <div className="shrink-0 p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Store size={28} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Manage Restaurants</p>
              <p className="text-sm text-slate-600 mt-1">{stats.activeRestaurants} active of {stats.totalRestaurants} total</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                Activate/Deactivate <ArrowUpRight size={14} />
              </p>
            </div>
          </Link>
          
          <Link
            to="/admin/users"
            className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-100 transition-all hover:shadow-lg"
          >
            <div className="shrink-0 p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Manage Customers</p>
              <p className="text-sm text-slate-600 mt-1">{stats.totalUsers} registered customers</p>
              <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                View all <ArrowUpRight size={14} />
              </p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Admin Profile Modal */}
      <AdminProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </div>
  )
}

export default AdminDashboard
