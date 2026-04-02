import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, Truck, Loader2, ArrowLeft, Plus, ShoppingBag } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from './ui/animations';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';

const RestaurantDetail = () => {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRestaurantAndMenu = async () => {
            try {
                setLoading(true);
                const [restaurantData, menuData] = await Promise.all([
                    restaurantService.getRestaurantById(id),
                    menuService.getMenuByRestaurantId(id)
                ]);
                setRestaurant(restaurantData);
                setMenuItems(menuData);
                setError(null);
            } catch (err) {
                setError("Failed to load restaurant details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurantAndMenu();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                <p className="text-gray-500 animate-pulse">Loading menu...</p>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 text-lg mb-4">{error || "Restaurant not found"}</p>
                <Link to="/restaurants" className="text-orange-600 flex items-center hover:underline">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Restaurants
                </Link>
            </div>
        );
    }

    const categories = [...new Set(menuItems.map(item => item.category))];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header / Hero */}
            <div className="relative h-96">
                <img
                    src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070"}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-end">
                    <div className="max-w-7xl mx-auto w-full px-4 pb-12">
                        <Link to="/restaurants" className="inline-flex items-center text-white mb-6 hover:text-orange-400 transition-colors">
                            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Restaurants
                        </Link>
                        <h1 className="text-5xl font-extrabold text-white mb-4">{restaurant.name}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-white text-sm font-medium">
                            <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                <span>{restaurant.rating || '4.5'} Rating</span>
                            </div>
                            <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                                <Clock className="w-4 h-4 mr-1 text-orange-400" />
                                <span>{restaurant.openingTime} - {restaurant.closingTime}</span>
                            </div>
                            <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                                <Truck className="w-4 h-4 mr-1 text-green-400" />
                                <span>Free Delivery</span>
                            </div>
                            <div className="text-white/80">
                                {restaurant.cuisine} • {restaurant.address}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Categories Sidebar (Sticky) */}
                    <div className="lg:w-1/4">
                        <div className="sticky top-32 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center">
                                <ShoppingBag className="w-5 h-5 mr-2 text-orange-600" /> Menu Categories
                            </h2>
                            <ul className="space-y-4">
                                {categories.map(cat => (
                                    <li key={cat}>
                                        <a href={`#${cat}`} className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium block transition-colors capitalize">
                                            {cat}
                                        </a>
                                    </li>
                                ))}
                                {categories.length === 0 && <li className="text-gray-500 italic">No categories available</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="lg:w-3/4">
                        {categories.map(cat => (
                            <section key={cat} id={cat} className="mb-16 scroll-mt-32">
                                <h2 className="text-3xl font-bold mb-8 dark:text-white capitalize">{cat}</h2>
                                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {menuItems.filter(item => item.category === cat).map(item => (
                                        <StaggerItem key={item.menuItemId}>
                                            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-lg font-bold dark:text-white">{item.name}</h3>
                                                        {item.isVegetarian && (
                                                            <div className="w-4 h-4 border-2 border-green-600 p-0.5 rounded-sm flex items-center justify-center">
                                                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{item.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl font-bold text-orange-600">${item.price}</span>
                                                        <button className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all">
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {item.imageUrl && (
                                                    <div className="w-24 h-24 flex-shrink-0">
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-2xl shadow-sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </StaggerItem>
                                    ))}
                                </StaggerContainer>
                            </section>
                        ))}
                        {menuItems.length === 0 && (
                            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                <p className="text-gray-500">No menu items found for this restaurant.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetail;