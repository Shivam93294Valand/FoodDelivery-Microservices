import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Store, Utensils, Trash2, ShoppingCart, Star, MapPin, Clock } from 'lucide-react'
import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ToastContainer'

const Favorites = () => {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState({ restaurants: [], menuItems: [] })
  const [activeTab, setActiveTab] = useState('restaurants')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [user])

  const loadFavorites = async () => {
    if (!user?.customerId) {
      setLoading(false)
      return
    }
    
    try {
      const data = await api.getFavorites(user.customerId)
      setFavorites(data || { restaurants: [], menuItems: [] })
    } catch (e) {
      console.error('Failed to load favorites:', e)
      toast.error('Could not load favorites')
    } finally {
      setLoading(false)
    }
  }

  const removeFavoriteRestaurant = async (restaurantId) => {
    if (!user?.customerId) return
    
    try {
      await api.removeFavoriteRestaurant(user.customerId, restaurantId)
      loadFavorites()
      toast.success('Removed from favorites')
    } catch (e) {
      console.error('Failed to remove favorite:', e)
      toast.error('Could not remove favorite')
    }
  }

  const removeFavoriteMenuItem = async (menuItemId) => {
    if (!user?.customerId) return
    
    try {
      await api.removeFavoriteMenuItem(user.customerId, menuItemId)
      loadFavorites()
      toast.success('Removed from favorites')
    } catch (e) {
      console.error('Failed to remove favorite:', e)
      toast.error('Could not remove favorite')
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
      restaurantId: item.restaurantId,
      name: item.restaurantName
    })
    toast.success(`${item.name} added to cart!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-xl">
              <Heart className="size-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                Your Favorites
              </h1>
              <p className="text-gray-600 text-lg font-medium">All your favorite restaurants and dishes in one place</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-8 bg-white rounded-2xl p-2 shadow-lg border border-gray-100 w-fit"
        >
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'restaurants'
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Store className="size-5" />
            <span>Restaurants</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'restaurants' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {favorites.restaurants.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('menuItems')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'menuItems'
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Utensils className="size-5" />
            <span>Food Items</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'menuItems' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {favorites.menuItems.length}
            </span>
          </button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'restaurants' && (
            <motion.div
              key="restaurants"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {favorites.restaurants.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
                  <div className="size-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                    <Store className="size-12 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">No favorite restaurants yet</h3>
                  <p className="text-gray-500 mb-8">Start exploring and add restaurants you love!</p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Browse Restaurants
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.restaurants.map((restaurant, index) => (
                    <motion.div
                      key={restaurant.restaurantId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border border-gray-100 relative"
                    >
                      <button
                        onClick={() => removeFavoriteRestaurant(restaurant.restaurantId)}
                        className="absolute top-3 right-3 z-10 size-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-red-500 hover:scale-110 transition-all group/btn"
                      >
                        <Trash2 className="size-5 text-red-500 group-hover/btn:text-white transition-colors" />
                      </button>

                      <Link to={`/restaurant/${restaurant.restaurantId}`}>
                        <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-100 to-rose-100">
                          {restaurant.imageUrl ? (
                            <img
                              src={restaurant.imageUrl}
                              alt={restaurant.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                              <Store className="size-16 text-white/30" />
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {restaurant.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                            {restaurant.description || restaurant.cuisine || 'Delicious food awaits you'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="size-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-bold text-gray-900">{(restaurant.rating || 4.5).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="size-4 text-gray-400" />
                              <span className="text-gray-600 truncate">{restaurant.cuisine || 'Various'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'menuItems' && (
            <motion.div
              key="menuItems"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {favorites.menuItems.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
                  <div className="size-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                    <Utensils className="size-12 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">No favorite dishes yet</h3>
                  <p className="text-gray-500 mb-8">Explore our menu and find your favorites!</p>
                  <button
                    onClick={() => navigate('/menu-items')}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.menuItems.map((item, index) => (
                    <motion.div
                      key={item.menuItemId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border border-gray-100 relative"
                    >
                      <button
                        onClick={() => removeFavoriteMenuItem(item.menuItemId)}
                        className="absolute top-3 right-3 z-10 size-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-red-500 hover:scale-110 transition-all group/btn"
                      >
                        <Trash2 className="size-5 text-red-500 group-hover/btn:text-white transition-colors" />
                      </button>

                      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-100 to-rose-100 relative">
                        <img
                          src={item.imageUrl || '/images/default-food.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute bottom-3 right-3">
                          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xl">
                            <p className="text-2xl font-black bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {item.description || 'Delicious food item'}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <MapPin className="size-4 text-orange-500" />
                          <span className="truncate">{item.restaurantName || 'Restaurant'}</span>
                        </div>

                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl font-black shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
                        >
                          <ShoppingCart className="size-5" />
                          Add to Cart
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Favorites
