import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Store, Plus, Edit, Trash2, Clock, Phone, MapPin, X, Power, Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'

const ManageRestaurants = () => {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phoneNumber: '',
    email: '',
    cuisine: '',
    imageUrl: '',
    openingTime: '09:00',
    closingTime: '22:00'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const restaurantsData = await api.getAdminRestaurants().catch(() => api.getRestaurants())

      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRestaurant) {
        await api.updateAdminRestaurant(editingRestaurant.restaurantId || editingRestaurant.RestaurantId, formData)
        toast.success('Restaurant updated successfully!')
      } else {
        await api.createAdminRestaurant(formData)
        toast.success('Restaurant created successfully!')
      }
      setShowModal(false)
      setEditingRestaurant(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save restaurant:', error)
      toast.error('Failed to save restaurant: ' + (error.message || 'Unknown error'))
    }
  }

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant)
    setFormData({
      name: restaurant.name || restaurant.Name || '',
      description: restaurant.description || restaurant.Description || '',
      address: restaurant.address || restaurant.Address || '',
      phoneNumber: restaurant.phoneNumber || restaurant.PhoneNumber || '',
      email: restaurant.email || restaurant.Email || '',
      cuisine: restaurant.cuisine || restaurant.Cuisine || '',
      imageUrl: restaurant.imageUrl || restaurant.ImageUrl || '',
      openingTime: restaurant.openingTime || restaurant.OpeningTime || '09:00',
      closingTime: restaurant.closingTime || restaurant.ClosingTime || '22:00'
    })
    setShowModal(true)
  }

  const handleDelete = async (restaurantId) => {
    if (!confirm('Are you sure you want to delete this restaurant? This will also delete all its menu items.')) return
    try {
      await api.deleteAdminRestaurant(restaurantId)
      toast.success('Restaurant deleted successfully!')
      loadData()
    } catch (error) {
      console.error('Failed to delete restaurant:', error)
      toast.error('Failed to delete restaurant: ' + (error.message || 'Unknown error'))
    }
  }

  const handleToggleStatus = async (restaurantId, currentStatus) => {
    try {
      const response = await api.toggleRestaurantStatus(restaurantId)
      const newStatus = !currentStatus
      setRestaurants(prevRestaurants => 
        prevRestaurants.map(r => 
          (r.restaurantId || r.RestaurantId) === restaurantId 
            ? { ...r, isActive: newStatus, IsActive: newStatus }
            : r
        )
      )
      
      toast.success(`Restaurant ${newStatus ? 'activated' : 'deactivated'} successfully!`)
      
      // Reload data to ensure consistency with backend
      await loadData()
    } catch (error) {
      console.error('Failed to toggle restaurant status:', error)
      toast.error('Failed to toggle restaurant status: ' + (error.message || 'Unknown error'))
      // Reload data on error to revert any optimistic update
      loadData()
    }
  }


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      phoneNumber: '',
      email: '',
      cuisine: '',
      imageUrl: '',
      openingTime: '09:00',
      closingTime: '22:00'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="size-12 rounded-full border-4 border-purple-600/20 border-t-purple-600"
        />
      </div>
    )
  }

  const visibleRestaurants = [...restaurants]
    .filter((restaurant) => {
      const name = (restaurant.name || restaurant.Name || '').toLowerCase()
      const cuisine = (restaurant.cuisine || restaurant.Cuisine || '').toLowerCase()
      const address = (restaurant.address || restaurant.Address || '').toLowerCase()
      const searchValue = searchQuery.trim().toLowerCase()
      const matchesSearch = !searchValue ||
        name.includes(searchValue) ||
        cuisine.includes(searchValue) ||
        address.includes(searchValue)

      const isActive = restaurant.isActive ?? restaurant.IsActive
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive)

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || b.Rating || 0) - (a.rating || a.Rating || 0)
      }
      if (sortBy === 'newest') {
        return (b.restaurantId || b.RestaurantId || 0) - (a.restaurantId || a.RestaurantId || 0)
      }

      const nameA = (a.name || a.Name || '').toLowerCase()
      const nameB = (b.name || b.Name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

  const activeCount = restaurants.filter((r) => r.isActive ?? r.IsActive).length
  const inactiveCount = restaurants.length - activeCount

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.11),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.12),transparent_45%)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              Manage Restaurants
            </h1>
            <p className="text-slate-600">Control restaurant onboarding, visibility, and menus</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{restaurants.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Active</p>
              <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-rose-700">Inactive</p>
              <p className="text-2xl font-bold text-rose-700">{inactiveCount}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingRestaurant(null)
              resetForm()
              setShowModal(true)
            }}
            className="flex items-center justify-center bg-black text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-800 transition-all"
          >
            <Plus className="size-5 mr-2" />
            Add Restaurant
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search by name, cuisine, or address"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
              >
                <option value="all">All status</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="rating">Sort: Highest Rating</option>
                <option value="newest">Sort: Newest</option>
              </select>

              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                <SlidersHorizontal size={15} />
                {visibleRestaurants.length} shown
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {visibleRestaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.restaurantId || restaurant.RestaurantId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
                {(restaurant.imageUrl || restaurant.ImageUrl) ? (
                  <img
                    src={restaurant.imageUrl || restaurant.ImageUrl}
                    alt={restaurant.name || restaurant.Name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Store className="size-16 opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-md shadow-sm ${(restaurant.isActive ?? restaurant.IsActive)
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                    }`}>
                    {(restaurant.isActive ?? restaurant.IsActive) ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-bold text-xl text-gray-900 mb-1 line-clamp-1">
                    {restaurant.name || restaurant.Name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">
                      {restaurant.cuisine || restaurant.Cuisine}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <span className="text-sm">⭐</span>
                      <span className="text-sm font-bold text-gray-700">
                        {(restaurant.rating || restaurant.Rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                  {restaurant.description || restaurant.Description}
                </p>

                <div className="text-sm text-gray-500 space-y-2 mb-5">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-gray-400" />
                    <span className="truncate">{restaurant.address || restaurant.Address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-gray-400" />
                    {restaurant.phoneNumber || restaurant.PhoneNumber}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-gray-400" />
                    {restaurant.openingTime || restaurant.OpeningTime} - {restaurant.closingTime || restaurant.ClosingTime}
                  </p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link
                    to={`/admin/restaurants/${restaurant.restaurantId || restaurant.RestaurantId}/menus`}
                    className="flex-1 p-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-medium text-sm text-center transition-colors"
                  >
                    Menu
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleStatus(restaurant.restaurantId || restaurant.RestaurantId, restaurant.isActive ?? restaurant.IsActive)}
                    className={`p-2 rounded-xl transition-colors ${
                      (restaurant.isActive ?? restaurant.IsActive) 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title={`${(restaurant.isActive ?? restaurant.IsActive) ? 'Deactivate' : 'Activate'} Restaurant`}
                  >
                    <Power className="size-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(restaurant)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Edit"
                  >
                    <Edit className="size-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(restaurant.restaurantId || restaurant.RestaurantId)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {visibleRestaurants.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
          >
            <div className="p-4 bg-gray-50 rounded-full inline-block mb-4">
              <Store className="size-10 text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg">
              {restaurants.length === 0
                ? 'No restaurants yet. Add your first restaurant!'
                : 'No restaurants match current filters.'}
            </p>
          </motion.div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                    {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="size-6 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. The Burger Joint"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                    <textarea
                      placeholder="Tell us about the restaurant..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                    <input
                      type="text"
                      placeholder="Full address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        placeholder="info@restaurant.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine *</label>
                    <input
                      type="text"
                      placeholder="e.g. Italian, Indian, Chinese"
                      value={formData.cuisine}
                      onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Time</label>
                      <input
                        type="time"
                        value={formData.openingTime}
                        onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Closing Time</label>
                      <input
                        type="time"
                        value={formData.closingTime}
                        onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      {editingRestaurant ? 'Update Restaurant' : 'Create Restaurant'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ManageRestaurants