import { Card, CardContent, Skeleton, Stack } from '@mui/material'

const SkeletonCard = () => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden',
    }}
  >
    <Skeleton variant="rectangular" height={200} animation="wave" />
    <CardContent>
      <Stack spacing={1.5}>
        <Skeleton variant="text" width="60%" height={24} animation="wave" />
        <Skeleton variant="text" width="100%" height={16} animation="wave" />
        <Skeleton variant="text" width="85%" height={16} animation="wave" />
      </Stack>
    </CardContent>
  </Card>
)

export default SkeletonCard
