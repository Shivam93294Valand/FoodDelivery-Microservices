import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Plus, Edit, Trash2, Phone, Mail, ShieldCheck, 
  Search, Filter, TrendingUp, Clock, CheckCircle, AlertCircle
} from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'

const ManageDeliveryStaff = () => {
  const [deliveryStaff, setDeliveryStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    vehicleType: '',
    vehicleNumber: '',
    role: 'DeliveryPerson'
  })

  useEffect(() => {
    loadDeliveryStaff()
  }, [])

  const loadDeliveryStaff = async () => {
    setLoading(true)
    setLoadError('')
    const errors = []
    try {
      // 1) Try DeliveryService first (preferred)
      try {
        const data = await api.getDeliveryPersons()
        const list = Array.isArray(data) ? data : []
        if (list.length > 0) {
          await Promise.all(list.map(async (p) => {
            const id = p.deliveryPersonId || p.DeliveryPersonId
            if (!id) return
            try {
              const stats = await api.getDeliveryPersonStats(id)
              const todayValue = (stats && typeof stats.today === 'object') ? stats.today.deliveries : stats?.today
              p.totalDeliveries = Number(stats?.totalDeliveries ?? stats?.total ?? stats?.deliveries ?? 0)
              p.todaysDeliveries = Number(stats?.todaysDeliveries ?? todayValue ?? stats?.deliveries ?? 0)
            } catch (e) {
              p.totalDeliveries = 0
              p.todaysDeliveries = 0
            }
          }))
          setDeliveryStaff(list)
          return
        }
      } catch (e) {
        console.warn('DeliveryService fetch failed, falling back to customer service:', e?.message || e)
        errors.push(e?.message || String(e))
      }

      // 2) Fallback: load from CustomerService (legacy where delivery people might be stored as customers)
      try {
        const data = await api.getCustomers()
        const staff = (Array.isArray(data) ? data : []).filter(user => {
          const roleVal = (user.role || user.Role || '').toString().toLowerCase()
          return roleVal.includes('delivery')
        }).map(u => ({
          DeliveryPersonId: u.customerId || u.CustomerId,
          firstName: u.firstName || u.FirstName,
          lastName: u.lastName || u.LastName,
          email: u.email || u.Email,
          phoneNumber: u.phoneNumber || u.PhoneNumber,
          isActive: u.isActive ?? u.IsActive ?? true,
          totalDeliveries: 0,
          todaysDeliveries: 0
        }))

        if (staff.length > 0) {
          toast.info('Loaded delivery staff from Customer service (legacy entries)')
          setDeliveryStaff(staff)
          return
        }
      } catch (e) {
        console.warn('CustomerService fallback failed:', e?.message || e)
        errors.push(e?.message || String(e))
      }

      // If we reach here, nothing was found or both calls failed
      setDeliveryStaff([])
      const msg = errors.length > 0 ? ('No delivery staff found: ' + errors.join(' | ')) : 'No delivery staff found. Check Delivery service is running and you have permission to view staff.'
      setLoadError(msg)
      toast.warning(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Map form data to DeliveryPerson payload used by DeliveryService
      const payload = {
        FirstName: formData.firstName,
        LastName: formData.lastName,
        Email: formData.email,
        PhoneNumber: formData.phoneNumber,
        VehicleType: formData.vehicleType || '',
        VehicleNumber: formData.vehicleNumber || '',
        IsAvailable: true,
        ...(formData.password ? { Password: formData.password } : {})
      }

      if (editingStaff) {
        const id = editingStaff.deliveryPersonId || editingStaff.DeliveryPersonId
        await api.updateDeliveryPerson(id, payload)
        toast.success('Delivery staff updated successfully!')
      } else {
        await api.createDeliveryPerson(payload)
        toast.success('Delivery staff created successfully!')
      }

      setShowModal(false)
      setEditingStaff(null)
      resetForm()
      loadDeliveryStaff()
    } catch (error) {
      console.error('Failed to save delivery staff:', error)
      toast.error('Failed to save: ' + (error.message || 'Unknown error'))
    }
  }

  const handleEdit = (staff) => {
    setEditingStaff(staff)
    setFormData({
      firstName: staff.firstName || staff.FirstName || staff.FirstName || '',
      lastName: staff.lastName || staff.LastName || staff.LastName || '',
      email: staff.email || staff.Email || staff.Email || '',
      phoneNumber: staff.phoneNumber || staff.PhoneNumber || staff.PhoneNumber || '',
      vehicleType: staff.vehicleType || staff.VehicleType || '',
      vehicleNumber: staff.vehicleNumber || staff.VehicleNumber || '',
      password: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (staffId) => {
    if (!confirm('Are you sure you want to delete this delivery person? This cannot be undone.')) return
    try {
      await api.deleteDeliveryPerson(staffId)
      toast.success('Delivery staff deleted successfully!')
      loadDeliveryStaff()
    } catch (error) {
      console.error('Failed to delete delivery staff:', error)
      toast.error('Failed to delete: ' + (error.message || 'Unknown error'))
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      vehicleType: '',
      vehicleNumber: '',
      role: 'DeliveryPerson'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 mx-auto rounded-full border-4 border-blue-500/20 border-t-blue-600 mb-4"
          />
          <p className="text-slate-600 font-medium">Loading delivery staff...</p>
        </div>
      </div>
    )
  }

  const totalDeliveries = deliveryStaff.reduce((sum, staff) => sum + (staff.totalDeliveries || 0), 0)
  const activeStaff = deliveryStaff.filter(s => s.isActive ?? s.IsActive ?? true).length
  const todayDeliveries = deliveryStaff.reduce((sum, staff) => sum + (staff.todaysDeliveries || 0), 0)
  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredStaff = deliveryStaff.filter((staff) => {
    const firstName = staff.firstName || staff.FirstName || ''
    const lastName = staff.lastName || staff.LastName || ''
    const email = staff.email || staff.Email || ''
    const phoneNumber = staff.phoneNumber || staff.PhoneNumber || ''
    const isActive = staff.isActive ?? staff.IsActive ?? true

    const matchesSearch = !normalizedSearch ||
      `${firstName} ${lastName}`.toLowerCase().includes(normalizedSearch) ||
      email.toLowerCase().includes(normalizedSearch) ||
      phoneNumber.toLowerCase().includes(normalizedSearch)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {loadError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">{loadError}</p>
          </div>
          <button 
            onClick={loadDeliveryStaff} 
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Delivery Staff</h1>
          <p className="text-slate-600 mt-1">Manage your delivery fleet and monitor performance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm()
            setEditingStaff(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
        >
          <Plus size={20} />
          Add Staff Member
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Truck size={24} />
            </div>
            <TrendingUp size={20} className="text-blue-200" />
          </div>
          <p className="text-blue-100 text-sm font-medium mb-1">Total Staff</p>
          <p className="text-4xl font-bold">{deliveryStaff.length}</p>
          <p className="text-blue-100 text-sm mt-2">{activeStaff} active today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <CheckCircle size={24} />
            </div>
            <Clock size={20} className="text-emerald-200" />
          </div>
          <p className="text-emerald-100 text-sm font-medium mb-1">Today's Deliveries</p>
          <p className="text-4xl font-bold">{todayDeliveries}</p>
          <p className="text-emerald-100 text-sm mt-2">Completed successfully</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp size={24} />
            </div>
            <ShieldCheck size={20} className="text-purple-200" />
          </div>
          <p className="text-purple-100 text-sm font-medium mb-1">Total Deliveries</p>
          <p className="text-4xl font-bold">{totalDeliveries}</p>
          <p className="text-purple-100 text-sm mt-2">Lifetime performance</p>
        </motion.div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none"
          >
            <option value="all">All staff</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-5 bg-slate-100 rounded-full mb-4">
              <Truck size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No delivery staff found</h3>
            <p className="text-slate-600 mb-6">
              {deliveryStaff.length === 0
                ? 'Get started by adding your first delivery person'
                : 'Try changing your search or status filter'}
            </p>
            <button
              onClick={() => {
                resetForm()
                setEditingStaff(null)
                setShowModal(true)
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Add Staff Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Staff Member</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vehicle</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Deliveries</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff, index) => {
                  const id = staff.deliveryPersonId || staff.DeliveryPersonId || staff.customerId || staff.CustomerId
                  const isActive = staff.isActive ?? staff.IsActive ?? true
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Staff Member */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                            {(staff.firstName || staff.FirstName)?.[0]}{(staff.lastName || staff.LastName)?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {staff.firstName || staff.FirstName} {staff.lastName || staff.LastName}
                            </p>
                            <p className="text-sm text-slate-500">ID: #{id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            <span className="truncate max-w-[200px]">{staff.email || staff.Email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            <span>{staff.phoneNumber || staff.PhoneNumber}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{staff.vehicleType || 'N/A'}</p>
                          <p className="text-slate-500">{staff.vehicleNumber || 'N/A'}</p>
                        </div>
                      </td>

                      {/* Deliveries */}
                      <td className="px-6 py-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{staff.totalDeliveries || 0}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-emerald-600">{staff.todaysDeliveries || 0}</span> today
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(staff)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {editingStaff ? 'Update the staff member details below' : 'Fill in the details to onboard a new delivery person'}
                </p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {!editingStaff && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingStaff}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Vehicle Type</label>
                    <input
                      type="text"
                      value={formData.vehicleType || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Bike, Car, Scooter..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="ABC-1234"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                  >
                    {editingStaff ? 'Save Changes' : 'Add Staff Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ManageDeliveryStaff