import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, Shield, MapPin, Edit2, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { toast } from './ToastContainer'

const AdminProfileModal = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || ''
    })
    const [saving, setSaving] = useState(false)

    if (!isOpen) return null

    const handleSave = async () => {
        setSaving(true)
        try {
            const userId = user?.userId || user?.customerId
            await api.updateCustomer(userId, formData)
            if (updateUser) {
                updateUser({ ...user, ...formData })
            }
            
            toast.success('Profile updated successfully!')
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update profile:', error)
            toast.error('Failed to update profile: ' + (error.message || 'Unknown error'))
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
            address: user?.address || ''
        })
        setIsEditing(false)
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                    {/* Header Background */}
                    <div className="relative h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <button
                                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
                                title={isEditing ? 'Cancel' : 'Edit Profile'}
                            >
                                {isEditing ? <X size={20} /> : <Edit2 size={20} />}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="relative px-8 pb-8">
                        {/* Avatar */}
                        <div className="flex justify-center -mt-16 mb-6">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-white">
                                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-green-500 border-4 border-white shadow-lg flex items-center justify-center">
                                    <Shield size={20} className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Name and Role */}
                        <div className="text-center mb-8">
                            {isEditing ? (
                                <div className="flex gap-2 justify-center mb-4">
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="First Name"
                                    />
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Last Name"
                                    />
                                </div>
                            ) : (
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                    {formData.firstName} {formData.lastName}
                                </h2>
                            )}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg">
                                <Shield size={16} />
                                <span>{user?.role || 'Administrator'}</span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-4">
                            {/* Email */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100"
                            >
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                                    <Mail size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</p>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full mt-1 px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-900">{formData.email || 'Not provided'}</p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Phone */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100"
                            >
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
                                    <Phone size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</p>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                            className="w-full mt-1 px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-900">{formData.phoneNumber || 'Not provided'}</p>
                                    )}
                                </div>
                            </motion.div>

                            {/* User ID */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-rose-50 border border-orange-100"
                            >
                                <div className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                                    <User size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">User ID</p>
                                    <p className="text-sm font-semibold text-slate-900">#{user?.userId || user?.customerId || 'N/A'}</p>
                                </div>
                            </motion.div>

                            {/* Address */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100"
                            >
                                <div className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
                                    <MapPin size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</p>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            className="w-full mt-1 px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter address"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-900">{formData.address || 'Not provided'}</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Save Button */}
                        {isEditing && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={saving}
                                className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                <Save size={20} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </motion.button>
                        )}

                        {/* Stats */}
                        <div className="mt-8 grid grid-cols-3 gap-4">
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                <p className="text-2xl font-bold text-blue-600">Admin</p>
                                <p className="text-xs text-slate-600 mt-1">Access Level</p>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                                <p className="text-2xl font-bold text-green-600">Active</p>
                                <p className="text-xs text-slate-600 mt-1">Status</p>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                <p className="text-2xl font-bold text-purple-600">Full</p>
                                <p className="text-xs text-slate-600 mt-1">Permissions</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default AdminProfileModal
