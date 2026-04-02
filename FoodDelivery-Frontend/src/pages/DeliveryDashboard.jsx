import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Package,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react'
import { analyticsService } from '../services/analyticsService'
import { DeliveryStatsCard } from '../components/AnalyticsCharts'

const DeliveryDashboard = () => {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [stats, setStats] = useState(null)
  const [allStats, setAllStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.deliveryPersonId) {
      loadStats()
    }
  }, [user, selectedPeriod])

  const loadStats = async () => {
    setLoading(true)
    try {
      const deliveryPersonId = user?.deliveryPersonId
      if (!deliveryPersonId) return
      const periodStats = await analyticsService.getDeliveryPersonStats(deliveryPersonId, selectedPeriod)
      setStats(periodStats)
      if (selectedPeriod === 'today') {
        const allData = await analyticsService.getDeliveryPersonStats(deliveryPersonId, 'all')
        setAllStats(allData)
      }
    } catch (error) {
      console.error('Failed to load delivery stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const periods = [
    { value: 'today', label: 'Today', icon: Clock },
    { value: 'week', label: 'This Week', icon: Calendar },
    { value: 'month', label: 'This Month', icon: TrendingUp },
    { value: 'year', label: 'This Year', icon: Package }
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="size-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-600"
        />
      </div>
    )
  }

  const currentPeriodLabel = periods.find(p => p.value === selectedPeriod)?.label

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 shadow-2xl"
      >
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/30 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-violet-700/30 rounded-full translate-x-1/4 translate-y-1/3 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Live Dashboard</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
              Hey, {user?.firstName}! 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Track your performance and earnings in real-time.</p>
          </div>

          {/* Quick inline stats */}
          <div className="flex gap-3 flex-wrap">
            {allStats && [
              { label: 'Total Trips', value: allStats.totalDeliveries || 0, icon: Package, color: 'text-indigo-400' },
              { label: 'This Month', value: `$${allStats.month?.earnings || 0}`, icon: DollarSign, color: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-2xl px-4 py-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-lg font-black">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Period selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {periods.map((period) => {
            const isActive = selectedPeriod === period.value
            return (
              <motion.button
                key={period.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedPeriod(period.value)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <period.icon size={16} />
                {period.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Current period performance */}
      <motion.div
        key={selectedPeriod}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Zap className="text-indigo-500" size={22} />
            {currentPeriodLabel} Performance
          </h2>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            {currentPeriodLabel}
          </span>
        </div>
        {stats && <DeliveryStatsCard stats={stats} period={selectedPeriod} />}
      </motion.div>

      {/* Snapshot overview cards */}
      {allStats && selectedPeriod === 'today' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'All Time', value: allStats.totalDeliveries || 0, sub: 'deliveries', icon: Package, from: 'from-indigo-500', to: 'to-indigo-600' },
            { label: 'Today', value: allStats.today?.deliveries || 0, sub: `$${allStats.today?.earnings || 0} earned`, icon: Clock, from: 'from-emerald-500', to: 'to-emerald-600' },
            { label: 'This Month', value: allStats.month?.deliveries || 0, sub: `$${allStats.month?.earnings || 0} earned`, icon: Calendar, from: 'from-violet-500', to: 'to-violet-600' },
            { label: 'This Year', value: allStats.year?.deliveries || 0, sub: `$${allStats.year?.earnings || 0} earned`, icon: TrendingUp, from: 'from-amber-500', to: 'to-amber-600' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-gradient-to-br ${card.from} ${card.to} rounded-2xl p-5 text-white shadow-lg`}
            >
              <div className="flex items-start justify-between mb-3">
                <card.icon size={20} className="text-white/80" />
                <ArrowUpRight size={16} className="text-white/60" />
              </div>
              <p className="text-3xl font-black">{card.value}</p>
              <p className="text-xs mt-1 text-white/80 font-medium">{card.label}</p>
              <p className="text-xs text-white/60 mt-0.5">{card.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tips + earnings breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="text-amber-500" size={18} fill="#f59e0b" />
            Performance Tips
          </h3>
          <ul className="space-y-3">
            {[
              'Complete deliveries quickly to boost your earnings',
              'Maintain high ratings for priority order assignments',
              'Keep your availability status up-to-date at all times',
            ].map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <ChevronRight size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">{tip}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Earnings breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 relative">
            <DollarSign size={18} className="text-emerald-400" />
            Earnings — {currentPeriodLabel}
          </h3>
          <div className="space-y-3 relative">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Base rate per trip</span>
              <span className="font-bold text-white">$5.00</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Trips {currentPeriodLabel}</span>
              <span className="font-bold text-white">{stats?.deliveries || 0}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total earnings</span>
              <span className="text-2xl font-black text-emerald-400">${stats?.earnings || 0}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DeliveryDashboard
