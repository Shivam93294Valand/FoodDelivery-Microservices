import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import {
  User,
  Mail,
  Phone,
  Bike,
  Calendar,
  Edit2,
  Save,
  X,
  Shield,
  Star,
  Package,
  DollarSign,
  Camera,
  AlertTriangle,
  Play,
  Pause,
  Coffee
} from 'lucide-react'
import { toast } from '../components/ToastContainer'

const DeliveryPersonProfile = () => {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [shiftStatus, setShiftStatus] = useState(null)
  const [emergencyMessage, setEmergencyMessage] = useState('')
  const [emergencyAlerts, setEmergencyAlerts] = useState([])
  const [submittingEmergency, setSubmittingEmergency] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      if (user?.deliveryPersonId) {
        const deliveryPersons = await api.getDeliveryPersons()
        const myProfile = deliveryPersons.find(
          p => (p.deliveryPersonId || p.DeliveryPersonId) === user.deliveryPersonId
        )
        if (myProfile) {
          setProfile(myProfile)
          setFormData({
            firstName: myProfile.firstName || myProfile.FirstName || '',
            lastName: myProfile.lastName || myProfile.LastName || '',
            phoneNumber: myProfile.phoneNumber || myProfile.PhoneNumber || '',
            email: myProfile.email || myProfile.Email || ''
          })
        }
      }
      try {
        const statsData = await api.getDeliveryPersonStats(user?.deliveryPersonId)
        setStats(statsData)
      } catch { /* stats not critical */ }
      try {
        const shift = await api.getDeliveryPersonShiftStatus(user?.deliveryPersonId)
        setShiftStatus(shift)
      } catch { /* shift not critical */ }
      try {
        const alerts = await api.getEmergencyAlerts(user?.deliveryPersonId)
        setEmergencyAlerts(Array.isArray(alerts) ? alerts : [])
      } catch { /* alerts not critical */ }
    } catch (err) {
      console.error('Failed to load profile:', err)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEdit = () => setEditing(true)

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setFormData({
        firstName: profile.firstName || profile.FirstName || '',
        lastName: profile.lastName || profile.LastName || '',
        phoneNumber: profile.phoneNumber || profile.PhoneNumber || '',
        email: profile.email || profile.Email || ''
      })
    }
  }

  const handleSave = async () => {
    try {
      await api.updateDeliveryPerson(user?.deliveryPersonId, formData)
      setProfile(prev => ({ ...prev, ...formData }))
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      console.error('Failed to save profile:', err)
      toast.error('Failed to update profile')
    }
  }

  const handleShiftAction = async (action) => {
    try {
      let result
      if (action === 'start') result = await api.startDeliveryPersonShift(user?.deliveryPersonId)
      else if (action === 'break') result = await api.toggleDeliveryPersonBreak(user?.deliveryPersonId)
      else if (action === 'end') result = await api.endDeliveryPersonShift(user?.deliveryPersonId)
      if (result) setShiftStatus(result)
      toast.success(`Shift ${action === 'start' ? 'started' : action === 'break' ? 'break toggled' : 'ended'}`)
    } catch (err) {
      console.error('Shift action failed:', err)
      toast.error('Shift action failed')
    }
  }

  const handleEmergencyAlert = async () => {
    try {
      setSubmittingEmergency(true)
      const alert = await api.raiseEmergencyAlert(user?.deliveryPersonId, { message: emergencyMessage })
      setEmergencyAlerts(prev => [alert, ...prev])
      setEmergencyMessage('')
      toast.success('Emergency alert sent')
    } catch (err) {
      console.error('Emergency alert failed:', err)
      toast.error('Failed to send emergency alert')
    } finally {
      setSubmittingEmergency(false)
    }
  }

  const firstName = formData.firstName || profile?.firstName || profile?.FirstName || ''
  const lastName = formData.lastName || profile?.lastName || profile?.LastName || ''
  const fullName = `${firstName} ${lastName}`.trim() || user?.name || 'Delivery Partner'
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'DP'
  const totalDeliveries = stats?.totalDeliveries || stats?.total || 0
  const todayDeliveries = stats?.todayDeliveries || stats?.today?.deliveries || 0
  const totalEarnings = stats?.totalEarnings || totalDeliveries * 50
  const avgRating = stats?.avgRating || stats?.rating || 4.8
  const currentShiftStatus = shiftStatus?.shiftStatus ?? 'OffShift'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Profile Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl"
      >
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-700/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-8 w-56 h-56 bg-violet-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group shrink-0">
              <div className="h-24 w-24 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl text-4xl font-black border-4 border-white/10 select-none">
                {initials}
              </div>
              <button className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={15} />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-black tracking-tight mb-1">{fullName}</h1>
              <p className="text-slate-400 text-sm mb-4">Delivery Partner · ID #{user?.deliveryPersonId}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  currentShiftStatus === 'OnShift' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  currentShiftStatus === 'OnBreak' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-slate-700 text-slate-400 border-slate-600'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    currentShiftStatus === 'OnShift' ? 'bg-emerald-400 animate-pulse' :
                    currentShiftStatus === 'OnBreak' ? 'bg-amber-400' : 'bg-slate-500'
                  }`} />
                  {currentShiftStatus}
                </span>
                {(profile?.vehicleType || profile?.VehicleType) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-white/10 border border-white/10">
                    <Bike size={12} />
                    {profile.vehicleType || profile.VehicleType}
                  </span>
                )}
              </div>
            </div>
            {!editing && (
              <button
                onClick={handleEdit}
                className="shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Deliveries', value: totalDeliveries, icon: Package, color: 'bg-indigo-600' },
          { title: "Today's", value: todayDeliveries, icon: Calendar, color: 'bg-emerald-600' },
          { title: 'Total Earned', value: `$${totalEarnings}`, icon: DollarSign, color: 'bg-violet-600' },
          { title: 'Avg Rating', value: avgRating.toFixed(1), icon: Star, color: 'bg-amber-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
          >
            <div className={`${stat.color} h-10 w-10 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <stat.icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Shift Control */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Calendar className="text-indigo-600" size={20} />
          Shift Control
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <button onClick={() => handleShiftAction('start')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/20">
            <Play size={16} /> Start Shift
          </button>
          <button onClick={() => handleShiftAction('break')}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-amber-500/20">
            <Coffee size={16} /> Toggle Break
          </button>
          <button onClick={() => handleShiftAction('end')}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md">
            <Pause size={16} /> End Shift
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Current status:&nbsp;
          <span className={`font-bold ${
            currentShiftStatus === 'OnShift' ? 'text-emerald-600' :
            currentShiftStatus === 'OnBreak' ? 'text-amber-600' : 'text-slate-700'
          }`}>{currentShiftStatus}</span>
        </p>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="text-indigo-600" size={20} />
            Personal Information
          </h2>
          {editing && (
            <div className="flex gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all">
                <Save size={15} /> Save
              </button>
              <button onClick={handleCancel}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-all">
                <X size={15} /> Cancel
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'First Name', name: 'firstName', icon: User },
            { label: 'Last Name', name: 'lastName', icon: User },
            { label: 'Email Address', name: 'email', icon: Mail, type: 'email' },
            { label: 'Phone Number', name: 'phoneNumber', icon: Phone, type: 'tel' },
          ].map((field) => (
            <div key={field.name}>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <field.icon size={12} />
                {field.label}
              </label>
              {editing ? (
                <input
                  type={field.type || 'text'}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                />
              ) : (
                <p className="px-4 py-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800">
                  {formData[field.name] || <span className="text-slate-400 font-normal">Not set</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Vehicle Info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Bike className="text-indigo-600" size={20} />
          Vehicle Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Type</p>
            <p className="text-xl font-black text-slate-900">{profile?.vehicleType || profile?.VehicleType || 'Motorcycle'}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">License Status</p>
            <div className="flex items-center gap-2">
              <Shield className="text-emerald-600" size={20} />
              <p className="text-xl font-black text-emerald-700">Verified</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Emergency Support */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-rose-500" size={20} />
          Emergency Support
        </h2>
        <div className="space-y-3 mb-4">
          <textarea
            rows={3}
            value={emergencyMessage}
            onChange={(e) => setEmergencyMessage(e.target.value)}
            placeholder="Describe the issue (optional)..."
            className="w-full px-4 py-3 bg-rose-50 border-2 border-rose-200 rounded-xl focus:border-rose-500 focus:outline-none transition-all text-sm resize-none"
          />
          <button
            onClick={handleEmergencyAlert}
            disabled={submittingEmergency}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-600/25 disabled:opacity-50"
          >
            <AlertTriangle size={16} />
            {submittingEmergency ? 'Sending Alert…' : 'Send Emergency Alert'}
          </button>
        </div>
        {emergencyAlerts.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-auto">
            {emergencyAlerts.map((alert) => (
              <div key={alert.alertId || alert.id} className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-sm font-semibold text-rose-800">{alert.message}</p>
                <p className="text-xs text-rose-500 mt-0.5">{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="text-indigo-600" size={20} />
          Account Settings
        </h2>
        <div className="space-y-2">
          <Link
            to="/forgot-password"
            className="flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-sm font-semibold text-slate-700 transition-all"
          >
            <span>Change Password</span>
            <Edit2 size={16} className="text-slate-400" />
          </Link>
          <button className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-all">
            <span>Privacy Settings</span>
            <Shield size={16} className="text-slate-400" />
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-sm font-bold text-rose-600 transition-all"
          >
            <span>Sign Out</span>
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default DeliveryPersonProfile