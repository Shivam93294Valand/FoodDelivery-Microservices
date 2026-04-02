import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Divider,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import { CreditCard, Payment, LocalShipping, Notes, AttachMoney, Add, Home, Work, LocationOn, Delete } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ToastContainer'

const Checkout = () => {
  const navigate = useNavigate()
  const { items, restaurants, total, clearCart } = useCart()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddAddressDialog, setShowAddAddressDialog] = useState(false)
  const [newAddress, setNewAddress] = useState({
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
  })
  const [formData, setFormData] = useState({
    customerId: user?.customerId || user?.CustomerId || user?.userId || user?.UserId || 0,
    deliveryAddressId: 0,
    paymentMethod: 'Card',
    specialInstructions: '',
  })

  useEffect(() => {
    if (user) {
      const id = user.customerId || user.CustomerId || user.userId || user.UserId
      if (id) {
        setFormData(prev => ({ ...prev, customerId: id }))
        fetchAddresses(id)
      }
    }
  }, [user])

  const fetchAddresses = async (customerId) => {
    try {
      const data = await api.getCustomerAddresses(customerId)
      setAddresses(data || [])
      // Auto-select default address
      const defaultAddr = data?.find(a => a.isDefault)
      if (defaultAddr) {
        setFormData(prev => ({ ...prev, deliveryAddressId: defaultAddr.addressId }))
      } else if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, deliveryAddressId: data[0].addressId }))
      }
    } catch (e) {
      console.error('Failed to fetch addresses:', e)
      toast.error('Could not load addresses')
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await api.deleteAddress(id)
        setAddresses(addresses.filter(a => a.addressId !== id))
        if (formData.deliveryAddressId === id) {
          setFormData(prev => ({ ...prev, deliveryAddressId: 0 }))
        }
        toast.success('Address deleted successfully')
      } catch (err) {
        console.error('Failed to delete address:', err)
        toast.error('Failed to delete address')
      }
    }
  }

  const handleAddAddress = async () => {
    try {
      const addressData = {
        ...newAddress,
        customerId: formData.customerId
      }
      const result = await api.createAddress(addressData)
      toast.success('Address added successfully!')
      setAddresses([...addresses, result])
      setFormData(prev => ({ ...prev, deliveryAddressId: result.addressId }))
      setShowAddAddressDialog(false)
      setNewAddress({
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
      })
    } catch (e) {
      toast.error('Failed to add address')
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handlePaymentMethodChange = (event, newMethod) => {
    if (newMethod !== null) {
      setFormData(prev => ({ ...prev, paymentMethod: newMethod }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.deliveryAddressId || formData.deliveryAddressId === 0) {
      setError('Please select a delivery address')
      toast.error('Please select a delivery address')
      return
    }

    // Get the first restaurant from cart (we support multi-restaurant cart)
    const restaurant = restaurants && restaurants.length > 0 ? restaurants[0] : null
    if (!restaurant || !restaurant.restaurantId) {
      setError('Invalid restaurant selection')
      toast.error('Invalid restaurant selection')
      return
    }

    setLoading(true)
    setError('')

    try {
      const orderData = {
        customerId: formData.customerId,
        restaurantId: restaurant.restaurantId,
        deliveryAddressId: formData.deliveryAddressId,
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: '',
        })),
      }

      console.log('Creating order with data:', orderData)
      const result = await api.createOrder(orderData)

      clearCart()
      toast.success('Order placed successfully!')
      navigate('/orders', { state: { newOrder: result } })
    } catch (e) {
      console.error('Order creation failed:', e)
      setError(e.message || 'Failed to place order')
      toast.error(e.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const deliveryFee = 5
  const serviceFee = 2
  const tax = total * 0.1
  const grandTotal = total + deliveryFee + serviceFee + tax

  return (
    <Container maxWidth="lg" className="py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Checkout
        </Typography>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ my: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box className="grid lg:grid-cols-3 gap-6 mt-6">
          <Box className="lg:col-span-2">
            <Stack spacing={3}>
              {/* Delivery Address */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 4 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" className="mb-3">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <LocalShipping color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Delivery Address
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setShowAddAddressDialog(true)}
                  >
                    Add New
                  </Button>
                </Stack>

                {loadingAddresses ? (
                  <Box className="text-center py-4">
                    <CircularProgress size={24} />
                  </Box>
                ) : addresses.length === 0 ? (
                  <Alert severity="info">
                    No addresses found. Please add a delivery address.
                  </Alert>
                ) : (
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={formData.deliveryAddressId}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddressId: parseInt(e.target.value) }))}
                    >
                      <Stack spacing={2}>
                        {addresses.map((address) => (
                          <Card
                            key={address.addressId}
                            variant="outlined"
                            sx={{
                              border: formData.deliveryAddressId === address.addressId ? 2 : 1,
                              borderColor: formData.deliveryAddressId === address.addressId ? 'primary.main' : 'divider',
                              position: 'relative',
                            }}
                          >
                            <CardContent sx={{ pr: 5 }}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteAddress(address.addressId, e)}
                                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                              <FormControlLabel
                                value={address.addressId}
                                control={<Radio />}
                                label={
                                  <Box>
                                    <Stack direction="row" spacing={1} alignItems="center" className="mb-1">
                                      {address.addressType === 'Home' ? <Home fontSize="small" /> : <Work fontSize="small" />}
                                      <Typography variant="subtitle1" fontWeight="bold">
                                        {address.addressType}
                                      </Typography>
                                      {address.isDefault && (
                                        <Typography variant="caption" sx={{ px: 1, py: 0.5, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                                          Default
                                        </Typography>
                                      )}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                      {address.addressLine1}
                                      {address.addressLine2 && `, ${address.addressLine2}`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {address.city}, {address.state} {address.zipCode}
                                    </Typography>
                                    {address.landmark && (
                                      <Stack direction="row" spacing={0.5} alignItems="center" className="mt-1">
                                        <LocationOn fontSize="small" sx={{ fontSize: 16 }} />
                                        <Typography variant="caption" color="text.secondary">
                                          {address.landmark}
                                        </Typography>
                                      </Stack>
                                    )}
                                  </Box>
                                }
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                )}
              </Paper>

              {/* Payment Method */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 4 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" className="mb-3">
                  <Payment color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Payment Method
                  </Typography>
                </Stack>
                
                <ToggleButtonGroup
                  value={formData.paymentMethod}
                  exclusive
                  onChange={handlePaymentMethodChange}
                  aria-label="payment method"
                  fullWidth
                  size="large"
                >
                  <ToggleButton value="Card" aria-label="card">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CreditCard fontSize="small" />
                      <span>Card</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="Cash" aria-label="cash">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AttachMoney fontSize="small" />
                      <span>Cash</span>
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>

              {/* Special Instructions */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 4 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" className="mb-3">
                  <Notes color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Special Instructions
                  </Typography>
                </Stack>
                <TextField
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Any special requests? (optional)"
                  variant="outlined"
                />
              </Paper>
            </Stack>
          </Box>

          {/* Order Summary */}
          <Box className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-20"
            >
              <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Order Summary
                </Typography>

                <Stack spacing={2} className="my-4">
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      ${total.toFixed(2)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Delivery Fee
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      ${deliveryFee.toFixed(2)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Service Fee
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      ${serviceFee.toFixed(2)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tax (10%)
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      ${tax.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider className="my-3" />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  className="mb-4"
                >
                  <Typography variant="h6" fontWeight="bold">
                    Total
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    ${grandTotal.toFixed(2)}
                  </Typography>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ borderRadius: 3, py: 1.5 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </Paper>
            </motion.div>
          </Box>
        </Box>
      </form>

      {/* Add Address Dialog */}
      <Dialog 
        open={showAddAddressDialog} 
        onClose={() => setShowAddAddressDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Address</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Address Line 1"
              value={newAddress.addressLine1}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Address Line 2"
              value={newAddress.addressLine2}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="State"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                fullWidth
                required
              />
            </Stack>
            <TextField
              label="Zip Code"
              value={newAddress.zipCode}
              onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Landmark (Optional)"
              value={newAddress.landmark}
              onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <ToggleButtonGroup
                value={newAddress.addressType}
                exclusive
                onChange={(e, value) => value && setNewAddress({ ...newAddress, addressType: value })}
                fullWidth
              >
                <ToggleButton value="Home">
                  <Home sx={{ mr: 1 }} />
                  Home
                </ToggleButton>
                <ToggleButton value="Work">
                  <Work sx={{ mr: 1 }} />
                  Work
                </ToggleButton>
                <ToggleButton value="Other">
                  <LocationOn sx={{ mr: 1 }} />
                  Other
                </ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddAddressDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddAddress} 
            variant="contained"
            disabled={!newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.zipCode}
          >
            Add Address
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Checkout