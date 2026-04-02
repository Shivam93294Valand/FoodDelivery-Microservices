import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ShoppingBag, LogOut, User, Menu, X, Shield, Truck } from 'lucide-react'

const Header = () => {
  const location = useLocation()
  const { count } = useCart()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [orderNotFoundId, setOrderNotFoundId] = useState(() => sessionStorage.getItem('orderNotFound') || null)

  useEffect(() => {
    const handler = () => setOrderNotFoundId(sessionStorage.getItem('orderNotFound') || null)
    // Listen for updates dispatched by OrderDetail
    window.addEventListener('orderNotFoundUpdate', handler)
    if (location.pathname === '/orders' && sessionStorage.getItem('orderNotFound')) {
      sessionStorage.removeItem('orderNotFound')
      setOrderNotFoundId(null)
      window.dispatchEvent(new CustomEvent('orderNotFoundUpdate'))
    }
    return () => window.removeEventListener('orderNotFoundUpdate', handler)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path
  const userRole = user?.role || user?.Role || 'Customer'

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/5 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="size-10 rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg"
          >
            <span className="text-2xl">🍔</span>
          </motion.div>
          <motion.span
            whileHover={{ scale: 1.02 }}
            className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 bg-clip-text text-transparent"
          >
            Food Delivery
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-black/5 rounded-full border border-black/5">
          <Link
            to="/"
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/')
                ? 'bg-white text-black shadow-sm'
                : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
          >
            Home
          </Link>
          <Link
            to="/menu-items"
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/menu-items')
                ? 'bg-white text-black shadow-sm'
                : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
          >
            Menu Items
          </Link>
          {user && userRole === 'Admin' && (
            <Link
              to="/admin"
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${isActive('/admin')
                  ? 'bg-white text-black shadow-sm'
                  : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
            >
              <Shield className="size-4" />
              Admin
            </Link>
          )}
          {user && userRole === 'DeliveryPerson' && (
            <Link
              to="/delivery-dashboard"
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${isActive('/delivery-dashboard')
                  ? 'bg-white text-black shadow-sm'
                  : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
            >
              <Truck className="size-4" />
              Deliveries
            </Link>
          )}
          {user && userRole === 'Customer' && (
            <>
              <Link
                to="/orders"
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/orders')
                    ? 'bg-white text-black shadow-sm'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                  }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span>Orders</span>
                  {orderNotFoundId && (
                    <span title={`Order ${orderNotFoundId} not found`} className="inline-block w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </span>
              </Link>
              <Link
                to="/track-order"
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/track-order')
                    ? 'bg-white text-black shadow-sm'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                  }`}
              >
                Track
              </Link>
              <Link
                to="/payments"
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/payments')
                    ? 'bg-white text-black shadow-sm'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                  }`}
              >
                Payments
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {userRole === 'Customer' && (
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors group border border-transparent hover:border-black/5"
            >
              <ShoppingBag className="size-5 text-black/70 group-hover:text-black transition-colors" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 size-5 rounded-full bg-rose-500 text-white text-[11px] flex items-center justify-center font-bold ring-2 ring-white shadow-sm transform translate-x-1 -translate-y-1"
                >
                  {count}
                </motion.span>
              )}
            </Link>
          )}

          <div className="h-8 w-px bg-black/10 hidden md:block" />

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-2">
                <Link to="/profile" className="text-right hidden lg:block leading-tight hover:opacity-80 transition-opacity">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.firstName || user.FirstName || user.name} {user.lastName || user.LastName || ''}
                  </p>
                  <p className="text-xs text-black/50 truncate max-w-30">
                    <span className="inline-flex items-center gap-1">
                      {userRole === 'Admin' && <Shield className="size-3" />}
                      {userRole === 'DeliveryPerson' && <Truck className="size-3" />}
                      {userRole}
                    </span>
                  </p>
                </Link>
                <Link to="/profile" className="size-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-black/5 flex items-center justify-center shadow-inner hover:shadow-md transition-shadow">
                  <User className="size-5 text-black/50" />
                </Link>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={logout}
                  className="p-2.5 rounded-full text-black/60 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="Logout"
                >
                  <LogOut className="size-5" />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-black/70 hover:text-black hover:bg-black/5 transition-all"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-black/5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-black/5 p-4 space-y-4 shadow-xl"
          >
            <nav className="flex flex-col gap-2">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 font-medium">Home</Link>
              <Link to="/menu-items" onClick={() => setIsMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 font-medium">Menu Items</Link>
              {user && userRole === 'Admin' && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 font-medium flex items-center gap-2">
                  <Shield className="size-4" />
                  Admin Dashboard
                </Link>
              )}
              {user && userRole === 'DeliveryPerson' && (
                <Link to="/delivery" onClick={() => setIsMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 font-medium flex items-center gap-2">
                  <Truck className="size-4" />
                  My Deliveries
                </Link>
              )}
              {user && userRole === 'Customer' && (
                <>
                  <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 font-medium">Orders</Link>
                  <Link to="/deliveries" onClick={() => setIsMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 font-medium">Track Delivery</Link>
                  <Link to="/payments" onClick={() => setIsMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 font-medium">Payments</Link>
                </>
              )}
            </nav>
            <div className="h-px bg-black/5" />
            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors">
                    <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="size-5 text-black/50" />
                    </div>
                    <div>
                      <p className="font-semibold">{user.firstName || user.FirstName || user.name}</p>
                      <p className="text-xs text-black/50 flex items-center gap-1">
                        {userRole === 'Admin' && <Shield className="size-3" />}
                        {userRole === 'DeliveryPerson' && <Truck className="size-3" />}
                        {userRole}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                    className="p-3 rounded-xl flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-medium"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3 rounded-xl border border-black/10 text-center font-medium hover:bg-black/5"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3 rounded-xl bg-black text-white text-center font-medium hover:bg-black/90"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header