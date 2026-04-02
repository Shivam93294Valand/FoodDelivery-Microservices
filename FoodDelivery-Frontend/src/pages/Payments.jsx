import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import {
  CreditCard,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Download,
  XCircle,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../components/ToastContainer'
import { normalizeOrderStatus, toAmount } from '../utils/orderHelpers'
import { generatePaymentsPDF } from '../utils/pdfExport'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const fetchPayments = async () => {
      try {
        const [paymentsResult, ordersResult] = await Promise.allSettled([api.getPayments(), api.getOrders()])
        if (!mounted) return

        const data = paymentsResult.status === 'fulfilled' ? paymentsResult.value : []
        const ordersData = ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value) ? ordersResult.value : []
        const orderStatusById = new Map(
          ordersData.map((order) => {
            const orderId = order?.orderId ?? order?.OrderId
            const status = normalizeOrderStatus(order?.orderStatus ?? order?.OrderStatus ?? order?.status)
            return [orderId, status]
          })
        )
        
        // Handle different response formats
        let paymentsArray = []
        if (Array.isArray(data)) {
          paymentsArray = data
        } else if (data && Array.isArray(data.payments)) {
          paymentsArray = data.payments
        } else if (data && Array.isArray(data.data)) {
          paymentsArray = data.data
        } else if (data && data.$values && Array.isArray(data.$values)) {
          paymentsArray = data.$values
        }

        const enrichedPayments = paymentsArray.map((payment) => {
          const orderId = payment?.orderId ?? payment?.OrderId
          const orderStatus = normalizeOrderStatus(
            orderStatusById.get(orderId)
            ?? payment?.orderStatus
            ?? payment?.OrderStatus
          )
          return {
            ...payment,
            orderStatus
          }
        })

        setPayments(enrichedPayments)
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load payments')
        toast.error('Could not fetch payment history')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchPayments()
    return () => { mounted = false }
  }, [])

  const normalizePayment = (p) => ({
    paymentId: p?.paymentId ?? p?.PaymentId ?? p?.id,
    orderId: p?.orderId ?? p?.OrderId,
    amount: toAmount(p?.amount, p?.Amount),
    status: p?.status ?? p?.Status ?? 'Pending',
    orderStatus: normalizeOrderStatus(p?.orderStatus ?? p?.OrderStatus),
    paymentMethod: p?.paymentMethod ?? p?.PaymentMethod ?? 'Card',
    paymentDate: p?.paymentDate ?? p?.PaymentDate ?? p?.createdAt ?? p?.CreatedAt ?? Date.now(),
    transactionId: p?.transactionId ?? p?.TransactionId ?? p?.paymentId ?? p?.PaymentId
  })

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending':
      case 'confirmed':
      case 'preparing':
      case 'outfordelivery':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cancelled':
      case 'canceled':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default: 
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle2 className="size-5" />
      case 'pending':
      case 'confirmed':
      case 'preparing':
      case 'outfordelivery':
        return <Clock className="size-5" />
      case 'cancelled':
      case 'canceled':
        return <XCircle className="size-5" />
      default: 
        return <Clock className="size-5" />
    }
  }

  const normalizedPayments = payments.map(normalizePayment)

  const statusSequence = ['Pending', 'Confirmed', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled']
  const statusLabel = {
    Pending: 'Pending',
    Confirmed: 'Confirmed',
    Preparing: 'Preparing',
    OutForDelivery: 'Out For Delivery',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled'
  }

  const uniqueOrdersById = normalizedPayments.reduce((acc, payment) => {
    const key = payment.orderId ?? `payment-${payment.paymentId}`
    if (!acc.has(key)) acc.set(key, payment)
    return acc
  }, new Map())

  const statusCounts = statusSequence.reduce((acc, status) => {
    acc[status] = 0
    return acc
  }, {})

  uniqueOrdersById.forEach((payment) => {
    const status = normalizeOrderStatus(payment.orderStatus)
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  const filteredPayments = normalizedPayments.filter(p => {
    const matchesSearch = 
      searchQuery === '' ||
      p.paymentId?.toString().includes(searchQuery) ||
      p.orderId?.toString().includes(searchQuery) ||
      p.transactionId?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = 
      filterStatus === 'all' ||
      p.orderStatus?.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesFilter
  })

  const now = new Date()
  const isSameMonth = (date) => {
    const parsed = new Date(date)
    return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth()
  }
  const isSameYear = (date) => {
    const parsed = new Date(date)
    return parsed.getFullYear() === now.getFullYear()
  }

  const successfulStatuses = ['completed', 'success', 'succeeded']
  const refundedOrder = (payment) => {
    const orderStatus = normalizeOrderStatus(payment.orderStatus)
    const paymentStatus = (payment.status || '').toLowerCase()
    return orderStatus === 'Cancelled' || paymentStatus === 'refunded' || paymentStatus === 'refundpending'
  }

  const monthGross = normalizedPayments
    .filter((payment) => successfulStatuses.includes((payment.status || '').toLowerCase()) && isSameMonth(payment.paymentDate))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const monthRefund = normalizedPayments
    .filter((payment) => refundedOrder(payment) && isSameMonth(payment.paymentDate))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const monthMoney = Math.max(0, monthGross - monthRefund)

  const yearGross = normalizedPayments
    .filter((payment) => successfulStatuses.includes((payment.status || '').toLowerCase()) && isSameYear(payment.paymentDate))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const yearRefund = normalizedPayments
    .filter((payment) => refundedOrder(payment) && isSameYear(payment.paymentDate))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const yearMoney = Math.max(0, yearGross - yearRefund)

  const allTimeGross = normalizedPayments
    .filter((payment) => successfulStatuses.includes((payment.status || '').toLowerCase()))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const refundAmount = normalizedPayments
    .filter((payment) => refundedOrder(payment))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const allTimeMoney = Math.max(0, allTimeGross - refundAmount)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 mx-auto mb-4"
          />
          <p className="text-sm font-medium text-slate-600">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 pb-20">
      {/* Elevated Header */}
      <div className="border-b border-slate-200/60 sticky top-0 z-30 backdrop-blur-xl bg-white/95 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all hover:scale-105"
            >
              <ArrowLeft className="size-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Payment History</h1>
              <p className="text-xs text-slate-500 font-medium">Track all your transactions</p>
            </div>
          </div>
          <button
            onClick={() => {
              try {
                generatePaymentsPDF(filteredPayments)
                toast.success('Generating payment history PDF...')
              } catch {
                toast.error('Failed to export payment history')
              }
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Download className="size-4" />
            Export
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2">${monthMoney.toFixed(2)}</h3>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Year</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2">${yearMoney.toFixed(2)}</h3>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Time</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2">${allTimeMoney.toFixed(2)}</h3>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-rose-200 p-5"
          >
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Refund Amount</p>
            <h3 className="text-2xl font-black text-rose-700 mt-2">${refundAmount.toFixed(2)}</h3>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statusSequence.map((status, index) => {
            const style = getStatusStyle(status)
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-5 rounded-3xl border shadow-lg ${style}`}
              >
                <div className="mb-3">{getStatusIcon(status)}</div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1">{statusLabel[status]}</p>
                <h3 className="text-2xl font-black">{statusCounts[status] || 0}</h3>
              </motion.div>
            )
          })}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-4xl border border-slate-200/60 shadow-lg p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID, transaction ID, or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-2 font-medium text-sm"
            >
              <Filter className="size-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-4 mb-6 overflow-hidden"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Filter by Status</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'confirmed', 'preparing', 'outfordelivery', 'delivered', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'all'
                      ? 'All'
                      : statusLabel[normalizeOrderStatus(status)]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions List */}
        <div className="bg-white rounded-4xl border border-slate-200/60 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Receipt className="size-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-slate-900">Transaction History</h2>
                <p className="text-xs text-slate-500 font-medium">{filteredPayments.length} transactions</p>
              </div>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="py-20 text-center">
              <div className="size-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="size-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Transactions Found</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Your payment history will appear here once you make your first order.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPayments.map((payment, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={payment.paymentId || i}
                  className="px-6 py-5 hover:bg-slate-50/80 transition-all group cursor-pointer"
                  onClick={() => payment.orderId && navigate(`/orders/${payment.orderId}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`size-14 rounded-2xl flex items-center justify-center border-2 shrink-0 ${getStatusStyle(payment.orderStatus)}`}>
                        {getStatusIcon(payment.orderStatus)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-black text-slate-900 text-base">
                            Order #{payment.orderId || 'N/A'}
                          </h4>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(payment.orderStatus)}`}>
                            {statusLabel[normalizeOrderStatus(payment.orderStatus)]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Calendar className="size-3.5" />
                            {new Date(payment.paymentDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <CreditCard className="size-3.5" />
                            {payment.paymentMethod}
                          </span>
                          {payment.transactionId && (
                            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                              ID: {payment.transactionId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-slate-900 mb-1">
                        ${payment.amount.toFixed(2)}
                      </p>
                      {payment.orderId && (
                        <button className="flex items-center gap-1 text-blue-600 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          View Order
                          <ChevronRight className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        {filteredPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/60 p-6 text-center"
          >
            <p className="text-sm text-slate-600">
              Need help with a transaction? <button onClick={() => toast.info('Support coming soon!')} className="font-bold text-blue-600 hover:underline">Contact Support</button>
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default Payments
