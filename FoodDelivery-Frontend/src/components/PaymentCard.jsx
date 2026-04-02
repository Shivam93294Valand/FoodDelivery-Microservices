import { Card, CardContent, Typography, Chip, Stack, Box } from '@mui/material'
import { Payment, CreditCard, CalendarToday } from '@mui/icons-material'
import { motion } from 'framer-motion'

const PaymentCard = ({ payment }) => {
  const paymentId = payment?.paymentId ?? payment?.PaymentId
  const orderId = payment?.orderId ?? payment?.OrderId
  const amount = payment?.amount ?? payment?.Amount ?? 0
  const status = payment?.status ?? payment?.Status ?? payment?.paymentStatus ?? payment?.PaymentStatus ?? 'Pending'
  const method = payment?.paymentMethod ?? payment?.PaymentMethod ?? 'N/A'
  const paymentDate = payment?.paymentDate ?? payment?.PaymentDate

  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': 'warning',
      'Processing': 'info',
      'Completed': 'success',
      'Failed': 'error',
      'Refunded': 'default',
    }
    return statusMap[status] || 'default'
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: 4,
            borderColor: 'primary.main',
          },
        }}
      >
        <Box className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 border-b border-divider">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Payment color="primary" fontSize="small" />
              <Typography variant="h6" fontWeight="bold">
                Payment #{paymentId}
              </Typography>
            </Stack>
            <Chip
              label={status}
              color={getStatusColor(status)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" className="mt-1">
            Order #{orderId}
          </Typography>
        </Box>

        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                ${amount.toFixed(2)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <CreditCard fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Payment Method
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight="bold">
                {method}
              </Typography>
            </Stack>

            {paymentDate && (
              <Stack direction="row" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarToday fontSize="small" color="action" sx={{ fontSize: '1rem' }} />
                  <Typography variant="caption" color="text.secondary">
                    Payment Date
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {new Date(paymentDate).toLocaleDateString()}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default PaymentCard
