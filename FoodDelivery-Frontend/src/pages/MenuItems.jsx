import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import { UtensilsCrossed, Search, Filter, ShoppingCart, Star, Clock, Leaf, MapPin, TrendingUp, X, ChevronDown } from 'lucide-react'
import { toast } from '../components/ToastContainer'

const MenuItems = () => {
  const navigate = useNavigate()
  const { addItem, items: cartItems } = useCart()
  const [restaurants, setRestaurants] = useState([])
  const [allMenuItems, setAllMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedCuisine, setSelectedCuisine] = useState('All')
  const [sortOption, setSortOption] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadAvailableFoods()
  }, [])

  const normalizeMenuItem = (item) => ({
    menuItemId: item?.menuItemId ?? item?.MenuItemId ?? item?.MenuItemID ?? 0,
    name: item?.name ?? item?.Name ?? '',
    description: item?.description ?? item?.Description ?? '',
    price: item?.price ?? item?.Price ?? 0,
    category: item?.category ?? item?.Category ?? '',
    imageUrl: item?.imageUrl ?? item?.ImageUrl ?? '',
    isAvailable: item?.isAvailable ?? item?.IsAvailable ?? true,
    isVegetarian: item?.isVegetarian ?? item?.IsVegetarian ?? false,
    preparationTime: item?.preparationTime ?? item?.PreparationTime ?? 0,
  })

  const loadAvailableFoods = async () => {
    setLoading(true)
    try {
      const restaurantsData = await api.getRestaurants()
      const openRestaurants = (Array.isArray(restaurantsData) ? restaurantsData : []).filter(r =>
        r.isActive ?? r.IsActive ?? true
      )

      setRestaurants(openRestaurants)

      const failedRestaurants = []
      const menuPromises = openRestaurants.map(restaurant => {
        const rId = restaurant.restaurantId || restaurant.RestaurantId
        if (!rId) {
          console.warn('Restaurant missing ID:', restaurant)
          return Promise.resolve({ restaurant, items: [] })
        }
        return api.getMenuItems(rId)
          .then(items => ({
            restaurant,
            items: Array.isArray(items) ? items.map(normalizeMenuItem).filter(item => item.isAvailable) : []
          }))
          .catch(err => {
            console.warn(`Failed to load menu for restaurant ${rId}:`, err)
            failedRestaurants.push(restaurant.name || restaurant.Name || rId)
            return { restaurant, items: [] }
          })
      })

      const menuResults = await Promise.all(menuPromises)

      const allItems = menuResults.flatMap(({ restaurant, items }) =>
        items.map(item => ({
          ...item,
          restaurantInfo: {
            restaurantId: restaurant.restaurantId || restaurant.RestaurantId,
            name: restaurant.name || restaurant.Name,
            cuisine: restaurant.cuisine || restaurant.Cuisine,
            rating: restaurant.rating || restaurant.Rating || 4.5
          }
        }))
      )

      if (failedRestaurants.length > 0) {
        if (failedRestaurants.length === openRestaurants.length) {
          setError('Failed to load any menus. Check services are running.')
        } else {
          toast.warning(`Some menus couldn't be loaded: ${failedRestaurants.slice(0, 3).join(', ')}`)
        }
      } else {
        setError('')
      }

      setAllMenuItems(allItems)
    } catch (e) {
      setError(e.message || 'Failed to load menu items')
      toast.error('Failed to load foods')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item) => {
    addItem({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl
    }, {
      restaurantId: item.restaurantInfo.restaurantId,
      name: item.restaurantInfo.name
    })
    toast.success(`${item.name} added to cart!`)
  }

  // Filter and sort logic
  const filteredItems = allMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesCuisine = selectedCuisine === 'All' || item.restaurantInfo.cuisine === selectedCuisine
    return matchesSearch && matchesCategory && matchesCuisine
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortOption) {
      case 'price-low': return a.price - b.price
      case 'price-high': return b.price - a.price
      case 'rating': return (b.restaurantInfo.rating || 0) - (a.restaurantInfo.rating || 0)
      default: return 0
    }
  })

  const categories = ['All', ...new Set(allMenuItems.map(item => item.category).filter(Boolean))]
  const cuisines = ['All', ...new Set(restaurants.map(r => r.cuisine || r.Cuisine).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-orange-600/20 border-t-orange-600"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-rose-50/40">
      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 text-white py-20 px-4 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-sm font-bold mb-6 border border-white/30"
            >
              <TrendingUp className="w-4 h-4" />
              Browse All Menu Items
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">
              Discover Your Next
              <br />
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                Favorite Meal
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-10 font-medium max-w-2xl mx-auto">
              Explore delicious dishes from the best restaurants in your area
            </p>

            {/* Enhanced Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center">
                  <Search className="absolute left-6 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for dishes, restaurants, cuisines..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 rounded-3xl text-gray-900 text-lg font-medium shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/40 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Modern Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                  showFilters 
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-orange-500/30' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                <motion.div animate={{ rotate: showFilters ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </button>

              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none px-5 py-3 pr-10 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none cursor-pointer transition-all hover:border-gray-300"
                >
                  <option value="popular">🔥 Popular</option>
                  <option value="price-low">💰 Price: Low to High</option>
                  <option value="price-high">💎 Price: High to Low</option>
                  <option value="rating">⭐ Top Rated</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-orange-50 to-rose-50 rounded-2xl border-2 border-orange-100">
              <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              <span className="font-black text-gray-900">{sortedItems.length}</span>
              <span className="text-gray-600 font-medium">dishes</span>
            </div>
          </div>

          {/* Expandable Filters with Better Design */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-6 mt-6 border-t-2 border-gray-100 space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Category
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {categories.map(cat => (
                        <motion.button
                          key={cat}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                            selectedCategory === cat
                              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {cat}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Cuisine
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {cuisines.map(cuisine => (
                        <motion.button
                          key={cuisine}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedCuisine(cuisine)}
                          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                            selectedCuisine === cuisine
                              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {cuisine}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-5 rounded-2xl mb-8 font-semibold"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* Menu Items Grid with Enhanced Cards */}
        {sortedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200"
          >
            <div className="size-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">No dishes found</h3>
            <p className="text-gray-500 text-lg">Try adjusting your filters or search query</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedItems.map((item, index) => (
              <motion.div
                key={item.menuItemId}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100"
              >
                {/* Enhanced Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10" />
                  <img
                    src={item.imageUrl || '/images/default-food.svg'}
                    alt={item.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-food.svg' }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                    {item.isVegetarian && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-black rounded-xl shadow-lg backdrop-blur-sm">
                        <Leaf className="w-3.5 h-3.5" />
                        VEG
                      </span>
                    )}
                    {item.preparationTime > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold rounded-xl shadow-lg">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        {item.preparationTime}min
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 z-20">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-black rounded-xl shadow-lg">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      {item.restaurantInfo.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3 z-20">
                    <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xl">
                      <p className="text-2xl font-black bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <h3 className="font-black text-xl text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed h-10">
                    {item.description || 'Delicious food prepared with fresh ingredients'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-5 font-medium">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="truncate">{item.restaurantInfo.name}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddToCart(item)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl font-black shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuItems
