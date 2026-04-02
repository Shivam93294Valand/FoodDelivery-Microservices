import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, restaurant } = action.payload
      const restaurantId = restaurant.restaurantId
      
      const existingRestaurantIndex = state.restaurants.findIndex(r => r.restaurantId === restaurantId)
      
      if (existingRestaurantIndex >= 0) {
        const restaurants = [...state.restaurants]
        const items = [...restaurants[existingRestaurantIndex].items]
        const existingItemIndex = items.findIndex(i => i.menuItemId === item.menuItemId)
        
        if (existingItemIndex >= 0) {
          items[existingItemIndex] = {
            ...items[existingItemIndex],
            quantity: items[existingItemIndex].quantity + item.quantity
          }
        } else {
          items.push(item)
        }
        
        restaurants[existingRestaurantIndex] = {
          ...restaurants[existingRestaurantIndex],
          items
        }
        
        return { ...state, restaurants }
      } else {
        return {
          ...state,
          restaurants: [
            ...state.restaurants,
            {
              restaurantId: restaurant.restaurantId,
              name: restaurant.name,
              items: [item]
            }
          ]
        }
      }
    }
    case 'REMOVE_ITEM': {
      const { menuItemId, restaurantId } = action.payload
      const restaurants = state.restaurants.map(r => {
        if (r.restaurantId === restaurantId) {
          return {
            ...r,
            items: r.items.filter(item => item.menuItemId !== menuItemId)
          }
        }
        return r
      }).filter(r => r.items.length > 0)
      
      return { ...state, restaurants }
    }
    case 'UPDATE_QUANTITY': {
      const { menuItemId, quantity, restaurantId } = action.payload
      const restaurants = state.restaurants.map(r => {
        if (r.restaurantId === restaurantId) {
          return {
            ...r,
            items: r.items.map(item =>
              item.menuItemId === menuItemId
                ? { ...item, quantity }
                : item
            ).filter(item => item.quantity > 0)
          }
        }
        return r
      }).filter(r => r.items.length > 0)
      
      return { ...state, restaurants }
    }
    case 'CLEAR_CART':
      return {
        ...state,
        restaurants: []
      }
    case 'CLEAR_RESTAURANT': {
      const { restaurantId } = action.payload
      return {
        ...state,
        restaurants: state.restaurants.filter(r => r.restaurantId !== restaurantId)
      }
    }
    default:
      return state
  }
}

const getInitialState = () => {
  try {
    const saved = localStorage.getItem('cart')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.restaurants && Array.isArray(parsed.restaurants)) {
        return parsed
      }
      if (parsed.items && parsed.restaurant) {
        return {
          restaurants: [{
            restaurantId: parsed.restaurant.restaurantId,
            name: parsed.restaurant.name,
            items: parsed.items
          }]
        }
      }
    }
  } catch (e) {
    console.error('Failed to load cart:', e)
  }
  return {
    restaurants: []
  }
}

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, null, getInitialState)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state))
  }, [state])

  const addItem = (item, restaurant) => {
    if (!restaurant) return
    dispatch({ type: 'ADD_ITEM', payload: { item, restaurant } })
  }

  const removeItem = (menuItemId, restaurantId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { menuItemId, restaurantId } })
  }

  const updateQuantity = (menuItemId, quantity, restaurantId) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { menuItemId, quantity, restaurantId } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }
  
  const clearRestaurant = (restaurantId) => {
    dispatch({ type: 'CLEAR_RESTAURANT', payload: { restaurantId } })
  }

  const total = state.restaurants.reduce((sum, restaurant) => {
    return sum + restaurant.items.reduce((rSum, item) => rSum + item.price * item.quantity, 0)
  }, 0)
  
  const count = state.restaurants.reduce((sum, restaurant) => {
    return sum + restaurant.items.reduce((rSum, item) => rSum + item.quantity, 0)
  }, 0)
  
  const items = state.restaurants.flatMap(r => 
    r.items.map(item => ({ ...item, restaurantId: r.restaurantId, restaurantName: r.name }))
  )

  return (
    <CartContext.Provider value={{
      items,
      restaurants: state.restaurants,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearRestaurant,
      total,
      count,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
