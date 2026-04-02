
import RestaurantCard from './RestaurantCard'

const RestaurantGrid = ({ items }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items?.map((r) => (
        <RestaurantCard key={r.restaurantId ?? r.id ?? r.name} restaurant={r} />
      ))}
    </div>
  )
}

export default RestaurantGrid
