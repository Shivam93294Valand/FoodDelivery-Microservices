import { Card, CardContent, Stack, Box, Typography, IconButton, ButtonGroup, Button } from '@mui/material'
import { Add, Remove, DeleteOutline, Inventory } from '@mui/icons-material' 

const CartItem = ({ item, restaurantId, onUpdateQuantity, onRemove }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        borderColor: 'rgba(15, 23, 42, 0.08)',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        background: 'linear-gradient(180deg, #ffffff 0%, #fffaf5 100%)'
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffe8c5 0%, #ffd4a8 50%, #ffc18f 100%)',
              flexShrink: 0,
            }}
          >
            {item?.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.disabled',
                  fontSize: '1.5rem',
                }}
              >
                <Inventory sx={{ fontSize: 28, color: 'text.disabled' }} />
              </Box>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight="700" noWrap>
              {item?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.2 }}>
              ${item?.price?.toFixed(2)} each
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" className="mt-2">
              <ButtonGroup
                size="small"
                variant="outlined"
                sx={{
                  '& .MuiButton-root': {
                    borderColor: 'rgba(2, 6, 23, 0.12)',
                    color: '#0f172a'
                  }
                }}
              >
                <Button
                  onClick={() => onUpdateQuantity?.(item.menuItemId, item.quantity - 1, restaurantId)}
                  disabled={item.quantity <= 1}
                >
                  <Remove fontSize="small" />
                </Button>
                <Button disabled sx={{ minWidth: 42, color: '#0f172a !important', fontWeight: 700 }}>
                  {item?.quantity}
                </Button>
                <Button onClick={() => onUpdateQuantity?.(item.menuItemId, item.quantity + 1, restaurantId)}>
                  <Add fontSize="small" />
                </Button>
              </ButtonGroup>

              <IconButton
                size="small"
                color="error"
                onClick={() => onRemove?.(item.menuItemId, restaurantId)}
                sx={{
                  ml: 'auto',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.16)' }
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" fontWeight="800" sx={{ color: '#c2410c' }}>
              ${(item?.price * item?.quantity).toFixed(2)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CartItem
