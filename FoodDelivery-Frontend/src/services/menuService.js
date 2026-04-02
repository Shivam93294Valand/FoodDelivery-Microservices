import api from './api';

export const menuService = {
    // Get menu for a restaurant
    getMenuByRestaurantId: async (restaurantId) => {
        try {
            const response = await api.get(`/menu/restaurant/${restaurantId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching menu for restaurant ${restaurantId}:`, error);
            throw error.response?.data?.message || 'Failed to fetch menu';
        }
    },

    // Get menu item details
    getMenuItemById: async (id) => {
        try {
            const response = await api.get(`/menu/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching menu item ${id}:`, error);
            throw error.response?.data?.message || 'Failed to fetch menu item details';
        }
    }
};

export default menuService;