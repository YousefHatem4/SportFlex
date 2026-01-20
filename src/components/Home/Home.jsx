import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import {
    FaHeart,
    FaRegHeart,
    FaShoppingCart,
    FaCartPlus,
    FaCheck,
    FaTimes,
    FaEye,
    FaList,
    FaBolt,
    FaArrowRight,
    FaLayerGroup,
    FaRunning,
    FaMedal,
    FaFutbol,
    FaFire,
    FaShippingFast,
    FaShieldAlt,
    FaCheckCircle,
    FaUsers,
    FaAward,
    FaBoxOpen,
    FaTags,
    FaChevronRight,
    FaHandPointer
} from 'react-icons/fa';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Check user session
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            if (session?.user) {
                // Load user's cart and wishlist
                fetchUserCart(session.user.id);
                fetchUserWishlist(session.user.id);
            }
        };

        checkUser();

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user || null);
                if (session?.user) {
                    fetchUserCart(session.user.id);
                    fetchUserWishlist(session.user.id);
                } else {
                    setCartItems([]);
                    setWishlistItems([]);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Fetch products from database with feedback counts
    const fetchProducts = async () => {
        try {
            setLoading(true);

            // Try to fetch from the view first
            const { data: viewData, error: viewError } = await supabase
                .from('products_with_feedback')
                .select('*')
                .gt('stock', 0)
                .order('created_at', { ascending: false })
                .limit(8);

            if (!viewError && viewData) {
                console.log('Products with feedback fetched from view:', viewData?.length);
                return viewData.map(product => ({
                    ...product,
                    ratingsAverage: parseFloat(product.actual_rating) || 4.5,
                    feedbackCount: product.feedback_count || 0,
                    // Maintain backward compatibility
                    ratingsCount: product.feedback_count || 0
                }));
            }

            // Fallback to original query if view doesn't exist
            console.log('View not found, using original query:', viewError);
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        name,
                        image_url
                    )
                `)
                .gt('stock', 0)
                .order('created_at', { ascending: false })
                .limit(8);

            if (error) throw error;

            // Fetch feedback counts separately
            const productIds = data?.map(p => p.id) || [];
            let feedbackCounts = {};

            if (productIds.length > 0) {
                const { data: feedbackData, error: feedbackError } = await supabase
                    .from('product_feedback')
                    .select('product_id, rating')
                    .in('product_id', productIds);

                if (!feedbackError && feedbackData) {
                    // Calculate counts and averages
                    feedbackData.forEach(fb => {
                        if (!feedbackCounts[fb.product_id]) {
                            feedbackCounts[fb.product_id] = {
                                count: 0,
                                totalRating: 0
                            };
                        }
                        feedbackCounts[fb.product_id].count++;
                        feedbackCounts[fb.product_id].totalRating += fb.rating;
                    });
                }
            }

            return (data || []).map(product => {
                const feedback = feedbackCounts[product.id] || { count: 0, totalRating: 0 };
                const avgRating = feedback.count > 0
                    ? feedback.totalRating / feedback.count
                    : 4.5;

                return {
                    ...product,
                    ratingsAverage: parseFloat(avgRating.toFixed(1)),
                    feedbackCount: feedback.count,
                    ratingsCount: feedback.count
                };
            });

        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories from database
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name')
                .limit(6);

            if (error) throw error;

            console.log('Categories fetched:', data?.length);
            return data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            return [];
        }
    };

    // Fetch user's cart items
    const fetchUserCart = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('product_id')
                .eq('user_id', userId);

            if (error) throw error;

            const cartProductIds = data?.map(item => item.product_id) || [];
            setCartItems(cartProductIds);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    // Fetch user's wishlist items
    const fetchUserWishlist = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('wishlist_items')
                .select('product_id')
                .eq('user_id', userId);

            if (error) throw error;

            const wishlistProductIds = data?.map(item => item.product_id) || [];
            setWishlistItems(wishlistProductIds);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    // Helper function to render star ratings
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                    if (i < fullStars) {
                        return <i key={i} className="fas fa-star text-amber-500 text-xs"></i>;
                    } else if (i === fullStars && hasHalfStar) {
                        return <i key={i} className="fas fa-star-half-alt text-amber-500 text-xs"></i>;
                    } else {
                        return <i key={i} className="far fa-star text-amber-500 text-xs"></i>;
                    }
                })}
            </div>
        );
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    fetchProducts(),
                    fetchCategories()
                ]);

                setProducts(productsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load page data');
            }
        };

        loadData();
        document.title = 'Home - SportFlex Store';
    }, []);

    const handleAddToCart = async (productId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error("You must sign in first to add to cart");
                navigate("/login");
                return;
            }

            // Check if product is already in cart
            const { data: existingItem, error: checkError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('product_id', productId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw checkError;
            }

            if (existingItem) {
                // Update quantity
                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: existingItem.quantity + 1 })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
                toast.success("Product quantity updated in cart!");
            } else {
                // Add new item to cart
                const { error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: session.user.id,
                        product_id: productId,
                        quantity: 1
                    });

                if (insertError) throw insertError;
                toast.success("Product added to cart!");
            }

            // Update local state
            setCartItems((prev) => [...prev, productId]);

            // Refresh cart count
            fetchUserCart(session.user.id);

        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error(error.message || 'Failed to add to cart');
        }
    };

    const handleWishlistAction = async (productId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error("You must sign in first to manage wishlist");
                navigate("/login");
                return;
            }

            // Check if product is already in wishlist
            const { data: existingItem, error: checkError } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('product_id', productId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingItem) {
                // Remove from wishlist
                const { error: deleteError } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('id', existingItem.id);

                if (deleteError) throw deleteError;

                setWishlistItems(wishlistItems.filter(id => id !== productId));
                toast.success("Product removed from wishlist!");
            } else {
                // Add to wishlist
                const { error: insertError } = await supabase
                    .from('wishlist_items')
                    .insert({
                        user_id: session.user.id,
                        product_id: productId
                    });

                if (insertError) throw insertError;

                setWishlistItems([...wishlistItems, productId]);
                toast.success("Product added to wishlist!");
            }

            // Refresh wishlist
            fetchUserWishlist(session.user.id);

        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error(error.message || 'Failed to update wishlist');
        }
    };

    // Check if product is in wishlist
    const isInWishlist = (productId) => {
        return wishlistItems.includes(productId);
    };

    // Check if product is in cart
    const isInCart = (productId) => {
        return cartItems.includes(productId);
    };

    // Handle category click to navigate to products with filter
    const handleCategoryClick = (categoryId) => {
        navigate(`/products?category=${categoryId}`);
    };

    // Get cart items count
    const cartItemsCount = cartItems.length;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ========== UPDATED HEADER SECTION ========== */}
            <section className="relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50"></div>
                <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-200/20 to-teal-200/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-blue-100/30 to-teal-100/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

                {/* Main Header Container */}
                <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-24 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* Left Column - Hero Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center lg:text-left"
                        >
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full px-4 py-2 mb-6 backdrop-blur-sm border border-blue-200/50">
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                                    Premium SportFlex Collection
                                </span>
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                                <span className="block text-gray-900">Elevate Your</span>
                                <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600 bg-clip-text text-transparent animate-gradient">
                                    Athletic Performance
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                                Discover premium sportswear that combines cutting-edge technology with stylish design. Perfect for athletes who demand excellence in every move.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/products')}
                                    className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center justify-center gap-3">
                                        <FaBolt className="text-lg" />
                                        Shop Now
                                        <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                                    </span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/category')}
                                    className="group bg-white text-gray-800 font-semibold py-4 px-8 rounded-xl border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        <FaLayerGroup className="text-blue-500" />
                                        Browse Categories
                                    </span>
                                </motion.button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
                                <div className="text-center">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">500+</div>
                                    <div className="text-sm text-gray-500">Premium Products</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">24/7</div>
                                    <div className="text-sm text-gray-500">Customer Support</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">30-Day</div>
                                    <div className="text-sm text-gray-500">Returns</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column - Visual Elements */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Main Image/Visual Container */}
                            <div className="relative">
                                {/* Floating Elements */}
                                <motion.div
                                    animate={{ y: [-10, 10, -10] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-2xl backdrop-blur-sm border border-blue-200/30 shadow-lg"
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FaRunning className="text-3xl bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent" />
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [10, -10, 10] }}
                                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                                    className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-teal-300/20 rounded-full backdrop-blur-sm border border-teal-200/30 shadow-lg"
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FaMedal className="text-2xl bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent" />
                                    </div>
                                </motion.div>

                                {/* Main Card */}
                                <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/50 overflow-hidden">
                                    {/* Animated Gradient Border */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-blue-500/10 animate-gradient-x rounded-3xl"></div>

                                    {/* Card Content */}
                                    <div className="relative z-10">
                                        {/* Featured Categories */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Featured Categories</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {categories.slice(0, 4).map((category, index) => (
                                                    <motion.div
                                                        key={category.id}
                                                        whileHover={{ scale: 1.05 }}
                                                        onClick={() => handleCategoryClick(category.id)}
                                                        className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-3 border border-gray-100 hover:border-blue-200 cursor-pointer transition-all duration-300"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                          
                                                            <span className="text-sm font-medium text-gray-800 truncate">
                                                                {category.name}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="bg-gradient-to-r from-blue-500/5 to-teal-500/5 rounded-2xl p-6 mb-6">
                                            <h4 className="font-semibold text-gray-800 mb-3">Today's Deals</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Flash Sale</span>
                                                    <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                                                        Up to 50% OFF
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">New Arrivals</span>
                                                    <span className="text-sm font-bold text-green-600">+25 Items</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => navigate('/products')}
                                            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                        >
                                            <FaFire />
                                            View Hot Deals
                                        </button>
                                    </div>

                                    {/* Decorative Corner Accents */}
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-teal-500/10 rounded-bl-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-teal-500/10 rounded-tr-3xl"></div>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap justify-center gap-4 mt-8">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FaShippingFast className="text-blue-500" />
                                    <span>Free Shipping</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FaShieldAlt className="text-teal-500" />
                                    <span>Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FaCheckCircle className="text-green-500" />
                                    <span>Quality Guarantee</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Scroll Indicator */}
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden lg:block"
                    >
                        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
                            <div className="w-1 h-3 bg-gradient-to-b from-blue-500 to-teal-400 rounded-full mt-2 animate-bounce"></div>
                        </div>
                    </motion.div>
                </div>
            </section>
            {/* ========== END OF UPDATED HEADER SECTION ========== */}

            {/* Products Section */}
            <section className='my-10 px-4 sm:px-6 lg:px-30'>
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='px-2 sm:px-0'
                >
                    <div className='flex items-center gap-5'>
                        <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                        <h1 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>Our Products</h1>
                    </div>
                    <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mt-5 sm:mt-7 mb-6 sm:mb-10 text-gray-800'>Explore Our SportFlex</h1>
                </motion.div>

                {/* Products Grid - Enhanced for Mobile & Tablet */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {products.length > 0 ? (
                        products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className='group'
                            >
                                {/* Enhanced Product Card for Mobile/Tablet */}
                                <div className='cursor-pointer product bg-white rounded-xl lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full border border-gray-100 hover:-translate-y-1 lg:hover:-translate-y-2 overflow-hidden'>
                                    {/* Product Image Container */}
                                    <Link to={`/productdetails/${product.id}`} className='block relative'>
                                        <div className="relative overflow-hidden rounded-t-xl lg:rounded-t-2xl">
                                            <div className="aspect-square w-full relative">
                                                <img
                                                    src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                                    }}
                                                />

                                                {/* Mobile-optimized Stock Badge */}
                                                <div className="absolute top-2 left-2">
                                                    {product.stock <= 10 && product.stock > 0 ? (
                                                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                                            <span className="hidden sm:inline">Only </span>{product.stock} left
                                                        </div>
                                                    ) : product.stock === 0 ? (
                                                        <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                                            Sold Out
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* Mobile-only Quick Action Overlay */}
                                                <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                                                    <span className="text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                                                        Quick View
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile-only Floating Wishlist Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleWishlistAction(product.id);
                                                }}
                                                className="lg:hidden absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
                                            >
                                                {isInWishlist(product.id) ? (
                                                    <FaHeart className="text-sm text-rose-500" />
                                                ) : (
                                                    <FaRegHeart className="text-sm text-gray-400" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Product Info - Enhanced for Mobile */}
                                        <div className="p-3 sm:p-4 space-y-2">
                                            {/* Category Badge - Mobile Optimized */}
                                            <div className="flex items-center justify-between">
                                                <span className="inline-block text-xs font-medium text-gray-400 uppercase tracking-wide truncate max-w-[70%]">
                                                    {product.categories?.name || product.category || product.category_name || 'Uncategorized'}
                                                </span>

                                                {/* Mobile-only Rating */}
                                                <div className="lg:hidden flex items-center text-amber-500 text-xs">
                                                    {renderStars(product.ratingsAverage || 4.5)}
                                                    <span className="font-medium ml-1">{(product.ratingsAverage || 4.5).toFixed(1)}</span>
                                                </div>
                                            </div>

                                            {/* Product Title - Better Mobile Typography */}
                                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors duration-300">
                                                {product.title}
                                            </h3>

                                            {/* Price & Rating - Enhanced Layout */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                                                        EGP {parseFloat(product.price).toFixed(2)}
                                                    </span>
                                                    {/* Original Price if on sale */}
                                                    {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            EGP {parseFloat(product.originalPrice).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Desktop-only Rating with REAL feedback count */}
                                                <div className="hidden lg:flex items-center">
                                                    <div className="flex items-center text-amber-500 text-sm">
                                                        {renderStars(product.ratingsAverage || 4.5)}
                                                        <span className="font-medium ml-1">{(product.ratingsAverage || 4.5).toFixed(1)}</span>
                                                    </div>
                                                    <span className="text-gray-400 text-xs ml-1">
                                                        ({product.feedbackCount || product.ratingsCount || 0})
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile-only Stock Indicator */}
                                            <div className="lg:hidden">
                                                {product.stock > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-green-500 h-1.5 rounded-full"
                                                                style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">{product.stock} in stock</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Enhanced Action Buttons for Mobile/Tablet */}
                                    <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0">
                                        <div className="flex items-center gap-2">
                                            {/* Mobile: Full width button, Tablet+: Flex layout */}
                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={isInCart(product.id) || product.stock <= 0}
                                                className={`cursor-pointer flex-1 py-3 sm:py-2.5 rounded-lg lg:rounded-xl transition-all duration-300 text-sm font-medium 
                                                        ${isInCart(product.id)
                                                        ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed shadow-md"
                                                        : product.stock <= 0
                                                            ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-600 cursor-not-allowed"
                                                            : "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 hover:shadow-lg active:scale-95"}`}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    {isInCart(product.id) ? (
                                                        <>
                                                            <FaCheck className="text-sm" />
                                                            <span className="hidden sm:inline">Added</span>
                                                            <span className="sm:hidden">In Cart</span>
                                                        </>
                                                    ) : product.stock <= 0 ? (
                                                        <>
                                                            <FaTimes className="text-sm" />
                                                            <span className="hidden sm:inline">Out of Stock</span>
                                                            <span className="sm:hidden">Sold Out</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaCartPlus className="text-sm" />
                                                            <span className="hidden sm:inline">Add to Cart</span>
                                                            <span className="sm:hidden">Add</span>
                                                        </>
                                                    )}
                                                </div>
                                            </button>

                                            {/* Desktop-only Wishlist Button */}
                                            <button
                                                onClick={() => handleWishlistAction(product.id)}
                                                className="hidden lg:flex cursor-pointer p-2.5 rounded-full border transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
                                                style={{
                                                    background: isInWishlist(product.id)
                                                        ? 'linear-gradient(135deg, rgba(255, 228, 230, 1), rgba(251, 207, 232, 1))'
                                                        : 'white',
                                                    borderColor: isInWishlist(product.id) ? '#fb7185' : '#e5e7eb'
                                                }}
                                                title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                            >
                                                {isInWishlist(product.id) ? (
                                                    <FaHeart className="text-lg text-rose-500 animate-pulse" />
                                                ) : (
                                                    <FaRegHeart className="text-lg text-gray-500 hover:text-rose-500" />
                                                )}
                                            </button>
                                        </div>


                                    </div>

                                    {/* Decorative Bottom Accent - Mobile Only */}
                                    <div className="lg:hidden absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <FaBoxOpen className="text-4xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Products Available</h3>
                            <p className="text-gray-500">Check back soon for new arrivals!</p>
                        </div>
                    )}
                </div>

                {products.length > 0 && (
                    <div className='flex justify-center mt-8 lg:mt-10'>
                        <Link to={'/products'}
                            className="w-full sm:w-1/2 md:w-1/3 lg:w-[15%] py-3 px-4 text-center border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                        >
                            <FaEye className="inline mr-2" /> View All Products
                        </Link>
                    </div>
                )}
            </section>

            {/* Category Section - Enhanced for Mobile & Tablet */}
            <section className='px-4 sm:px-6 lg:px-30 py-12 sm:py-16 bg-gradient-to-b from-blue-50/30 via-white to-gray-50/30'>
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='px-2 sm:px-0 mb-8 sm:mb-12'
                >
                    <div className='flex items-center gap-5 mb-4'>
                        <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                        <h1 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>Categories</h1>
                    </div>
                    <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-gray-800'>Browse SportFlex Categories</h1>
                    <p className='text-gray-600 text-base lg:text-lg max-w-xl'>Discover our premium SportFlex collections</p>
                </motion.div>

                {/* Enhanced Categories Grid for Mobile/Tablet */}
                <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-8'>
                    {categories.length > 0 ? (
                        categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCategoryClick(category.id)}
                                className='group relative overflow-hidden rounded-xl lg:rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 lg:hover:-translate-y-2 cursor-pointer border border-gray-100 active:scale-95 lg:active:scale-100'
                            >
                                {/* Mobile-optimized Background gradient overlay */}
                                <div className='absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                                {/* Enhanced Content container for Mobile */}
                                <div className='relative p-4 sm:p-5 lg:p-8 flex flex-col items-center text-center'>
                                    {/* Mobile-optimized Image container */}
                                    <div className='relative mb-4 sm:mb-5 lg:mb-6 overflow-hidden rounded-lg lg:rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 p-3 sm:p-4 group-hover:from-blue-100 group-hover:to-teal-100 transition-all duration-300'>
                                        {/* Image with Mobile Optimization */}
                                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto">
                                            <img
                                                src={category.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                                className='w-full h-full object-cover object-center group-hover:scale-110 transition-all duration-300'
                                                alt={category.name}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                                }}
                                            />

                                            {/* Mobile-only Decorative circle */}
                                            <div className='absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                                            {/* Mobile-only Floating Icon */}
                                            <div className="lg:hidden absolute -bottom-2 -left-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                                                <FaChevronRight className="text-xs text-blue-500" />
                                            </div>
                                        </div>

                                        {/* Mobile-only Product Count Badge */}
                                        <div className="lg:hidden absolute -bottom-2 -right-2">
                                            <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                                {Math.floor(Math.random() * 50) + 10}+
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category name - Mobile Optimized */}
                                    <h3 className='font-semibold text-base sm:text-lg lg:text-xl text-gray-800 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-teal-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 mb-1'>
                                        {category.name}
                                    </h3>

                                    {/* Mobile-only Subtitle */}
                                    <p className='lg:hidden text-xs text-gray-500 mt-1 line-clamp-1'>
                                        Explore collection
                                    </p>

                                    {/* Desktop-only Subtle description */}
                                    <p className='hidden lg:block text-sm text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 line-clamp-2'>
                                        {category.description || 'Explore premium collection'}
                                    </p>

                                    {/* Enhanced Click hint for Mobile */}
                                    <div className="mt-3 lg:mt-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                                            <FaArrowRight className="text-xs" />
                                            <span className="hidden sm:inline">Click to explore</span>
                                            <span className="sm:hidden">Explore</span>
                                        </span>
                                    </div>

                                    {/* Mobile-only Touch Indicator */}
                                    <div className="lg:hidden absolute bottom-2 right-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <FaHandPointer className="text-sm" />
                                    </div>
                                </div>

                                {/* Bottom border accent - Enhanced for Mobile */}
                                <div className='absolute bottom-0 left-0 right-0 h-0.5 lg:h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'></div>

                                {/* Mobile-only Top Accent */}
                                <div className='lg:hidden absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left delay-100'></div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <FaTags className="text-4xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Categories Available</h3>
                            <p className="text-gray-500">Categories will be added soon!</p>
                        </div>
                    )}
                </div>

                {categories.length > 0 && (
                    <div className='flex justify-center mt-8 lg:mt-10'>
                        <Link to={'/category'}
                            className="w-full sm:w-1/2 md:w-1/3 lg:w-[15%] py-3 px-4 text-center border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                        >
                            <FaList className="inline mr-2" /> View All Categories
                        </Link>
                    </div>
                )}
            </section>

            {/* Features Section */}
            <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-30 bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 relative overflow-hidden'>
                {/* Background decorative elements */}
                <div className='absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-teal-400/20 rounded-full blur-xl'></div>
                <div className='absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-blue-300/10 to-teal-300/10 rounded-full blur-2xl'></div>

                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-center mb-12 lg:mb-16'
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                        <h2 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>Why Choose Us</h2>
                    </div>
                    <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-800'>Premium SportFlex Experience</h1>
                    <p className='text-gray-600 text-base lg:text-lg max-w-2xl mx-auto'>We're committed to providing exceptional service and support at every step of your fitness journey</p>
                </motion.div>

                {/* Optional: Additional trust indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className='mt-12 lg:mt-16 text-center'
                >
                    <div className='inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-gray-500 text-sm'>
                        <div className='flex items-center gap-2'>
                            <FaShieldAlt className="bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent" />
                            <span>Secure Payment</span>
                        </div>
                        <div className='hidden sm:block w-px h-4 bg-gradient-to-b from-blue-200 to-teal-200'></div>
                        <div className='flex items-center gap-2'>
                            <FaUsers className="bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent" />
                            <span>10k+ Happy Customers</span>
                        </div>
                        <div className="hidden sm:block w-px h-4 bg-gradient-to-b from-blue-200 to-teal-200"></div>
                        <div className="flex items-center gap-2">
                            <FaAward className="bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent" />
                            <span>Premium Quality</span>
                        </div>
                    </div>
                </motion.div>
            </section>
        </>
    );
}