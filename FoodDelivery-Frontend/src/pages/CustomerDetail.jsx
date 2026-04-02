import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ToastContainer'
import { User, Mail, Phone, MapPin, Calendar, ShoppingBag, Package, ArrowLeft, AlertTriangle, Edit3, Save, Plus, Trash2, XCircle } from 'lucide-react'
import { normalizeOrderStatus } from '../utils/orderHelpers'

const emptyAddress = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  landmark: '',
  addressType: 'Home',
  isDefault: false,
  latitude: 0,
  longitude: 0
}

const CustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user: currentUser, updateUser, logout } = useAuth()

  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info')

  const [profileEdit, setProfileEdit] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  })

  const [addressEditId, setAddressEditId] = useState(null)
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const [savingAddress, setSavingAddress] = useState(false)

  const isOwnProfile = location.pathname === '/profile'
  const customerId = isOwnProfile
    ? (currentUser?.customerId || currentUser?.CustomerId || currentUser?.userId || currentUser?.UserId)
    : id

  const loadData = async () => {
    if (!customerId) {
      setError('Customer ID not found')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [customerData, ordersData, addressesData] = await Promise.all([
        api.getCustomer(customerId),
        api.getCustomerOrders(customerId).catch(() => []),
        api.getCustomerAddresses(customerId).catch(() => [])
      ])

      setCustomer(customerData)
      setProfileForm({
        firstName: customerData?.firstName ?? customerData?.FirstName ?? '',
        lastName: customerData?.lastName ?? customerData?.LastName ?? '',
        email: customerData?.email ?? customerData?.Email ?? '',
        phoneNumber: customerData?.phoneNumber ?? customerData?.PhoneNumber ?? ''
      })

      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setAddresses(Array.isArray(addressesData) ? addressesData : [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load customer details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [customerId])

  const handleProfileSave = async () => {
    if (!customerId) return

    setSavingProfile(true)
    try {
      await api.updateCustomer(customerId, {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber.trim()
      })

      const updated = await api.getCustomer(customerId)
      setCustomer(updated)
      setProfileEdit(false)

      if (isOwnProfile) {
        updateUser({
          firstName: updated?.firstName ?? updated?.FirstName,
          lastName: updated?.lastName ?? updated?.LastName,
          email: updated?.email ?? updated?.Email,
          phoneNumber: updated?.phoneNumber ?? updated?.PhoneNumber
        })
      }

      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customerId) return
    if (!window.confirm('Delete your account permanently?')) return

    try {
      await api.deleteCustomer(customerId)
      toast.success('Account deleted')
      if (isOwnProfile) {
        logout()
        navigate('/register')
      } else {
        navigate('/admin/users')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer')
    }
  }

  const handleAddressSave = async () => {
    if (!customerId) return

    const payload = {
      addressId: addressEditId || 0,
      customerId: Number(customerId),
      addressLine1: addressForm.addressLine1.trim(),
      addressLine2: addressForm.addressLine2.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      zipCode: addressForm.zipCode.trim(),
      landmark: addressForm.landmark.trim(),
      addressType: addressForm.addressType,
      isDefault: !!addressForm.isDefault,
      latitude: Number(addressForm.latitude || 0),
      longitude: Number(addressForm.longitude || 0)
    }

    if (!payload.addressLine1 || !payload.city || !payload.state || !payload.zipCode) {
      toast.error('Address line 1, city, state and zip code are required')
      return
    }

    setSavingAddress(true)
    try {
      if (addressEditId) {
        await api.updateAddress(addressEditId, payload)
        toast.success('Address updated')
      } else {
        await api.createAddress(payload)
        toast.success('Address added')
      }

      const refreshed = await api.getCustomerAddresses(customerId)
      setAddresses(Array.isArray(refreshed) ? refreshed : [])
      setAddressEditId(null)
      setAddressForm(emptyAddress)
    } catch (err) {
      toast.error(err.message || 'Failed to save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleAddressEdit = (address) => {
    setAddressEditId(address?.addressId ?? address?.AddressId)
    setAddressForm({
      addressLine1: address?.addressLine1 ?? address?.AddressLine1 ?? '',
      addressLine2: address?.addressLine2 ?? address?.AddressLine2 ?? '',
      city: address?.city ?? address?.City ?? '',
      state: address?.state ?? address?.State ?? '',
      zipCode: address?.zipCode ?? address?.ZipCode ?? '',
      landmark: address?.landmark ?? address?.Landmark ?? '',
      addressType: address?.addressType ?? address?.AddressType ?? 'Home',
      isDefault: !!(address?.isDefault ?? address?.IsDefault),
      latitude: address?.latitude ?? address?.Latitude ?? 0,
      longitude: address?.longitude ?? address?.Longitude ?? 0
    })
  }

  const handleAddressDelete = async (addressId) => {
    if (!window.confirm('Delete this address?')) return

    try {
      await api.deleteAddress(addressId)
      setAddresses((prev) => prev.filter((a) => (a.addressId ?? a.AddressId) !== addressId))
      toast.success('Address deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete address')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(255,182,193,0.35),transparent)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-100">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="size-12 rounded-full border-4 border-rose-600/20 border-t-rose-600"
            />
          </div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(255,182,193,0.35),transparent)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-6 text-center">
            <p className="text-lg font-semibold mb-2"><AlertTriangle className="size-5 inline-block mr-2" /> Error</p>
            <p>{error || 'Customer not found'}</p>
          </div>
          <button
            onClick={() => navigate(isOwnProfile ? '/' : '/admin/users')}
            className="mt-6 inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition"
          >
            <ArrowLeft className="size-4" />
            {isOwnProfile ? 'Back to Home' : 'Back to Users'}
          </button>
        </div>
      </div>
    )
  }

  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount ?? order.TotalAmount ?? 0), 0)
  const completedOrders = orders.filter((o) => normalizeOrderStatus(o.status ?? o.orderStatus ?? o.OrderStatus) === 'Delivered').length

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(255,182,193,0.35),transparent)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {!isOwnProfile && (
          <button
            onClick={() => navigate('/admin/users')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition font-medium"
          >
            <ArrowLeft className="size-4" />
            Back to Users
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl ring-1 ring-black/10 shadow-xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="shrink-0">
              <div className="size-24 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {(customer.firstName ?? customer.FirstName)?.charAt(0)}{(customer.lastName ?? customer.LastName)?.charAt(0)}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {customer.firstName ?? customer.FirstName} {customer.lastName ?? customer.LastName}
                </h1>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-black/70">
                <div className="flex items-center gap-2"><Mail className="size-4 text-black/40" /><span>{customer.email ?? customer.Email}</span></div>
                <div className="flex items-center gap-2"><Phone className="size-4 text-black/40" /><span>{customer.phoneNumber ?? customer.PhoneNumber ?? 'N/A'}</span></div>
                <div className="flex items-center gap-2"><User className="size-4 text-black/40" /><span className="font-medium">{customer.role ?? customer.Role ?? 'Customer'}</span></div>
                <div className="flex items-center gap-2"><Calendar className="size-4 text-black/40" /><span>Joined {new Date(customer.createdAt ?? customer.CreatedAt).toLocaleDateString()}</span></div>
              </div>
            </div>

            <div className="flex gap-6 md:border-l md:border-black/10 md:pl-8">
              <div className="text-center"><div className="text-3xl font-black text-black mb-1">{totalOrders}</div><div className="text-xs text-black/50 font-medium">Total Orders</div></div>
              <div className="text-center"><div className="text-3xl font-black text-black mb-1">${totalSpent.toFixed(2)}</div><div className="text-xs text-black/50 font-medium">Total Spent</div></div>
              <div className="text-center"><div className="text-3xl font-black text-black mb-1">{completedOrders}</div><div className="text-xs text-black/50 font-medium">Completed</div></div>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('info')} className={`px-6 py-3 rounded-xl backdrop-blur transition text-sm font-semibold whitespace-nowrap flex items-center gap-2 ${activeTab === 'info' ? 'bg-white/70 ring-1 ring-black/10 shadow-sm text-black' : 'bg-white/50 ring-1 ring-black/5 hover:bg-white/70 hover:ring-black/10 text-black/70 hover:text-black'}`}><User className="size-4" />Information</button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-xl backdrop-blur transition text-sm font-semibold whitespace-nowrap flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white/70 ring-1 ring-black/10 shadow-sm text-black' : 'bg-white/50 ring-1 ring-black/5 hover:bg-white/70 hover:ring-black/10 text-black/70 hover:text-black'}`}><ShoppingBag className="size-4" />Orders ({totalOrders})</button>
          <button onClick={() => setActiveTab('addresses')} className={`px-6 py-3 rounded-xl backdrop-blur transition text-sm font-semibold whitespace-nowrap flex items-center gap-2 ${activeTab === 'addresses' ? 'bg-white/70 ring-1 ring-black/10 shadow-sm text-black' : 'bg-white/50 ring-1 ring-black/5 hover:bg-white/70 hover:ring-black/10 text-black/70 hover:text-black'}`}><MapPin className="size-4" />Addresses ({addresses.length})</button>
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === 'info' && (
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-black/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Customer Information</h2>
                {isOwnProfile && (
                  <div className="flex items-center gap-2">
                    {!profileEdit ? (
                      <button onClick={() => setProfileEdit(true)} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200 text-sm font-semibold inline-flex items-center gap-2"><Edit3 className="size-4" />Edit</button>
                    ) : (
                      <>
                        <button onClick={handleProfileSave} disabled={savingProfile} className="px-4 py-2 rounded-xl bg-green-50 text-green-700 ring-1 ring-green-200 text-sm font-semibold inline-flex items-center gap-2"><Save className="size-4" />Save</button>
                        <button onClick={() => { setProfileEdit(false); setProfileForm({ firstName: customer.firstName ?? customer.FirstName ?? '', lastName: customer.lastName ?? customer.LastName ?? '', email: customer.email ?? customer.Email ?? '', phoneNumber: customer.phoneNumber ?? customer.PhoneNumber ?? '' }) }} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200 text-sm font-semibold inline-flex items-center gap-2"><XCircle className="size-4" />Cancel</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-black/60 mb-2 block">First Name</label>
                  {profileEdit ? <input className="w-full rounded-xl border border-black/10 px-3 py-2" value={profileForm.firstName} onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))} /> : <div className="text-lg font-medium">{customer.firstName ?? customer.FirstName}</div>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-black/60 mb-2 block">Last Name</label>
                  {profileEdit ? <input className="w-full rounded-xl border border-black/10 px-3 py-2" value={profileForm.lastName} onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))} /> : <div className="text-lg font-medium">{customer.lastName ?? customer.LastName}</div>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-black/60 mb-2 block">Email Address</label>
                  {profileEdit ? <input className="w-full rounded-xl border border-black/10 px-3 py-2" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} /> : <div className="text-lg font-medium">{customer.email ?? customer.Email}</div>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-black/60 mb-2 block">Phone Number</label>
                  {profileEdit ? <input className="w-full rounded-xl border border-black/10 px-3 py-2" value={profileForm.phoneNumber} onChange={(e) => setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }))} /> : <div className="text-lg font-medium">{customer.phoneNumber ?? customer.PhoneNumber ?? 'Not provided'}</div>}
                </div>
                {!profileEdit && isOwnProfile && (
                  <div className="md:col-span-2 pt-2">
                    <button onClick={handleDeleteCustomer} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 text-sm font-semibold inline-flex items-center gap-2"><Trash2 className="size-4" />Delete Account</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-black/10 p-12 text-center">
                  <Package className="size-16 text-black/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black/80 mb-2">No Orders Yet</h3>
                  <p className="text-black/60">This customer hasn't placed any orders yet.</p>
                </div>
              ) : (
                orders.map((order, index) => {
                  const orderId = order.orderId ?? order.OrderId
                  const orderStatus = normalizeOrderStatus(order.status ?? order.orderStatus ?? order.OrderStatus)
                  return (
                    <motion.div key={orderId ?? index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/10 p-6 hover:shadow-lg transition">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold mb-1">Order #{orderId}</h3>
                          <p className="text-sm text-black/60">{new Date(order.orderDate ?? order.OrderDate ?? order.createdAt ?? order.CreatedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${orderStatus === 'Delivered' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : orderStatus === 'Cancelled' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : orderStatus === 'OutForDelivery' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>{orderStatus}</span>
                          <div className="text-2xl font-black">${(order.totalAmount ?? order.TotalAmount ?? 0).toFixed(2)}</div>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/orders/${orderId}`)} className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline">View Details →</button>
                    </motion.div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-4">
              {isOwnProfile && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{addressEditId ? 'Edit Address' : 'Add Address'}</h3>
                    {addressEditId && <button onClick={() => { setAddressEditId(null); setAddressForm(emptyAddress) }} className="text-sm text-black/60 hover:text-black">Cancel edit</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="rounded-xl border border-black/10 px-3 py-2" placeholder="Address Line 1" value={addressForm.addressLine1} onChange={(e) => setAddressForm((p) => ({ ...p, addressLine1: e.target.value }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2" placeholder="Address Line 2" value={addressForm.addressLine2} onChange={(e) => setAddressForm((p) => ({ ...p, addressLine2: e.target.value }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2" placeholder="Zip Code" value={addressForm.zipCode} onChange={(e) => setAddressForm((p) => ({ ...p, zipCode: e.target.value }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2" placeholder="Landmark" value={addressForm.landmark} onChange={(e) => setAddressForm((p) => ({ ...p, landmark: e.target.value }))} />
                    <select className="rounded-xl border border-black/10 px-3 py-2" value={addressForm.addressType} onChange={(e) => setAddressForm((p) => ({ ...p, addressType: e.target.value }))}>
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))} />
                      Set as default
                    </label>
                  </div>
                  <button disabled={savingAddress} onClick={handleAddressSave} className="mt-4 px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 inline-flex items-center gap-2">
                    {addressEditId ? <Save className="size-4" /> : <Plus className="size-4" />}
                    {addressEditId ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-black/10 p-12 text-center">
                  <MapPin className="size-16 text-black/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black/80 mb-2">No Addresses</h3>
                  <p className="text-black/60">No addresses found.</p>
                </div>
              ) : (
                addresses.map((address, index) => {
                  const addrId = address.addressId ?? address.AddressId
                  return (
                    <motion.div key={addrId ?? index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/10 p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="size-5 text-rose-600 mt-0.5" />
                          <div>
                            <h3 className="font-bold text-lg mb-1">{address.addressType ?? address.AddressType ?? 'Address'}</h3>
                            <p className="text-black/70">{address.addressLine1 ?? address.AddressLine1}</p>
                            {(address.addressLine2 ?? address.AddressLine2) && <p className="text-black/70">{address.addressLine2 ?? address.AddressLine2}</p>}
                            <p className="text-black/70">{address.city ?? address.City}, {address.state ?? address.State} {address.zipCode ?? address.ZipCode}</p>
                            {(address.landmark ?? address.Landmark) && <p className="text-sm text-black/60 mt-1">Landmark: {address.landmark ?? address.Landmark}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(address.isDefault ?? address.IsDefault) && <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">Default</span>}
                          {isOwnProfile && (
                            <>
                              <button onClick={() => handleAddressEdit(address)} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold ring-1 ring-blue-200 inline-flex items-center gap-1"><Edit3 className="size-3" />Edit</button>
                              <button onClick={() => handleAddressDelete(addrId)} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold ring-1 ring-red-200 inline-flex items-center gap-1"><Trash2 className="size-3" />Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default CustomerDetail
