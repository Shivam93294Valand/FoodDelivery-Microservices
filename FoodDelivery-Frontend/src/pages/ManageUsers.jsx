import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, Search, UserCheck, UserX, Users } from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'

const ManageUsers = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api.getCustomers()
      // Filter to ensure only customers are shown
      const customers = (Array.isArray(data) ? data : []).filter(user => {
        const role = (user.role || user.Role || '').toString().toLowerCase()
        return !role || role === 'customer' || role === ''
      })
      setUsers(customers)
    } catch (error) {
      console.error('Failed to load customers:', error)
      toast.error('Failed to load customers: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="size-12 rounded-full border-4 border-rose-600/20 border-t-rose-600"
        />
      </div>
    )
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filteredUsers = users.filter((user) => {
    const firstName = user.firstName || user.FirstName || ''
    const lastName = user.lastName || user.LastName || ''
    const email = user.email || user.Email || ''
    const phone = user.phoneNumber || user.PhoneNumber || ''
    const isActive = user.isActive ?? user.IsActive

    const matchesQuery = !normalizedQuery ||
      `${firstName} ${lastName}`.toLowerCase().includes(normalizedQuery) ||
      email.toLowerCase().includes(normalizedQuery) ||
      phone.toLowerCase().includes(normalizedQuery)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive)

    return matchesQuery && matchesStatus
  })

  const activeCount = users.filter((user) => user.isActive ?? user.IsActive).length
  const inactiveCount = users.length - activeCount

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_45%)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              Customers
            </h1>
            <p className="text-slate-600">View and monitor registered customers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="size-5 text-blue-600" />
                {users.length}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Active</p>
              <p className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
                <UserCheck className="size-5" />
                {activeCount}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-rose-700">Inactive</p>
              <p className="text-2xl font-bold text-rose-700 flex items-center gap-2">
                <UserX className="size-5" />
                {inactiveCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, or phone"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.customerId || user.CustomerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold mr-3">
                          {(user.firstName || user.FirstName || 'U')[0]}
                        </div>
                        <span className="font-medium text-gray-800">
                          {user.firstName || user.FirstName} {user.lastName || user.LastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email || user.Email}</td>
                    <td className="px-6 py-4 text-gray-600">{user.phoneNumber || user.PhoneNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(user.isActive || user.IsActive) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {(user.isActive || user.IsActive) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/admin/customers/${user.customerId || user.CustomerId}`)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="size-5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-slate-500">
                      No customers match your current search/filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ManageUsers
