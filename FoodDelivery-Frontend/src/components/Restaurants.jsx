import React, { useState, useEffect } from 'react';
import { Search, Star, Clock, Truck, Loader2, MapPin } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from './ui/animations';
import { Link } from 'react-router-dom';
import restaurantService from '../services/restaurantService';

const Restaurants = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                setLoading(true);
                const data = await restaurantService.getRestaurants();
                setRestaurants(data);
                setError(null);
            } catch (err) {
                setError("Failed to load restaurants. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, []);

    const filteredRestaurants = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisine?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
            <FadeIn>
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">All Restaurants</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">Discover the best food near you</p>
                </div>

                <div className="relative max-w-2xl mx-auto mb-16">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for restaurants or cuisines..."
                        className="block w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </FadeIn>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                    <p className="text-gray-500 animate-pulse">Loading restaurants...</p>
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-red-500 text-lg">{error}</p>
                </div>
            ) : (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRestaurants.map((rest) => (
                        <StaggerItem key={rest.restaurantId}>
                            <ScaleOnHover>
                                <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-md hover:shadow-xl transition-all h-full flex flex-col">
                                    <div className="relative h-56">
                                        <img
                                            src={rest.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070"}
                                            alt={rest.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${rest.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {rest.isActive ? 'OPEN' : 'CLOSED'}
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{rest.name}</h3>
                                            <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                                <Star className="w-4 h-4 text-green-600 fill-current mr-1" />
                                                <span className="text-sm font-bold text-green-700 dark:text-green-400">{rest.rating || '4.5'}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{rest.cuisine || 'International'}</p>
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6 gap-4">
                                            <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                                                <Clock className="w-4 h-4 mr-1 text-orange-500" />
                                                <span>20-30 min</span>
                                            </div>
                                            <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                                                <Truck className="w-4 h-4 mr-1 text-orange-500" />
                                                <span>Free</span>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/restaurant/${rest.restaurantId}`}
                                            className="mt-auto w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-center transition-colors"
                                        >
                                            View Menu
                                        </Link>
                                    </div>
                                </div>
                            </ScaleOnHover>
                        </StaggerItem>
                    ))}
                    {filteredRestaurants.length === 0 && (
                        <div className="col-span-full text-center py-20">
                            <p className="text-gray-500 text-lg">No restaurants found matching your search.</p>
                        </div>
                    )}
                </StaggerContainer>
            )}
        </div>
    );
};

export default Restaurants;