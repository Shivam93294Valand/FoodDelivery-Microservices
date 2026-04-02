import { Card, CardMedia, CardContent, Typography, Button, Chip, Stack, Box, Badge } from '@mui/material'
import { Add } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

const MenuItemCard = ({ item, onAddToCart }) => {
  const imageUrl = item?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop'

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          height: '100%',
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: 4,
            borderColor: 'primary.main',
          },
        }}
      >
        <Box className="relative">
          <CardMedia
            component="img"
            height="200"
            image={imageUrl}
            alt={item?.name}
            className="group-hover:scale-110 transition-transform duration-500"
            sx={{ aspectRatio: '1/1', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop'
            }}
          />
          
          {item?.isVegetarian && (
            <Chip
              icon={<Leaf size={14} />}
              label="VEG"
              size="small"
              color="success"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontWeight: 'bold',
                fontSize: '0.7rem',
              }}
            />
          )}
          
          {!item?.isAvailable && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="subtitle1" color="white" fontWeight="bold">
                Unavailable
              </Typography>
            </Box>
          )}
        </Box>

        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography
              variant="h6"
              component="h3"
              fontWeight="bold"
              className="line-clamp-1"
              sx={{ fontSize: '1rem' }}
            >
              {item?.name}
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>
              ${item?.price?.toFixed(2)}
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            className="mt-2 line-clamp-2"
            sx={{ minHeight: '2.5rem' }}
          >
            {item?.description}
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="space-between" className="mt-3">
            <Chip
              label={item?.category || 'Main'}
              size="small"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
              }}
            />

            {item?.isAvailable && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() => onAddToCart?.(item)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                Add
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default MenuItemCard
