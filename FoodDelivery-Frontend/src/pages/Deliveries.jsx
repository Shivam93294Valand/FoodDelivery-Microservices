import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import {
  Truck,
  Package,
  MapPin,
  Phone,
  ChevronRight,
  ArrowLeft,
  Navigation,
  Clock,
  ShieldCheck,
  Search,
  Timer
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../components/ToastContainer'

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('active') // active, all
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const fetchDeliveries = async () => {
      try {
        const data = await api.getDeliveries()
        if (!mounted) return
        setDeliveries(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load deliveries')
        toast.error('Could not load tracking data')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDeliveries()
    return () => { mounted = false }
  }, [])

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      case 'intransit':
      case 'pickedup': return 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse'
      case 'assigned': return 'bg-amber-50 text-amber-600 border-amber-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const activeDeliveries = deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status?.toLowerCase()))
  const displayDeliveries = filter === 'active' ? activeDeliveries : deliveries

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Active Tracking</h1>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {displayDeliveries.length === 0 ? (
          <div className="py-24 text-center">
            <div className="size-24 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-6 transform rotate-6 hover:rotate-0 transition-transform">
              <Package className="size-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Nothing in flight</h3>
            <p className="text-slate-500 font-medium">When you place an order, the live tracking status will appear here.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {displayDeliveries.map((d, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={d.deliveryId || i}
                className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500"
              >
                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-5">
                      <div className="size-16 rounded-3xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Navigation className="size-8 text-blue-600 fill-blue-600/10" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl font-black text-slate-900">Delivery #{d.deliveryId}</h4>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(d.status)}`}>
                            {d.status}
                          </span>
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Associated with Order #{d.orderId}</p>
                      </div>
                    </div>

                    {d.status?.toLowerCase() !== 'delivered' && (
                      <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/20">
                        <Timer className="size-5 text-blue-400" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Estimated Arrival</p>
                          <p className="text-sm font-black tracking-tight">{d.estimatedDeliveryTime || 'Calculating...'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Security</p>
                        <p className="text-sm font-black text-slate-700">Verified Shipment</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <Truck className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Transporter</p>
                        <p className="text-sm font-black text-slate-700">{d.deliveryPerson?.fullName || 'Assigning Courier...'}</p>
                      </div>
                    </div>
                    {d.deliveryPerson?.phoneNumber && (
                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                          <Phone className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Link</p>
                          <p className="text-sm font-black text-slate-700">{d.deliveryPerson.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Clock className="size-4" />
                      <span className="text-xs font-bold">Last updated: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/live-track-delivery/${d.deliveryId}`)}
                        className="flex items-center gap-2 group/btn px-6 py-2 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        Live Track Map
                        <Navigation className="size-4 group-hover/btn:rotate-12 transition-transform" />
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${d.orderId}`)}
                        className="flex items-center gap-2 group/btn px-6 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-inner border border-slate-200/50"
                      >
                        View Order
                        <ChevronRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Deliveries
