import { Card, CardMedia, CardContent, Typography, Chip, Stack, Box } from '@mui/material'
import { Star, Clock } from 'lucide-react'

const RestaurantCard = ({ restaurant }) => {
  const imageUrl = restaurant?.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=60'
  
  return (
    <Card 
      elevation={0}
      className="group h-full transition-all duration-300 hover:shadow-xl"
      sx={{ 
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box className="relative overflow-hidden">
        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={restaurant?.name}
          className="group-hover:scale-110 transition-transform duration-500"
          sx={{ aspectRatio: '16/10', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null
            e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop'
          }}
        />
        <Box className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Box>
      
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography 
            variant="h6" 
            component="h3" 
            fontWeight="bold"
            className="line-clamp-1 group-hover:text-rose-600 transition-colors"
            sx={{ fontSize: '1rem' }}
          >
            {restaurant?.name}
          </Typography>
          <Chip
            icon={<Star className="size-3 fill-current" />}
            label={restaurant?.rating?.toFixed?.(1) ?? '4.5'}
            size="small"
            color="success"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          />
        </Stack>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          className="mt-2 line-clamp-2"
          sx={{ minHeight: '2.5rem' }}
        >
          {restaurant?.description || 'Tasty bites and quick delivery.'}
        </Typography>
        
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          className="mt-3"
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {restaurant?.cuisine || 'Cuisine'}
            </Typography>
          </Stack>
          
          <Chip
            label={restaurant?.isActive ? 'Open Now' : 'Closed'}
            size="small"
            color={restaurant?.isActive ? 'success' : 'error'}
            variant="outlined"
            sx={{ fontWeight: 'medium', fontSize: '0.7rem' }}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

export default RestaurantCard
