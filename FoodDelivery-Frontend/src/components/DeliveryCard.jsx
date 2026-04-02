import { Card, CardContent, Typography, Chip, Stack, Box } from '@mui/material'
import { LocalShipping, Person, Schedule } from '@mui/icons-material'
import { motion } from 'framer-motion'

const DeliveryCard = ({ delivery }) => {
  const deliveryId = delivery?.deliveryId ?? delivery?.DeliveryId
  const orderId = delivery?.orderId ?? delivery?.OrderId
  const status = delivery?.status ?? delivery?.Status ?? 'Pending'
  const deliveryPersonName = delivery?.deliveryPersonName ?? delivery?.DeliveryPersonName ?? 'TBD'
  const estimatedTime = delivery?.estimatedPickupTime ?? delivery?.EstimatedPickupTime
  const assignedAt = delivery?.assignedAt ?? delivery?.AssignedAt

  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': 'warning',
      'Assigned': 'info',
      'PickedUp': 'primary',
      'InTransit': 'secondary',
      'Delivered': 'success',
      'Failed': 'error',
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
        <Box className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border-b border-divider">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocalShipping color="primary" fontSize="small" />
              <Typography variant="h6" fontWeight="bold">
                Delivery #{deliveryId}
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
              <Stack direction="row" alignItems="center" spacing={1}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Delivery Person
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight="bold">
                {deliveryPersonName}
              </Typography>
            </Stack>

            {estimatedTime && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Estimated Time
                  </Typography>
                </Stack>
                <Typography variant="body2" fontWeight="bold">
                  {estimatedTime}
                </Typography>
              </Stack>
            )}

            {assignedAt && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Assigned Date
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(assignedAt).toLocaleDateString()}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default DeliveryCard