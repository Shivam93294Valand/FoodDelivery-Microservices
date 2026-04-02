import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import SearchBar from '../components/SearchBar'
import RestaurantCard from '../components/RestaurantCard'
import SkeletonCard from '../components/SkeletonCard'
import { api } from '../api/client'
import { Pizza, Coffee, UtensilsCrossed, Soup, Sandwich, IceCream, Star, Clock, TrendingUp, Award } from 'lucide-react'

const CATEGORIES = [
  { name: 'Pizza', icon: Pizza, color: 'bg-orange-100 text-orange-600' },
  { name: 'Burger', icon: Sandwich, color: 'bg-rose-100 text-rose-600' },
  { name: 'Sushi', icon: UtensilsCrossed, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Asian', icon: Soup, color: 'bg-amber-100 text-amber-600' },
  { name: 'Dessert', icon: IceCream, color: 'bg-pink-100 text-pink-600' },
  { name: 'Coffee', icon: Coffee, color: 'bg-indigo-100 text-indigo-600' },
]

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        navigate('/admin')
      } else if (user.role === 'DeliveryPerson') {
        navigate('/delivery-dashboard')
      }
    }
  }, [user, navigate])

  useEffect(() => {
    let mounted = true
    api
      .getRestaurants()
      .then((data) => {
        if (!mounted) return
        const allRestaurants = Array.isArray(data) ? data : []
        // Filter to show only open/active restaurants
        const openRestaurants = allRestaurants.filter(r => 
          (r.isActive ?? r.IsActive ?? true) === true
        )
        setRestaurants(openRestaurants)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e.message || 'Failed to load restaurants')
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    let res = restaurants
    const q = query.trim().toLowerCase()

    if (activeCategory) {
      res = res.filter(r =>
        (r.cuisine || '').toLowerCase().includes(activeCategory.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(activeCategory.toLowerCase())
      )
    }

    if (!q) return res

    return res.filter((r) =>
      [r.name, r.cuisine, r.address, r.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [restaurants, query, activeCategory])

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-md ring-1 ring-emerald-200 px-5 py-2 text-sm font-bold text-emerald-700 mb-8 shadow-lg"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                Live now in your city
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-6"
              >
                Crave it.
                <br />
                <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent inline-block animate-gradient">
                  Get it fast.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-black/70 max-w-xl leading-relaxed mb-10 font-medium"
              >
                The best restaurants in your city, delivering delicious food to your doorstep in minutes.
                <span className="text-black/90 font-semibold">Fresh, fast, and ready to eat.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-xl mb-8"
              >
                <SearchBar value={query} onChange={setQuery} />
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-6 max-w-xl"
              >
                <div className="text-center">
                  <div className="text-3xl font-black text-black mb-1">{restaurants.length}+</div>
                  <div className="text-sm text-black/60 font-medium">Restaurants</div>
                </div>
                <div className="text-center border-x border-black/10">
                  <div className="text-3xl font-black text-black mb-1">30</div>
                  <div className="text-sm text-black/60 font-medium">Min Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black mb-1">4.8</div>
                  <div className="text-sm text-black/60 font-medium">Rating</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Images Grid */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 lg:grid-cols-3 gap-4 perspective-1000"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 0 }}
                className="h-44 lg:h-52 rounded-3xl overflow-hidden shadow-2xl -rotate-6 ring-2 ring-white"
              >
                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop" alt="Burger" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: 0 }}
                className="h-52 lg:h-60 rounded-3xl overflow-hidden shadow-2xl translate-y-8 ring-2 ring-white z-10"
              >
                <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop" alt="Pizza" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 0 }}
                className="h-36 lg:h-44 rounded-3xl overflow-hidden shadow-2xl -rotate-6 hidden lg:block ring-2 ring-white"
              >
                <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop" alt="Salad" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 0 }}
                className="h-36 lg:h-44 rounded-3xl overflow-hidden shadow-2xl -rotate-3 ring-2 ring-white"
              >
                <img src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop" alt="Sushi" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: 0 }}
                className="h-44 lg:h-52 rounded-3xl overflow-hidden shadow-2xl translate-y-4 hidden lg:block ring-2 ring-white"
              >
                <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop" alt="Food" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 0 }}
                className="h-56 lg:h-64 rounded-3xl overflow-hidden shadow-2xl rotate-[4deg] ring-2 ring-white"
              >
                <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop" alt="BBQ" className="w-full h-full object-cover" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Browse by Category</h2>
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat, index) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap shadow-lg ${activeCategory === cat.name
                    ? 'bg-black text-white scale-105'
                    : 'bg-white text-black/80 hover:shadow-xl'
                    }`}
                >
                  <div className={`p-2 rounded-xl ${activeCategory === cat.name ? 'bg-white/20' : cat.color
                    }`}>
                    {(() => {
                      const Icon = cat.icon;
                      return <Icon className="size-5" />;
                    })()}
                  </div>
                  <span className="font-bold text-base">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Restaurants Section */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight text-black mb-2">
                {activeCategory ? `Best ${activeCategory} places` : 'Popular Restaurants'}
              </h2>
              <p className="text-black/60 font-medium">Discover amazing food near you</p>
            </div>
          </motion.div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-center">
              <p className="text-rose-600 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-rose-700 underline hover:text-rose-800"
              >
                Try refreshing
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filtered.map((r, index) => (
                <motion.div
                  key={r.restaurantId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  whileHover={{ y: -8 }}
                >
                  <Link to={`/restaurant/${r.restaurantId}`}>
                    <RestaurantCard restaurant={r} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && !error && filtered?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <UtensilsCrossed className="size-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No restaurants found</h3>
              <p className="text-gray-500">Try changing your category or search query.</p>
            </div>
          )}
        </section>
      </main>
    </>
  )
}

export default Home