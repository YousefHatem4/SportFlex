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
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const navigate = useNavigate();

    // Listen for theme changes
    useEffect(() => {
        const checkTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            setIsDarkMode(savedTheme ? savedTheme === 'dark' : true);
        };

        window.addEventListener('storage', checkTheme);
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isDark = document.documentElement.classList.contains('dark');
                    setIsDarkMode(isDark);
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => {
            window.removeEventListener('storage', checkTheme);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            if (session?.user) {
                fetchUserCart(session.user.id);
                fetchUserWishlist(session.user.id);
            }
        };

        checkUser();

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

    const fetchProducts = async () => {
        try {
            setLoading(true);

            // DIRECT QUERY WITHOUT VIEWS
            // Just query the products table directly
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

            // Map the data with feedback counts
            const productsWithFeedback = (data || []).map(product => {
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

            return productsWithFeedback;

        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
            return [];
        } finally {
            setLoading(false);
        }
    };
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name')
                .limit(6);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            return [];
        }
    };

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

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                    if (i < fullStars) {
                        return <i key={i} className={`fas fa-star ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} text-xs`}></i>;
                    } else if (i === fullStars && hasHalfStar) {
                        return <i key={i} className={`fas fa-star-half-alt ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} text-xs`}></i>;
                    } else {
                        return <i key={i} className={`far fa-star ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} text-xs`}></i>;
                    }
                })}
            </div>
        );
    };

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

            const { data: existingItem, error: checkError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('product_id', productId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingItem) {
                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: existingItem.quantity + 1 })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
                toast.success("Product quantity updated in cart!");
            } else {
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

            setCartItems((prev) => [...prev, productId]);
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
                const { error: deleteError } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('id', existingItem.id);

                if (deleteError) throw deleteError;

                setWishlistItems(wishlistItems.filter(id => id !== productId));
                toast.success("Product removed from wishlist!");
            } else {
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

            fetchUserWishlist(session.user.id);

        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error(error.message || 'Failed to update wishlist');
        }
    };

    const isInWishlist = (productId) => {
        return wishlistItems.includes(productId);
    };

    const isInCart = (productId) => {
        return cartItems.includes(productId);
    };

    const handleCategoryClick = (categoryId) => {
        navigate(`/products?category=${categoryId}`);
    };

    const cartItemsCount = cartItems.length;

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4
                        ${isDarkMode ? 'border-cyan-500' : 'border-cyan-600'}`}></div>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header Section */}
            <section className={`relative overflow-hidden transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>

                <div className={`absolute inset-0 transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900'
                        : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'}`}>
                </div>

                <div className={`absolute top-0 left-0 w-72 h-72 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-br from-cyan-900/20 to-cyan-700/20'
                        : 'bg-gradient-to-br from-cyan-200/40 to-cyan-100/40'}`}>
                </div>

                <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-tr from-cyan-800/30 to-cyan-600/30'
                        : 'bg-gradient-to-tr from-cyan-200/50 to-cyan-100/50'}`}>
                </div>

                <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-24 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* Left Column */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center lg:text-left"
                        >
                            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 backdrop-blur-sm border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 border-cyan-700/50'
                                    : 'bg-gradient-to-r from-cyan-100 to-cyan-50 border-cyan-200'}`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                        : 'bg-gradient-to-r from-cyan-600 to-cyan-500'}`}>
                                </div>
                                <span className={`text-sm font-medium transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-600 bg-clip-text text-transparent'}`}>
                                    Premium SportFlex Collection
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                                <span className={`block transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Elevate Your
                                </span>
                                <span className={`bg-gradient-to-r bg-clip-text text-transparent animate-gradient
                                    ${isDarkMode
                                        ? 'from-cyan-400 via-cyan-300 to-cyan-400'
                                        : 'from-cyan-700 via-cyan-600 to-cyan-700'}`}>
                                    Athletic Performance
                                </span>
                            </h1>

                            <p className={`text-lg mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed transition-colors duration-300
                                ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Discover premium sportswear that combines cutting-edge technology with stylish design. Perfect for athletes who demand excellence in every move.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/products')}
                                    className={`group relative overflow-hidden text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                                >
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-700'
                                            : 'bg-gradient-to-r from-cyan-800 to-cyan-900'}`}>
                                    </div>
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
                                    className={`group font-semibold py-4 px-8 rounded-xl border-2 shadow-sm hover:shadow-lg transition-all duration-300
                                        ${isDarkMode
                                            ? 'bg-gray-900 text-white border-gray-800 hover:border-cyan-500'
                                            : 'bg-white text-gray-800 border-gray-200 hover:border-cyan-600'}`}
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        <FaLayerGroup className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                        Browse Categories
                                    </span>
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
                                <div className="text-center">
                                    <div className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent
                                        ${isDarkMode
                                            ? 'from-cyan-400 to-cyan-300'
                                            : 'from-cyan-700 to-cyan-600'}`}>
                                        500+
                                    </div>
                                    <div className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Premium Products
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent
                                        ${isDarkMode
                                            ? 'from-cyan-400 to-cyan-300'
                                            : 'from-cyan-700 to-cyan-600'}`}>
                                        24/7
                                    </div>
                                    <div className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Customer Support
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent
                                        ${isDarkMode
                                            ? 'from-cyan-400 to-cyan-300'
                                            : 'from-cyan-700 to-cyan-600'}`}>
                                        30-Day
                                    </div>
                                    <div className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Returns
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ y: [-10, 10, -10] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className={`absolute -top-6 -left-6 w-24 h-24 rounded-2xl backdrop-blur-sm border shadow-lg transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-400/20 border-cyan-700/30'
                                            : 'bg-gradient-to-br from-cyan-200/40 to-cyan-100/40 border-cyan-200'}`}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FaRunning className={`text-3xl bg-gradient-to-r bg-clip-text text-transparent
                                            ${isDarkMode
                                                ? 'from-cyan-400 to-cyan-300'
                                                : 'from-cyan-700 to-cyan-600'}`} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [10, -10, 10] }}
                                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                                    className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full backdrop-blur-sm border shadow-lg transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-300/20 border-cyan-600/30'
                                            : 'bg-gradient-to-br from-cyan-200/40 to-cyan-100/40 border-cyan-200'}`}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FaMedal className={`text-2xl bg-gradient-to-r bg-clip-text text-transparent
                                            ${isDarkMode
                                                ? 'from-cyan-400 to-cyan-300'
                                                : 'from-cyan-700 to-cyan-600'}`} />
                                    </div>
                                </motion.div>

                                <div className={`relative backdrop-blur-lg rounded-3xl p-8 shadow-2xl border overflow-hidden transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gray-900/80 border-gray-800/50'
                                        : 'bg-white/80 border-gray-200'}`}>

                                    <div className={`absolute inset-0 animate-gradient-x rounded-3xl transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500/10 via-cyan-400/10 to-cyan-500/10'
                                            : 'bg-gradient-to-r from-cyan-200/20 via-cyan-100/20 to-cyan-200/20'}`}>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="mb-8">
                                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Featured Categories
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {categories.slice(0, 4).map((category, index) => (
                                                    <motion.div
                                                        key={category.id}
                                                        whileHover={{ scale: 1.05 }}
                                                        onClick={() => handleCategoryClick(category.id)}
                                                        className={`rounded-xl p-3 border cursor-pointer transition-all duration-300
                                                            ${isDarkMode
                                                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-cyan-600'
                                                                : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-cyan-600'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-sm font-medium truncate transition-colors duration-300
                                                                ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                                {category.name}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={`rounded-2xl p-6 mb-6 transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500/5 to-cyan-400/5'
                                                : 'bg-gradient-to-r from-cyan-100/30 to-cyan-50/30'}`}>
                                            <h4 className={`font-semibold mb-3 transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Today's Deals
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        Flash Sale
                                                    </span>
                                                    <span className={`text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent
                                                        ${isDarkMode
                                                            ? 'from-cyan-400 to-cyan-300'
                                                            : 'from-cyan-700 to-cyan-600'}`}>
                                                        Up to 50% OFF
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        New Arrivals
                                                    </span>
                                                    <span className={`text-sm font-bold
                                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                                        +25 Items
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate('/products')}
                                            className={`w-full text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2
                                                ${isDarkMode
                                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                        >
                                            <FaFire />
                                            View Hot Deals
                                        </button>
                                    </div>

                                    <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-br from-cyan-500/10 to-cyan-400/10'
                                            : 'bg-gradient-to-br from-cyan-200/30 to-cyan-100/30'}`}>
                                    </div>
                                    <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-tr-3xl transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-tr from-cyan-500/10 to-cyan-400/10'
                                            : 'bg-gradient-to-tr from-cyan-200/30 to-cyan-100/30'}`}>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mt-8">
                                <div className="flex items-center gap-2 text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
                                    <FaShippingFast className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'} />
                                    <span>Free Shipping</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
                                    <FaShieldAlt className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'} />
                                    <span>Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
                                    <FaCheckCircle className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'} />
                                    <span>Quality Guarantee</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden lg:block"
                    >
                        <div className={`w-6 h-10 border-2 rounded-full flex justify-center transition-colors duration-300
                            ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                            <div className={`w-1 h-3 rounded-full mt-2 animate-bounce transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-b from-cyan-500 to-cyan-400'
                                    : 'bg-gradient-to-b from-cyan-700 to-cyan-600'}`}>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Products Section */}
            <section className={`py-10 px-4 sm:px-6 lg:px-30 transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='px-2 sm:px-0'
                >
                    <div className='flex items-center gap-5'>
                        <div className={`w-[20px] h-[40px] rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                        </div>
                        <h1 className={`font-bold text-sm sm:text-base bg-gradient-to-r bg-clip-text text-transparent
                            ${isDarkMode
                                ? 'from-cyan-400 to-cyan-300'
                                : 'from-cyan-700 to-cyan-600'}`}>
                            Our Products
                        </h1>
                    </div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-5 sm:mt-7 mb-6 sm:mb-10 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Explore Our SportFlex
                    </h1>
                </motion.div>

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
                                <div className={`cursor-pointer rounded-xl lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full border hover:-translate-y-1 lg:hover:-translate-y-2 overflow-hidden
                                    ${isDarkMode
                                        ? 'bg-gray-900 border-gray-800'
                                        : 'bg-white border-gray-200'}`}>

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

                                                <div className="absolute top-2 left-2">
                                                    {product.stock <= 10 && product.stock > 0 ? (
                                                        <div className={`text-white text-xs font-bold px-2 py-1 rounded-full shadow-md
                                                            ${isDarkMode
                                                                ? 'bg-gradient-to-r from-cyan-700 to-cyan-600'
                                                                : 'bg-gradient-to-r from-cyan-800 to-cyan-700'}`}>
                                                            <span className="hidden sm:inline">Only </span>{product.stock} left
                                                        </div>
                                                    ) : product.stock === 0 ? (
                                                        <div className={`text-white text-xs font-bold px-2 py-1 rounded-full shadow-md
                                                            ${isDarkMode
                                                                ? 'bg-gradient-to-r from-red-700 to-rose-700'
                                                                : 'bg-gradient-to-r from-red-800 to-rose-800'}`}>
                                                            Sold Out
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                                                    <span className="text-white text-xs font-medium bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                                                        Quick View
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleWishlistAction(product.id);
                                                }}
                                                className={`lg:hidden absolute top-2 right-2 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 border
                                                    ${isDarkMode
                                                        ? 'bg-gray-900/90 border-gray-700'
                                                        : 'bg-white/90 border-gray-200'}`}
                                            >
                                                {isInWishlist(product.id) ? (
                                                    <FaHeart className={`text-sm ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                                ) : (
                                                    <FaRegHeart className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                                )}
                                            </button>
                                        </div>

                                        <div className="p-3 sm:p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-block text-xs font-medium uppercase tracking-wide truncate max-w-[70%] transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {product.categories?.name || product.category || product.category_name || 'Uncategorized'}
                                                </span>

                                                <div className="lg:hidden flex items-center text-xs">
                                                    {renderStars(product.ratingsAverage || 4.5)}
                                                    <span className={`font-medium ml-1 transition-colors duration-300
                                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                                        {(product.ratingsAverage || 4.5).toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className={`text-sm sm:text-base font-semibold leading-tight line-clamp-2 min-h-[2.5rem] group-hover:transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-white group-hover:text-cyan-400'
                                                    : 'text-gray-900 group-hover:text-cyan-700'}`}>
                                                {product.title}
                                            </h3>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-base sm:text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent
                                                        ${isDarkMode
                                                            ? 'from-cyan-400 to-cyan-300'
                                                            : 'from-cyan-700 to-cyan-600'}`}>
                                                        EGP {parseFloat(product.price).toFixed(2)}
                                                    </span>
                                                    {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                                                        <span className={`text-xs line-through transition-colors duration-300
                                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            EGP {parseFloat(product.originalPrice).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="hidden lg:flex items-center">
                                                    <div className="flex items-center text-sm">
                                                        {renderStars(product.ratingsAverage || 4.5)}
                                                        <span className={`font-medium ml-1 transition-colors duration-300
                                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                                            {(product.ratingsAverage || 4.5).toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xs ml-1 transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        ({product.feedbackCount || product.ratingsCount || 0})
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="lg:hidden">
                                                {product.stock > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-full rounded-full h-1.5 transition-colors duration-300
                                                            ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                                            <div
                                                                className={`h-1.5 rounded-full transition-colors duration-300
                                                                    ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-700'}`}
                                                                style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-xs transition-colors duration-300
                                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {product.stock} in stock
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={isInCart(product.id) || product.stock <= 0}
                                                className={`cursor-pointer flex-1 py-3 sm:py-2.5 rounded-lg lg:rounded-xl transition-all duration-300 text-sm font-medium 
                                                    ${isInCart(product.id)
                                                        ? isDarkMode
                                                            ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white cursor-not-allowed shadow-md"
                                                            : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 cursor-not-allowed shadow-md"
                                                        : product.stock <= 0
                                                            ? isDarkMode
                                                                ? "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-400 cursor-not-allowed"
                                                                : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed"
                                                            : isDarkMode
                                                                ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 hover:shadow-lg active:scale-95"
                                                                : "bg-gradient-to-r from-cyan-700 to-cyan-800 text-white hover:from-cyan-800 hover:to-cyan-900 hover:shadow-lg active:scale-95"}`}
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

                                            <button
                                                onClick={() => handleWishlistAction(product.id)}
                                                className={`hidden lg:flex cursor-pointer p-2.5 rounded-full border transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1
                                                    ${isDarkMode
                                                        ? isInWishlist(product.id)
                                                            ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-400/20 border-cyan-500'
                                                            : 'bg-gray-900 border-gray-700'
                                                        : isInWishlist(product.id)
                                                            ? 'bg-gradient-to-r from-cyan-200/40 to-cyan-100/40 border-cyan-600'
                                                            : 'bg-white border-gray-200'}`}
                                                title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                            >
                                                {isInWishlist(product.id) ? (
                                                    <FaHeart className={`text-lg animate-pulse transition-colors duration-300
                                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                                ) : (
                                                    <FaRegHeart className={`text-lg transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-700'}`} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`lg:hidden absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500'
                                            : 'bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-700'}`}>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <div className={`mb-4 transition-colors duration-300
                                ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                <FaBoxOpen className="text-4xl" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300
                                ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                No Products Available
                            </h3>
                            <p className={`transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Check back soon for new arrivals!
                            </p>
                        </div>
                    )}
                </div>

                {products.length > 0 && (
                    <div className='flex justify-center mt-8 lg:mt-10'>
                        <Link to={'/products'}
                            className={`w-full sm:w-1/2 md:w-1/3 lg:w-[15%] py-3 px-4 text-center border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 focus:ring-cyan-500 focus:ring-offset-black'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900 focus:ring-cyan-700 focus:ring-offset-white'}`}
                        >
                            <FaEye className="inline mr-2" /> View All Products
                        </Link>
                    </div>
                )}
            </section>

            {/* Category Section */}
            <section className={`px-4 sm:px-6 lg:px-30 py-12 sm:py-16 relative overflow-hidden transition-colors duration-300
                ${isDarkMode
                    ? 'bg-gradient-to-b from-gray-900 via-black to-gray-900'
                    : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'}`}>

                <div className={`absolute top-10 left-10 w-20 h-20 rounded-full blur-xl transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-r from-cyan-900/20 to-cyan-700/20'
                        : 'bg-gradient-to-r from-cyan-200/40 to-cyan-100/40'}`}>
                </div>
                <div className={`absolute bottom-10 right-10 w-32 h-32 rounded-full blur-2xl transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-r from-cyan-800/10 to-cyan-600/10'
                        : 'bg-gradient-to-r from-cyan-200/30 to-cyan-100/30'}`}>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='px-2 sm:px-0 mb-8 sm:mb-12'
                >
                    <div className='flex items-center gap-5 mb-4'>
                        <div className={`w-[20px] h-[40px] rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                        </div>
                        <h1 className={`font-bold text-sm sm:text-base bg-gradient-to-r bg-clip-text text-transparent
                            ${isDarkMode
                                ? 'from-cyan-400 to-cyan-300'
                                : 'from-cyan-700 to-cyan-600'}`}>
                            Categories
                        </h1>
                    </div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Browse SportFlex Categories
                    </h1>
                    <p className={`text-base lg:text-lg max-w-xl transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Discover our premium SportFlex collections
                    </p>
                </motion.div>

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
                                className={`group relative overflow-hidden rounded-xl lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 lg:hover:-translate-y-2 cursor-pointer border active:scale-95 lg:active:scale-100
                                    ${isDarkMode
                                        ? 'bg-gray-900 border-gray-800'
                                        : 'bg-white border-gray-200'}`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-br from-transparent via-transparent to-cyan-500/5'
                                        : 'bg-gradient-to-br from-transparent via-transparent to-cyan-200/30'}`}>
                                </div>

                                <div className='relative p-4 sm:p-5 lg:p-8 flex flex-col items-center text-center'>
                                    <div className={`relative mb-4 sm:mb-5 lg:mb-6 overflow-hidden rounded-lg lg:rounded-xl p-3 sm:p-4 group-hover:transition-all duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-br from-gray-800 to-gray-900 group-hover:from-gray-700 group-hover:to-gray-800'
                                            : 'bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-gray-200 group-hover:to-gray-100'}`}>

                                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto">
                                            <img
                                                src={category.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                                className='w-full h-full object-cover object-center group-hover:scale-110 transition-all duration-300'
                                                alt={category.name}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                                }}
                                            />

                                            <div className={`absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                                ${isDarkMode
                                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                                            </div>

                                            <div className={`lg:hidden absolute -bottom-2 -left-2 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-colors duration-300
                                                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                <FaChevronRight className={`text-xs ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                            </div>
                                        </div>

                                        <div className="lg:hidden absolute -bottom-2 -right-2">
                                            <div className={`text-white text-xs font-bold px-2 py-1 rounded-full shadow-md
                                                ${isDarkMode
                                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                                {Math.floor(Math.random() * 50) + 10}+
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className={`font-semibold text-base sm:text-lg lg:text-xl mb-1 group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300
                                        ${isDarkMode
                                            ? 'text-white group-hover:from-cyan-400 group-hover:to-cyan-300'
                                            : 'text-gray-900 group-hover:from-cyan-700 group-hover:to-cyan-600'}`}>
                                        {category.name}
                                    </h3>

                                    <p className={`lg:hidden text-xs mt-1 line-clamp-1 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Explore collection
                                    </p>

                                    <p className={`hidden lg:block text-sm mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 line-clamp-2
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {category.description || 'Explore premium collection'}
                                    </p>

                                    <div className="mt-3 lg:mt-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 sm:px-3 sm:py-1 rounded-full
                                            ${isDarkMode
                                                ? 'text-cyan-400 bg-cyan-900/30'
                                                : 'text-cyan-700 bg-cyan-100'}`}>
                                            <FaArrowRight className="text-xs" />
                                            <span className="hidden sm:inline">Click to explore</span>
                                            <span className="sm:hidden">Explore</span>
                                        </span>
                                    </div>

                                    <div className={`lg:hidden absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                        <FaHandPointer className="text-sm" />
                                    </div>
                                </div>

                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 lg:h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500'
                                        : 'bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-700'}`}>
                                </div>

                                <div className={`lg:hidden absolute top-0 left-0 right-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left delay-100
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <div className={`mb-4 transition-colors duration-300
                                ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                <FaTags className="text-4xl" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300
                                ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                No Categories Available
                            </h3>
                            <p className={`transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Categories will be added soon!
                            </p>
                        </div>
                    )}
                </div>

                {categories.length > 0 && (
                    <div className='flex justify-center mt-8 lg:mt-10'>
                        <Link to={'/category'}
                            className={`w-full sm:w-1/2 md:w-1/3 lg:w-[15%] py-3 px-4 text-center border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 focus:ring-cyan-500 focus:ring-offset-black'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900 focus:ring-cyan-700 focus:ring-offset-white'}`}
                        >
                            <FaList className="inline mr-2" /> View All Categories
                        </Link>
                    </div>
                )}
            </section>

            {/* Features Section */}
            <section className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-30 relative overflow-hidden transition-colors duration-300
                ${isDarkMode
                    ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900'
                    : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>

                <div className={`absolute top-10 left-10 w-20 h-20 rounded-full blur-xl transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-r from-cyan-900/20 to-cyan-700/20'
                        : 'bg-gradient-to-r from-cyan-200/40 to-cyan-100/40'}`}>
                </div>
                <div className={`absolute bottom-10 right-10 w-32 h-32 rounded-full blur-2xl transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-r from-cyan-800/10 to-cyan-600/10'
                        : 'bg-gradient-to-r from-cyan-200/30 to-cyan-100/30'}`}>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-center mb-12 lg:mb-16'
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className={`w-[20px] h-[40px] rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                        </div>
                        <h2 className={`font-bold text-sm sm:text-base bg-gradient-to-r bg-clip-text text-transparent
                            ${isDarkMode
                                ? 'from-cyan-400 to-cyan-300'
                                : 'from-cyan-700 to-cyan-600'}`}>
                            Why Choose Us
                        </h2>
                    </div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Premium SportFlex Experience
                    </h1>
                    <p className={`text-base lg:text-lg max-w-2xl mx-auto transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        We're committed to providing exceptional service and support at every step of your fitness journey
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className='mt-12 lg:mt-16 text-center'
                >
                    <div className={`inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className='flex items-center gap-2'>
                            <FaShieldAlt className={`bg-gradient-to-r bg-clip-text text-transparent
                                ${isDarkMode
                                    ? 'from-cyan-400 to-cyan-300'
                                    : 'from-cyan-700 to-cyan-600'}`} />
                            <span>Secure Payment</span>
                        </div>
                        <div className={`hidden sm:block w-px h-4 transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-b from-cyan-700 to-cyan-500'
                                : 'bg-gradient-to-b from-cyan-400 to-cyan-300'}`}>
                        </div>
                        <div className='flex items-center gap-2'>
                            <FaUsers className={`bg-gradient-to-r bg-clip-text text-transparent
                                ${isDarkMode
                                    ? 'from-cyan-400 to-cyan-300'
                                    : 'from-cyan-700 to-cyan-600'}`} />
                            <span>10k+ Happy Customers</span>
                        </div>
                        <div className={`hidden sm:block w-px h-4 transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-b from-cyan-700 to-cyan-500'
                                : 'bg-gradient-to-b from-cyan-400 to-cyan-300'}`}>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaAward className={`bg-gradient-to-r bg-clip-text text-transparent
                                ${isDarkMode
                                    ? 'from-cyan-400 to-cyan-300'
                                    : 'from-cyan-700 to-cyan-600'}`} />
                            <span>Premium Quality</span>
                        </div>
                    </div>
                </motion.div>
            </section>
        </>
    );
}