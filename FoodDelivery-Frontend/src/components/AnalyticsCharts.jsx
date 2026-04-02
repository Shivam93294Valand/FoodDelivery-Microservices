import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

export const OrderTrendsChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="orderCount"
                    stroke="#6366f1"
                    strokeWidth={3}
                    name="Orders"
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Revenue ($)"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}

export const TopCustomersChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="customerName" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Legend />
                <Bar
                    dataKey="totalSpent"
                    fill="#6366f1"
                    name="Total Spent ($)"
                    radius={[8, 8, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

export const FrequentItemsChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ itemName, orderCount }) => `${itemName}: ${orderCount}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="orderCount"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

export const RestaurantStatsCard = ({ stats }) => {
    if (!stats) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-400">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-10 h-10 mx-auto rounded-full border-4 border-green-600/20 border-t-green-600 mb-2"
                    />
                    <p>Loading statistics...</p>
                </div>
            </div>
        )
    }

    const statItems = [
        { 
            label: 'Total Restaurants', 
            value: stats.totalRestaurants || 0, 
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-50 to-purple-50',
            borderColor: 'border-indigo-200'
        },
        { 
            label: 'Active Restaurants', 
            value: stats.activeRestaurants || 0, 
            gradient: 'from-emerald-500 to-green-500',
            bgGradient: 'from-emerald-50 to-green-50',
            borderColor: 'border-emerald-200'
        },
        { 
            label: 'Average Rating', 
            value: (stats.averageRating || 0).toFixed(1) + ' ⭐', 
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-50',
            borderColor: 'border-amber-200'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statItems.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative overflow-hidden bg-gradient-to-br ${item.bgGradient} rounded-2xl p-6 border ${item.borderColor} shadow-sm hover:shadow-md transition-all`}
                >
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${item.gradient} opacity-10 rounded-full -mr-10 -mt-10`}></div>
                    <div className="relative">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">{item.label}</p>
                        <p className={`text-4xl font-bold bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent`}>
                            {item.value}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

export const DeliveryStatsCard = ({ stats, period = 'today' }) => {
    if (!stats) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-400">
                Loading...
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                <p className="text-sm font-medium text-indigo-700 mb-1">Deliveries</p>
                <p className="text-3xl font-bold text-indigo-900">{stats.deliveries || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                <p className="text-sm font-medium text-emerald-700 mb-1">Earnings</p>
                <p className="text-3xl font-bold text-emerald-900">${stats.earnings || 0}</p>
            </div>
        </div>
    )
}

export const AvgOrderValueChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`$${value}`, 'Avg Order Value']}
                />
                <Legend />
                <Bar
                    dataKey="avgOrderValue"
                    fill="#8b5cf6"
                    name="Avg Order Value ($)"
                    radius={[8, 8, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

export const RevenueComparisonChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Total Revenue ($)"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="avgOrderValue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    name="Avg Order ($)"
                    dot={{ fill: '#f59e0b', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
