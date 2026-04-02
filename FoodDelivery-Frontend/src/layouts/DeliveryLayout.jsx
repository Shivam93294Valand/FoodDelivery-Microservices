import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Package,
    History,
    User,
    LogOut,
    Bell,
    CheckCircle2,
    Circle,
    Home,
    Bike,
    TrendingUp,
    DollarSign,
    Menu,
    X,
    Zap,
    LayoutDashboard
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { toast } from '../components/ToastContainer'

const DeliveryLayout = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isOnline, setIsOnline] = useState(user?.isAvailable ?? true)
    const [notifications, setNotifications] = useState(3)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [stats, setStats] = useState({ today: 0, earnings: 0, rating: 0 })

    useEffect(() => {
        loadQuickStats()
        // Refresh stats every 30 seconds for real-time updates
        const interval = setInterval(loadQuickStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const loadQuickStats = async () => {
        try {
            if (user?.deliveryPersonId) {
                const data = await api.getDeliveryPersonStats(user.deliveryPersonId)
                
                // Extract values with multiple fallbacks for API compatibility
                const todayValue = (data && typeof data.today === 'object') ? data.today.deliveries : data?.todayDeliveries || data?.today || 0
                const earningsValue = data?.year?.earnings ?? data?.month?.earnings ?? data?.week?.earnings ?? data?.today?.earnings ?? data?.totalEarnings ?? 0
                const ratingValue = data?.avgRating || data?.rating || 0
                
                setStats({
                    today: Number(todayValue),
                    earnings: Number(earningsValue),
                    rating: Number(ratingValue)
                })
            }
        } catch (e) {
            console.error('Failed to load stats:', e)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleOnlineStatus = async () => {
        const newStatus = !isOnline
        try {
            setIsOnline(newStatus)
            if (user?.deliveryPersonId) {
                await api.updateDeliveryPersonAvailability(user.deliveryPersonId, newStatus)
            }
            toast.success(`You are now ${newStatus ? 'online' : 'offline'}`)
        } catch (e) {
            console.error('Failed to update status:', e)
            setIsOnline(!newStatus)
            toast.error('Failed to update status')
        }
    }

    const navItems = [
        { title: 'Dashboard', path: '/delivery-dashboard', icon: LayoutDashboard, badge: null },
        { title: 'Active Orders', path: '/delivery-person-dashboard', icon: Package, badge: stats.today },
        { title: 'History', path: '/deliveries', icon: History, badge: null },
        { title: 'Profile', path: '/delivery-profile', icon: User, badge: null },
    ]

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
            {/* Top Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between h-16 lg:h-18">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                whileTap={{ scale: 0.92 }}
                                className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </motion.button>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                                        <Bike className="text-white" size={20} strokeWidth={2.5} />
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-base font-black text-slate-900 leading-tight">DeliveryPro</p>
                                    <p className="text-xs text-slate-500 leading-tight">Partner Portal</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop quick stats */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2">
                                <Package size={16} className="text-indigo-600" />
                                <span className="text-sm font-black text-slate-900">{stats.today}</span>
                                <span className="text-xs text-slate-500 font-medium">today</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2">
                                <DollarSign size={16} className="text-emerald-600" />
                                <span className="text-sm font-black text-slate-900">${stats.earnings}</span>
                                <span className="text-xs text-slate-500 font-medium">earned</span>
                            </div>
                        </div>

                        {/* Right controls */}
                        <div className="flex items-center gap-2">
                            {/* Online toggle */}
                            <motion.button
                                onClick={toggleOnlineStatus}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                                    isOnline
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                        : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                                {isOnline ? <Zap size={14} /> : <Circle size={14} />}
                                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                            </motion.button>

                            {/* Bell */}
                            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                                <Bell size={20} />
                                {notifications > 0 && (
                                    <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-rose-500 ring-2 ring-white text-[9px] font-bold text-white flex items-center justify-center">
                                        {notifications}
                                    </span>
                                )}
                            </button>

                            {/* Avatar (desktop) */}
                            <div className="hidden lg:flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow">
                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </div>
                                <div className="leading-tight">
                                    <p className="text-sm font-bold text-slate-900">{user?.firstName}</p>
                                    <p className="text-[10px] text-slate-400">Partner</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Dark Desktop Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-64px)] sticky top-16 bg-slate-900 border-r border-slate-800">
                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto pt-6">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all group ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon
                                            size={18}
                                            className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}
                                            strokeWidth={2.5}
                                        />
                                        <span className="text-sm font-semibold">{item.title}</span>
                                    </div>
                                    {item.badge !== null && item.badge > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            isActive ? 'bg-white/25 text-white' : 'bg-indigo-600/30 text-indigo-300'
                                        }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Sidebar footer */}
                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/70 mb-3">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-xl font-semibold text-sm transition-all border border-slate-700"
                        >
                            <LogOut size={15} />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 min-h-[calc(100vh-64px)] p-4 lg:p-6 pb-24 lg:pb-6">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 z-50 lg:hidden shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs text-slate-400">Delivery Partner</p>
                                    </div>
                                </div>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-2 gap-3 p-4">
                                <div className="bg-slate-800 rounded-xl p-3">
                                    <p className="text-xl font-black text-white">{stats.today}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Trips today</p>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-3">
                                    <p className="text-xl font-black text-emerald-400">${stats.earnings}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Earned</p>
                                </div>
                            </div>

                            {/* Nav */}
                            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all ${
                                                isActive
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon size={18} strokeWidth={2.5} />
                                                <span className="font-semibold text-sm">{item.title}</span>
                                            </div>
                                            {item.badge !== null && item.badge > 0 && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    isActive ? 'bg-white/25 text-white' : 'bg-indigo-600/30 text-indigo-300'
                                                }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </nav>

                            {/* Drawer footer */}
                            <div className="p-4 border-t border-slate-800">
                                <button
                                    onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl font-bold text-sm transition-all border border-rose-600/20"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900 border-t border-slate-800">
                <div className="grid grid-cols-4 h-16">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
                                    isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="bottomNavIndicator"
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-400 rounded-full"
                                    />
                                )}
                                <item.icon size={20} strokeWidth={2.5} />
                                <span className="text-[10px] font-semibold">{item.title.split(' ')[0]}</span>
                                {item.badge !== null && item.badge > 0 && (
                                    <span className="absolute top-1 right-[22%] h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

export default DeliveryLayout
