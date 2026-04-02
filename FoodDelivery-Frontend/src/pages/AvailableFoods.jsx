import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { UtensilsCrossed, Search, Filter, ShoppingCart, Star, Clock, Leaf, MapPin, TrendingUp, X, ChevronDown } from 'lucide-react'
import { toast } from '../components/ToastContainer'

const AvailableFoods = () => {
  const navigate = useNavigate()
  const { addItem, items: cartItems } = useCart()
  const { user } = useAuth()
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
      setError(e.message || 'Failed to load available foods')
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGgxMnYxMkgzNnptMjQgMGgxMnYxMkg2MHpNMTIgMTE0aDEydjEySDE2em0yNCAwaDEydjEySDM2em0yNCAwaDEydjEySDYwek0xMiA5MGgxMnYxMkgxMnptMjQgMGgxMnYxMkgzNnptMjQgMGgxMnYxMkg2MHpNMTIgNjZoMTJ2MTJIMTJ6bTI0IDBoMTJ2MTJIMzZ6bTI0IDBoMTJ2MTJINjB6TTEyIDQyaDEydjEySDE2em0yNCAwaDEydjEySDM2em0yNCAwaDEydjEySDYwek0xMiAxOGgxMnYxMkgxMnptMjQgMGgxMnYxMkgzNnptMjQgMGgxMnYxMkg2MHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
              Delicious Food Awaits
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Discover amazing dishes from top restaurants near you
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for dishes, cuisines, restaurants..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl font-medium hover:bg-orange-100 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <X className="w-4 h-4" /> : <motion.div animate={{ rotate: showFilters ? 180 : 0 }}><ChevronDown className="w-4 h-4" /></motion.div>}
              </button>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <UtensilsCrossed className="w-5 h-5" />
              <span className="font-semibold">{sortedItems.length} dishes available</span>
            </div>
          </div>

          {/* Expandable Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
                    <div className="flex flex-wrap gap-2">
                      {cuisines.map(cuisine => (
                        <button
                          key={cuisine}
                          onClick={() => setSelectedCuisine(cuisine)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCuisine === cuisine
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Menu Items Grid */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No dishes found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedItems.map((item, index) => (
              <motion.div
                key={item.menuItemId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100"
              >
                {/* Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-gradient-to-br from-orange-100 to-red-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {item.isVegetarian && (
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg">
                        <Leaf className="w-3 h-3" />
                        Veg
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <span className="px-2 py-1 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {item.restaurantInfo.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2 h-10">
                      {item.description || 'Delicious food item'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{item.restaurantInfo.name}</span>
                  </div>

                  {item.preparationTime > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.preparationTime} mins</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-2xl font-bold text-orange-600">
                      ${item.price.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AvailableFoods