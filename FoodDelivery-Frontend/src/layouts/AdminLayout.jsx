import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    Store,
    Truck,
    LogOut,
    Menu,
    Bell,
    ChevronRight,
    Search,
    Settings,
    Shield,
    TrendingUp,
    Package,
    MessageSquare,
    Star,
    Activity,
    BarChart3,
    Home,
    Utensils
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AdminProfileModal from '../components/AdminProfileModal'

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Scroll to top when location changes
    useEffect(() => {
        // Find the main content area and scroll it to top
        const mainContent = document.querySelector('main.flex-1')
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'instant' })
        }
    }, [location.pathname])

    const navItems = [
        { 
            title: 'Dashboard', 
            path: '/admin', 
            icon: LayoutDashboard,
            gradient: 'from-purple-500 to-pink-500',
            iconColor: 'text-purple-400',
            bgHover: 'hover:bg-purple-500/10'
        },
        { 
            title: 'Customers', 
            path: '/admin/users', 
            icon: Users,
            gradient: 'from-blue-500 to-cyan-500',
            iconColor: 'text-blue-400',
            bgHover: 'hover:bg-blue-500/10'
        },
        { 
            title: 'Restaurants', 
            path: '/admin/restaurants', 
            icon: Utensils,
            gradient: 'from-orange-500 to-red-500',
            iconColor: 'text-orange-400',
            bgHover: 'hover:bg-orange-500/10'
        },
        { 
            title: 'Delivery Staff', 
            path: '/admin/delivery-persons', 
            icon: Truck,
            gradient: 'from-green-500 to-emerald-500',
            iconColor: 'text-green-400',
            bgHover: 'hover:bg-green-500/10'
        },
    ]

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_45%)] font-sans text-slate-900">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="fixed left-0 top-0 z-40 h-full bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-in-out"
            >
                <div className="relative flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200">
                        <Link to="/admin" className="flex items-center gap-3 group">
                            <motion.div 
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg group-hover:shadow-xl transition-shadow"
                            >
                                <Shield size={26} className="drop-shadow-lg" />
                            </motion.div>
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.span 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="text-xl font-bold tracking-tight text-slate-900"
                                    >
                                        Food<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">Admin</span>
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
                        {navItems.map((item, index) => {
                            const isActive = location.pathname === item.path
                            return (
                                <motion.div
                                    key={item.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={item.path}
                                        className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                                            isActive
                                                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-[1.02]`
                                                : `text-slate-600 ${item.bgHover} hover:text-slate-900 hover:scale-[1.02] hover:bg-slate-50`
                                        }`}
                                    >
                                        {/* Active indicator */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute -left-1 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-amber-500 to-rose-500"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        
                                        {/* Icon with background */}
                                        <div className={`relative ${!isActive && 'group-hover:scale-110 transition-transform'}`}>
                                            <item.icon 
                                                size={22} 
                                                className={isActive ? 'text-white drop-shadow-md' : `${item.iconColor} group-hover:text-slate-900 transition-colors`} 
                                            />
                                        </div>
                                        
                                        <AnimatePresence>
                                            {isSidebarOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    className="flex flex-1 items-center justify-between overflow-hidden"
                                                >
                                                    <span className="font-semibold text-[15px]">{item.title}</span>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ type: "spring", stiffness: 200 }}
                                                        >
                                                            <ChevronRight size={18} className="text-white/80" />
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="border-t border-slate-200 p-4">
                        {isSidebarOpen ? (
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm"
                            >
                                <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-slate-200">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-md"></div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold truncate text-slate-900">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                        {user?.role || 'Administrator'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 text-slate-500 hover:text-rose-500 transition-all rounded-xl hover:bg-white hover:scale-110"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </motion.div>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center justify-center p-3 text-slate-500 hover:text-rose-500 transition-all rounded-xl hover:bg-slate-50 hover:scale-110"
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main
                className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}
            >
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-8 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="rounded-2xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <Menu size={22} />
                        </motion.button>

                        <div className="hidden md:flex items-center gap-3">
                            <div className="rounded-full bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-600 border border-amber-200">Admin Console</div>
                            <div className="h-5 w-px bg-slate-300" />
                            <span className="text-sm font-semibold text-slate-700">Operations Overview</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative hidden lg:block">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search dashboards, users, orders..."
                            className="w-96 rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-4 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative rounded-2xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <Bell size={20} />
                            <span className="absolute right-1.5 top-1.5 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-rose-500 to-pink-500 text-white text-[10px] font-bold items-center justify-center shadow-lg">3</span>
                            </span>
                        </motion.button>
                        
                        {/* Settings */}
                        <motion.button 
                            whileHover={{ scale: 1.05, rotate: 90 }}
                            whileTap={{ scale: 0.95 }}
                            className="rounded-2xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <Settings size={20} />
                        </motion.button>
                        
                        <div className="h-8 w-px bg-slate-300 mx-2" />
                        
                        {/* User Profile */}
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setShowProfileModal(true)}
                            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-md"></div>
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-bold text-slate-900">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                    {user?.role || 'Administrator'}
                                </p>
                            </div>
                        </motion.button>
                    </div>
                </header>

                {/* Page Content with decorative background */}
                <div className="relative min-h-full">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-200/20 to-orange-200/20 rounded-full blur-3xl -z-10"></div>
                    
                    <div className="relative p-8 pb-12">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Admin Profile Modal */}
            <AdminProfileModal 
                isOpen={showProfileModal} 
                onClose={() => setShowProfileModal(false)} 
            />
        </div>
    )
}

export default AdminLayout