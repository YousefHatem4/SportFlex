import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import {
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaBoxOpen,
    FaTimes,
    FaCartPlus,
    FaCheck,
    FaHeart,
    FaRegHeart,
    FaShoppingCart,
    FaSearch
} from 'react-icons/fa';

export default function Products() {
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [wishItems, setWishItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

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

    const getUrlParams = () => {
        const searchParams = new URLSearchParams(location.search);
        return {
            category: searchParams.get('category') || 'all',
            search: searchParams.get('search') || ''
        };
    };

    useEffect(() => {
        checkUser();
        fetchCategories();

        const params = getUrlParams();

        if (params.category !== 'all') {
            setSelectedCategory(params.category);
        }

        if (params.search) {
            setSearchQuery(params.search);
        }

        fetchProducts(params.category, params.search);

        document.title = 'Products - SportFlex Store';
        window.scrollTo(0, 0);
    }, [location]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
            fetchUserCart(session.user.id);
            fetchUserWishlist(session.user.id);
        }
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                    if (i < fullStars) {
                        return <FaStar key={i} className={`${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} text-xs`} />;
                    } else if (i === fullStars && hasHalfStar) {
                        return <FaStarHalfAlt key={i} className={`${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} text-xs`} />;
                    } else {
                        return <FaRegStar key={i} className={`${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} text-xs`} />;
                    }
                })}
            </div>
        );
    };

    const fetchProducts = async (categoryId = 'all', search = '') => {
        try {
            setLoading(true);

            const { data: viewData, error: viewError } = await supabase
                .from('products_with_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (!viewError && viewData) {
                let filteredData = viewData;

                if (categoryId !== 'all' && categoryId !== '') {
                    filteredData = filteredData.filter(product =>
                        product.category_id === categoryId
                    );
                }

                if (search) {
                    const searchLower = search.toLowerCase();
                    filteredData = filteredData.filter(product =>
                        product.title?.toLowerCase().includes(searchLower) ||
                        product.description?.toLowerCase().includes(searchLower)
                    );
                }

                const transformedData = filteredData.map(product => ({
                    ...product,
                    ratingsAverage: parseFloat(product.actual_rating) || 4.5,
                    feedbackCount: product.feedback_count || 0,
                    categories: product.category_id ? {
                        id: product.category_id,
                        name: product.category_name
                    } : null
                }));

                setProducts(transformedData);
                return;
            }

            let query = supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (categoryId !== 'all' && categoryId !== '') {
                query = query.eq('category_id', categoryId);
            }

            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

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

            const transformedProducts = (data || []).map(product => {
                const feedback = feedbackCounts[product.id] || { count: 0, totalRating: 0 };
                const avgRating = feedback.count > 0
                    ? feedback.totalRating / feedback.count
                    : 4.5;

                return {
                    ...product,
                    ratingsAverage: parseFloat(avgRating.toFixed(1)),
                    feedbackCount: feedback.count
                };
            });

            setProducts(transformedProducts);

        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
            setProducts([]);
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
                .order('name');

            if (error) throw error;

            setCategories(data || []);

        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            setCategories([]);
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
            setAddedItems(cartProductIds);
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
            setWishItems(wishlistProductIds);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            if (!user) {
                toast.error("You must sign in first to add to cart");
                navigate("/login");
                return;
            }

            const { data: existingItem, error: checkError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
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
                        user_id: user.id,
                        product_id: productId,
                        quantity: 1
                    });

                if (insertError) throw insertError;
                toast.success("Product added to cart!");
            }

            setAddedItems((prev) => [...prev, productId]);
            fetchUserCart(user.id);

        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        }
    };

    const handleWishlistAction = async (productId) => {
        try {
            if (!user) {
                toast.error("You must sign in first to manage wishlist");
                navigate("/login");
                return;
            }

            const { data: existingItem, error: checkError } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', user.id)
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

                setWishItems(wishItems.filter(id => id !== productId));
                toast.success("Product removed from wishlist!");
            } else {
                const { error: insertError } = await supabase
                    .from('wishlist_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId
                    });

                if (insertError) throw insertError;

                setWishItems([...wishItems, productId]);
                toast.success("Product added to wishlist!");
            }

            fetchUserWishlist(user.id);

        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error('Failed to update wishlist');
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);

        const params = new URLSearchParams(location.search);

        if (categoryId === 'all') {
            params.delete('category');
        } else {
            params.set('category', categoryId);
        }

        if (searchQuery) {
            params.set('search', searchQuery);
        }

        navigate(`/products?${params.toString()}`);
        fetchProducts(categoryId, searchQuery);
    };

    const handleSearch = (e) => {
        e.preventDefault();

        const params = new URLSearchParams(location.search);

        if (searchQuery) {
            params.set('search', searchQuery);
        } else {
            params.delete('search');
        }

        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory);
        }

        navigate(`/products?${params.toString()}`);
        fetchProducts(selectedCategory, searchQuery);
    };

    const handleClearFilters = () => {
        setSelectedCategory('all');
        setSearchQuery('');

        navigate('/products');
        fetchProducts('all', '');
    };

    const isInWishlist = (productId) => {
        return wishItems.includes(productId);
    };

    const isInCart = (productId) => {
        return addedItems.includes(productId);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4
                        ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}></div>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading products...</p>
                </div>
            </div>
        );
    }

    return <>
        <section className={`py-10 px-4 sm:px-6 lg:px-30 transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-white'}`}>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='px-2 mb-10 sm:px-0'
            >
                <div className='flex items-center justify-between flex-wrap gap-4 mb-6'>
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
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                                : 'bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-700'}`}>
                            {products.length} items
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors duration-300
                                    ${isDarkMode
                                        ? 'border-gray-700 focus:ring-cyan-500 bg-gray-900 text-white placeholder-gray-400'
                                        : 'border-gray-300 focus:ring-cyan-600 bg-white text-gray-900 placeholder-gray-500'}`}
                            />
                            <button
                                type="submit"
                                className={`px-4 py-2 text-white rounded-lg transition-all duration-300 text-sm flex items-center gap-2
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                            >
                                <FaSearch />
                                Search
                            </button>
                        </form>

                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors duration-300
                                ${isDarkMode
                                    ? 'border-gray-700 focus:ring-cyan-500 bg-gray-900 text-white'
                                    : 'border-gray-300 focus:ring-cyan-600 bg-white text-gray-900'}`}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>

                        {(selectedCategory !== 'all' || searchQuery) && (
                            <button
                                onClick={handleClearFilters}
                                className={`px-4 py-2 text-white rounded-lg transition-all duration-300 text-sm
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900'
                                        : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'}`}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {(selectedCategory !== 'all' || searchQuery) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 flex flex-wrap gap-2 items-center"
                    >
                        <span className={`text-sm transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Active filters:
                        </span>
                        {selectedCategory !== 'all' && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-cyan-900/50 text-cyan-400'
                                    : 'bg-cyan-100 text-cyan-700'}`}>
                                Category: {categories.find(c => c.id === selectedCategory)?.name || 'Selected'}
                                <button
                                    onClick={() => handleCategoryChange('all')}
                                    className={`ml-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-cyan-800/50 text-cyan-400'
                                    : 'bg-cyan-100 text-cyan-700'}`}>
                                Search: "{searchQuery}"
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        handleSearch({ preventDefault: () => { } });
                                    }}
                                    className={`ml-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </motion.div>
                )}
            </motion.div>

            {products.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-16"
                >
                    <div className={`w-24 h-24 mx-auto mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <FaBoxOpen className="text-8xl" />
                    </div>
                    <h3 className={`text-2xl font-semibold mb-2 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        No Products Found
                    </h3>
                    <p className={`mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchQuery
                            ? `No products found for "${searchQuery}"`
                            : selectedCategory !== 'all'
                                ? `No products found in this category`
                                : 'No products available yet.'
                        }
                    </p>
                    <button
                        onClick={handleClearFilters}
                        className={`inline-flex items-center px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                    >
                        View All Products
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
                >
                    {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
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
                                                {product.categories?.name || product.category_name || 'Uncategorized'}
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
                                                    ({product.feedbackCount || 0})
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
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
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
                                        </motion.button>

                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
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
                                        </motion.button>
                                    </div>
                                </div>

                                <div className={`lg:hidden absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500'
                                        : 'bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-700'}`}>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    </>
}