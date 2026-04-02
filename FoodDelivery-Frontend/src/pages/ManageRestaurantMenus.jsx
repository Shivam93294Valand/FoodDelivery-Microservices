import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Edit, Trash2, ArrowLeft, Search, ChefHat, DollarSign, Clock, ImageIcon, X } from 'lucide-react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'

const ManageRestaurantMenus = () => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    isAvailable: true,
    isVegetarian: false,
    preparationTime: '',
    ingredients: '',
    allergens: ''
  })

  useEffect(() => {
    loadData()
  }, [restaurantId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [restaurantData, menuData] = await Promise.all([
        api.getRestaurant(restaurantId),
        api.getMenuItems(restaurantId).catch(() => [])
      ])
      setRestaurant(restaurantData)
      setMenuItems(Array.isArray(menuData) ? menuData : [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load restaurant data: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        restaurantId: parseInt(restaurantId),
        price: parseFloat(formData.price),
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : [],
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : []
      }

      if (editingItem) {
        await api.updateMenuItem(editingItem.menuItemId || editingItem.MenuItemId, payload)
        toast.success('Menu item updated successfully')
      } else {
        await api.createMenuItem(payload)
        toast.success('Menu item created successfully')
      }

      setShowModal(false)
      setEditingItem(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save menu item:', error)
      toast.error('Failed to save menu item: ' + (error.message || 'Unknown error'))
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || item.Name || '',
      description: item.description || item.Description || '',
      price: (item.price || item.Price || '').toString(),
      category: item.category || item.Category || '',
      imageUrl: item.imageUrl || item.ImageUrl || '',
      isAvailable: item.isAvailable ?? item.IsAvailable ?? true,
      isVegetarian: item.isVegetarian ?? item.IsVegetarian ?? false,
      preparationTime: (item.preparationTime || item.PreparationTime || '').toString(),
      ingredients: Array.isArray(item.ingredients || item.Ingredients)
        ? (item.ingredients || item.Ingredients).join(', ')
        : '',
      allergens: Array.isArray(item.allergens || item.Allergens)
        ? (item.allergens || item.Allergens).join(', ')
        : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    try {
      await api.deleteMenuItem(itemId)
      toast.success('Menu item deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete menu item:', error)
      toast.error('Failed to delete menu item: ' + (error.message || 'Unknown error'))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      imageUrl: '',
      isAvailable: true,
      isVegetarian: false,
      preparationTime: '',
      ingredients: '',
      allergens: ''
    })
  }

  const filteredItems = menuItems.filter(item => {
    const itemName = item.name || item.Name || ''
    const itemDesc = item.description || item.Description || ''
    const itemCat = item.category || item.Category || 'Uncategorized'

    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemDesc.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || itemCat === activeCategory

    return matchesSearch && matchesCategory
  })

  const categories = ['All', ...new Set(menuItems.map(item => item.category || item.Category || 'Uncategorized').filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="size-12 rounded-full border-4 border-orange-600/20 border-t-orange-600"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="size-8 text-orange-500" />
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {restaurant?.name || restaurant?.Name} Menu
                </h1>
              </div>
              <p className="text-gray-500">Manage your menu items, pricing, and availability</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingItem(null)
                resetForm()
                setShowModal(true)
              }}
              className="flex items-center justify-center bg-black text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="size-5 mr-2" />
              Add Menu Item
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.menuItemId || item.MenuItemId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {(item.imageUrl || item.ImageUrl) ? (
                    <img
                      src={item.imageUrl || item.ImageUrl}
                      alt={item.name || item.Name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                      <ImageIcon className="size-10 opacity-50" />
                      <span className="text-sm">No Image</span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg backdrop-blur-md shadow-sm ${(item.isAvailable ?? item.IsAvailable)
                        ? 'bg-green-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                      }`}>
                      {(item.isAvailable ?? item.IsAvailable) ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {(item.isVegetarian ?? item.IsVegetarian) && (
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100/90 backdrop-blur-md text-green-700 text-xs font-bold rounded-lg shadow-sm">
                        🌱 Veg
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                        {item.name || item.Name}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {item.category || item.Category || 'Uncategorized'}
                      </span>
                    </div>
                    <div className="font-bold text-lg text-orange-600">
                      ${(item.price || item.Price).toFixed(2)}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                    {item.description || item.Description || 'No description available'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                    {(item.preparationTime || item.PreparationTime) && (
                      <div className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        <span>{item.preparationTime || item.PreparationTime} min</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="size-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.menuItemId || item.MenuItemId)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-8">
            <div className="p-4 bg-gray-50 rounded-full inline-block mb-4">
              <ChefHat className="size-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No items found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new item.</p>
          </div>
        )}

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
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingItem ? 'Edit Menu Item' : 'Create New Item'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Fill in the details for your dish</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="size-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Item Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                        placeholder="e.g. Margherita Pizza"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Price ($) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                      placeholder="Describe the dish..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                        placeholder="e.g. Starter, Main, Dessert"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Prep Time (mins)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                          type="number"
                          value={formData.preparationTime}
                          onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                          placeholder="15"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Image URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Ingredients</label>
                      <input
                        type="text"
                        value={formData.ingredients}
                        onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                        placeholder="Comma separated"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Allergens</label>
                      <input
                        type="text"
                        value={formData.allergens}
                        onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                        placeholder="Comma separated"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${formData.isAvailable ? 'bg-orange-500 border-orange-500' : 'border-gray-300 group-hover:border-orange-400'}`}>
                        {formData.isAvailable && <Plus className="size-4 text-white rotate-45" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                        className="hidden"
                      />
                      <span className="text-sm font-medium text-gray-700 select-none">Available for order</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${formData.isVegetarian ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-green-400'}`}>
                        {formData.isVegetarian && <Plus className="size-4 text-white rotate-45" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isVegetarian}
                        onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                        className="hidden"
                      />
                      <span className="text-sm font-medium text-gray-700 select-none">Vegetarian Friendly</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
                    >
                      {editingItem ? 'Save Changes' : 'Create Item'}
                    </button>
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

export default ManageRestaurantMenus
