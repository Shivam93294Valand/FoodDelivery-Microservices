import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import ToastContainer from './components/ToastContainer'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import DeliveryLayout from './layouts/DeliveryLayout'
import Home from './pages/Home'
import RestaurantDetail from './pages/RestaurantDetail'
import MenuItems from './pages/MenuItems'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Deliveries from './pages/Deliveries'
import Payments from './pages/Payments'
import TrackOrder from './pages/TrackOrder'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOtp from './pages/VerifyOtp'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import ManageUsers from './pages/ManageUsers'
import ManageRestaurants from './pages/ManageRestaurants'
import ManageRestaurantMenus from './pages/ManageRestaurantMenus'
import ManageDeliveryStaff from './pages/ManageDeliveryStaff'
import CustomerDetail from './pages/CustomerDetail'
import DeliveryDashboard from './pages/DeliveryDashboard'
import DeliveryPersonDashboard from './pages/DeliveryPersonDashboard'
import DeliveryPersonProfile from './pages/DeliveryPersonProfile'
import LiveTrackDelivery from './pages/LiveTrackDelivery'
import DeliveryOtpVerify from './pages/DeliveryOtpVerify'
import CustomerDeliveryVerify from './pages/CustomerDeliveryVerify'

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="size-12 rounded-full border-4 border-rose-600/20 border-t-rose-600 mx-auto mb-4"
      />
      <p className="text-sm font-medium text-slate-600">Loading your experience...</p>
    </div>
  </div>
)

const App = () => {
  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <ToastContainer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/menu-items" element={<MenuItems />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <CustomerDetail />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="restaurants" element={<ManageRestaurants />} />
            <Route path="restaurants/:restaurantId/menus" element={<ManageRestaurantMenus />} />
            <Route path="delivery-persons" element={<ManageDeliveryStaff />} />
          </Route>

          <Route element={
            <ProtectedRoute allowedRoles={['DeliveryPerson', 'Admin']}>
              <DeliveryLayout />
            </ProtectedRoute>
          }>
            <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
            <Route path="/delivery-person-dashboard" element={<DeliveryPersonDashboard />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/delivery-profile" element={<DeliveryPersonProfile />} />
            <Route path="/live-track-delivery/:id" element={<LiveTrackDelivery />} />
            <Route path="/delivery-otp-verify/:id" element={<DeliveryOtpVerify />} />
          </Route>

          <Route path="/verify-delivery/:orderId" element={
            <ProtectedRoute>
              <CustomerDeliveryVerify />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
