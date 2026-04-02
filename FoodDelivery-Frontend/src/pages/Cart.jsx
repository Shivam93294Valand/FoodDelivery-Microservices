import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  Box,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import { ShoppingCartOutlined, ArrowForward, DeleteOutline, StorefrontOutlined, LocalOffer } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import CartItem from '../components/CartItem'

const Cart = () => {
  const navigate = useNavigate()
  const { items, restaurants, updateQuantity, removeItem, clearCart, clearRestaurant, total, count } = useCart()

  const deliveryFee = 5
  const serviceFee = 2
  const tax = total * 0.1
  const grandTotal = total + deliveryFee + serviceFee + tax

  if (items.length === 0 || restaurants.length === 0) {
    return (
      <Container maxWidth="md" className="py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            className="p-12 text-center"
            sx={{
              borderRadius: 5,
              border: '1px solid rgba(15, 23, 42, 0.08)',
              background: 'linear-gradient(145deg, #fff 0%, #fff7ed 55%, #ffedd5 100%)',
              boxShadow: '0 30px 80px rgba(15, 23, 42, 0.10)'
            }}
          >
            <ShoppingCartOutlined sx={{ fontSize: 84, color: '#c2410c', mb: 3 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography color="text.secondary" paragraph>
              Add some delicious items to get started!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                mt: 2,
                borderRadius: 999,
                px: 4,
                background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)'
              }}
            >
              Browse Restaurants
            </Button>
          </Paper>
        </motion.div>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Paper
        elevation={0}
        className="mb-6 p-5"
        sx={{
          borderRadius: 5,
          border: '1px solid rgba(2, 6, 23, 0.08)',
          background: 'radial-gradient(circle at top right, #fdba74 0%, #fff7ed 36%, #ffffff 68%)'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ color: '#111827' }}>
              Your Cart
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              {count} items across {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutline />}
            onClick={clearCart}
            sx={{ borderRadius: 999, px: 2.5 }}
          >
            Clear All
          </Button>
        </Stack>
      </Paper>

      <Box className="grid lg:grid-cols-3 gap-6">
        <Box className="lg:col-span-2">
          <Stack spacing={4}>
            {restaurants.map((restaurant, restIndex) => (
              <motion.div
                key={restaurant.restaurantId}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: restIndex * 0.1 }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    borderColor: 'rgba(15, 23, 42, 0.08)',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)'
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" className="mb-3">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(249, 115, 22, 0.12)' }}>
                          <StorefrontOutlined sx={{ color: '#c2410c' }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Ordering from
                          </Typography>
                          <Typography variant="h6" fontWeight="800" sx={{ color: '#111827' }}>
                            {restaurant.name}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutline />}
                        onClick={() => clearRestaurant(restaurant.restaurantId)}
                      >
                        Clear
                      </Button>
                    </Stack>
                    
                    <Stack spacing={2}>
                      {restaurant.items.map((item, itemIndex) => (
                        <motion.div
                          key={item.menuItemId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: itemIndex * 0.05 }}
                        >
                          <CartItem
                            item={item}
                            restaurantId={restaurant.restaurantId}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeItem}
                          />
                        </motion.div>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Stack>
        </Box>

        <Box className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-20"
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: 3,
                border: '1px solid rgba(2, 6, 23, 0.08)',
                background: 'linear-gradient(180deg, #fff 0%, #fff7ed 100%)',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)'
              }}
            >
              <Typography variant="h6" fontWeight="800" gutterBottom sx={{ color: '#111827' }}>
                Order Summary
              </Typography>

              {tax > 0 && (
                <Box className="mb-3">
                  <Chip
                    icon={<LocalOffer fontSize="small" />}
                    label={`You're saving $${(total * 0.05).toFixed(2)} with our service`}
                    color="success"
                    size="small"
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  />
                </Box>
              )}

              <Stack spacing={2} className="my-4">
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Items ({count})
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

              <Stack direction="row" justifyContent="space-between" alignItems="center" className="mb-4">
                <Typography variant="h6" fontWeight="800">
                  Total
                </Typography>
                <Typography variant="h5" fontWeight="800" sx={{ color: '#c2410c' }}>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowForward />}
                onClick={() => navigate('/checkout')}
                sx={{
                  borderRadius: 999,
                  py: 1.4,
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)'
                }}
              >
                Proceed to Checkout
              </Button>
            </Paper>
          </motion.div>
        </Box>
      </Box>
    </Container>
  )
}

export default Cart