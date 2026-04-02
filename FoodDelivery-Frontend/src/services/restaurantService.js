import api from './api';

export const restaurantService = {
    getRestaurants: async () => {
        try {
            const response = await api.get('/restaurant');
            return response.data;
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            throw error.response?.data?.message || 'Failed to fetch restaurants';
        }
    },

    getRestaurantById: async (id) => {
        try {
            const response = await api.get(`/restaurant/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching restaurant ${id}:`, error);
            throw error.response?.data?.message || 'Failed to fetch restaurant details';
        }
    }
};

export default restaurantService;