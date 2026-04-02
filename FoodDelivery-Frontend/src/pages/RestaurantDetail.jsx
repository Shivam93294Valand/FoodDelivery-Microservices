import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Phone,
  Share2,
  Search,
  ShoppingCart,
  Leaf,
  UtensilsCrossed,
  ChevronRight,
  BadgeCheck,
  Timer,
  Plus,
  Flame
} from 'lucide-react'
import { toast } from '../components/ToastContainer'

const RestaurantDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, count } = useCart()
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  const normalizeMenuItem = (item) => ({
    menuItemId: item?.menuItemId ?? item?.MenuItemId ?? item?.MenuItemID ?? 0,
    name: item?.name ?? item?.Name ?? '',
    description: item?.description ?? item?.Description ?? '',
    price: item?.price ?? item?.Price ?? 0,
    category: item?.category ?? item?.Category ?? 'Other',
    imageUrl: item?.imageUrl ?? item?.ImageUrl ?? '',
    isAvailable: item?.isAvailable ?? item?.IsAvailable ?? true,
    isVegetarian: item?.isVegetarian ?? item?.IsVegetarian ?? false,
    preparationTime: item?.preparationTime ?? item?.PreparationTime ?? 0
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        const [restaurantData, menuData] = await Promise.all([
          api.getRestaurant(id),
          api.getMenuItems(id)
        ])

        if (!mounted) return
        setRestaurant(restaurantData)
        const items = Array.isArray(menuData) ? menuData : (menuData?.items || [])
        setMenuItems(items.map(normalizeMenuItem))
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load restaurant details')
        toast.error('Failed to load restaurant')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [id, user])

  const handleAddToCart = (item) => {
    addItem(
      {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: 1,
        imageUrl: item.imageUrl
      },
      {
        restaurantId: restaurant?.restaurantId || restaurant?.RestaurantId,
        name: restaurant?.name || restaurant?.Name
      }
    )
    toast.success(`${item.name} added to cart!`)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurant?.name || restaurant?.Name,
        text: `Check out ${restaurant?.name || restaurant?.Name}!`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-full border-4 border-orange-200 border-t-orange-600 shadow-lg mx-auto mb-4"
          />
          <div className="flex items-center justify-center gap-2">
            <UtensilsCrossed className="size-5 text-orange-600 animate-pulse" />
            <p className="text-sm font-bold text-slate-600">Loading delicious menu...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-rose-100"
        >
          <div className="size-24 rounded-[2rem] bg-rose-50 flex items-center justify-center mx-auto mb-8">
            <UtensilsCrossed className="size-12 text-rose-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Restaurant Unavailable</h2>
          <p className="text-slate-500 mb-10 leading-relaxed">{error || 'This kitchen is currently closed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
          >
            Browse Restaurants
          </button>
        </motion.div>
      </div>
    )
  }

  const categories = ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean))]
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.isAvailable
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/10 to-rose-50/20">
      <motion.nav
        initial={false}
        animate={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0)',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
        }}
        className="fixed top-20 left-0 right-0 z-40 border-b border-transparent transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className={`p-3 rounded-xl transition-all ${scrolled ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' : 'bg-white/90 backdrop-blur-md text-slate-900 hover:bg-white shadow-lg'}`}
          >
            <ArrowLeft className="size-5" />
          </button>

          {scrolled && restaurant && (
            <motion.divhandleToggleFavorite
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 ml-4 hidden md:flex items-center gap-3"
            >
              <div className="size-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                <UtensilsCrossed className="size-5 text-white" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">{restaurant.name || restaurant.Name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Star className="size-3 text-amber-500 fill-amber-500" />
                  <span className="font-bold">{(restaurant.rating || restaurant.Rating || 4.5).toFixed(1)}</span>
                  <span>•</span>
                  <span>{restaurant.cuisine || restaurant.Cuisine}</span>
                </div>
              </div>
            </motion.divhandleToggleFavorite>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className={`p-3 rounded-xl transition-all ${scrolled ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' : 'bg-white/90 backdrop-blur-md hover:bg-white shadow-lg'}`}
            >
              <Share2 className="size-5 text-slate-700" />
            </button>
          </div>
        </div>
      </motion.nav>

      <section className="relative pt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-6 shadow-lg shadow-orange-500/30">
                <BadgeCheck className="size-4" />
                Verified Restaurant
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-tight tracking-tighter mb-6">
                {restaurant.name || restaurant.Name}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                {restaurant.description || restaurant.Description || 'Discover authentic flavors crafted with passion and served with love.'}
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-lg border border-slate-100">
                  <Star className="size-6 text-amber-500 fill-amber-500" />
                  <div>
                    <p className="text-2xl font-black text-slate-900">{(restaurant.rating || restaurant.Rating || 4.5).toFixed(1)}</p>
                    <p className="text-xs text-slate-500 font-medium">Rating</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-orange-500 to-rose-500 text-white px-5 py-3 rounded-2xl shadow-lg">
                  <UtensilsCrossed className="size-6" />
                  <div>
                    <p className="text-lg font-black">{restaurant.cuisine || restaurant.Cuisine}</p>
                    <p className="text-xs opacity-90 font-medium">Cuisine</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-lg border border-slate-100">
                  <Clock className="size-6 text-blue-600" />
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {restaurant.openingTime || restaurant.OpeningTime} - {restaurant.closingTime || restaurant.ClosingTime}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Open Hours</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-300 transition-all hover:shadow-lg">
                  <div className="size-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="size-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-sm font-medium text-slate-900 leading-tight">
                      {restaurant.address || restaurant.Address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg">
                  <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="size-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-sm font-bold text-slate-900">
                      {restaurant.phoneNumber || restaurant.PhoneNumber}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-rose-500 rounded-[3rem] blur-3xl opacity-20" />
              <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                {(restaurant.imageUrl || restaurant.ImageUrl) ? (
                  <img
                    src={restaurant.imageUrl || restaurant.ImageUrl}
                    alt={restaurant.name || restaurant.Name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600 flex items-center justify-center">
                    <UtensilsCrossed className="size-32 text-white/30" />
                  </div>
                )}
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-2xl p-4 border-4 border-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Flame className="size-6 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Popular</p>
                    <p className="text-lg font-black text-slate-900">{menuItems.length}+ Items</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl border border-slate-200 shadow-lg p-4 mb-8 sticky top-40 z-30 backdrop-blur-xl bg-white/95">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hidden pb-2 lg:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Our Menu</h2>
            <p className="text-slate-500 font-medium">{filteredItems.length} delicious items</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
            <Leaf className="size-4" />
            <span className="text-xs font-bold">Veg Options Available</span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <UtensilsCrossed className="size-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Items Found</h3>
            <p className="text-slate-500">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.menuItemId}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={item.imageUrl || '/images/default-food.svg'}
                    alt={item.name}
                    onError={(e) => { e.target.src = '/images/default-food.svg' }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.isVegetarian && (
                      <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-lg">
                        <Leaf className="size-3" />
                        VEG
                      </div>
                    )}
                    {item.preparationTime > 0 && (
                      <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Timer className="size-3 text-orange-500" />
                        {item.preparationTime}min
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xl">
                      <p className="text-xl font-black text-slate-900">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {item.description || 'A delicious item prepared with fresh ingredients.'}
                  </p>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full py-3 bg-slate-900 hover:bg-gradient-to-r hover:from-orange-500 hover:to-rose-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl group/btn"
                  >
                    <Plus className="size-4 group-hover/btn:rotate-90 transition-transform" />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {count > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => navigate('/cart')}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full font-black text-sm flex items-center gap-3 shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 transition-all"
          >
            <div className="size-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ShoppingCart className="size-5" />
            </div>
            <span>{count} {count === 1 ? 'Item' : 'Items'} in Cart</span>
            <ChevronRight className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RestaurantDetail
