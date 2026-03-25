// Wishlist.jsx - Optimized version with improved performance and accessibility
import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from "framer-motion";
import { supabase } from '../../supabaseClient';
import {
    FaHeart,
    FaRegHeart,
    FaStar,
    FaShoppingCart,
    FaTrash,
    FaSpinner,
    FaArrowLeft
} from 'react-icons/fa';

// Constants
const STOCK_THRESHOLD = 5;
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
const DEFAULT_RATING = 4.5;

// Memoized product card component to prevent unnecessary re-renders
const ProductCard = memo(({ item, isInCart, isMobile, isDarkMode, onAddToCart, onRemoveFromWishlist }) => {
    const isOutOfStock = item.product.stock <= 0;
    const isItemInCart = isInCart(item.product.id);

    return (
        <div className={`cursor-pointer p-3 sm:p-4 rounded-xl lg:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full border
            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>

            <Link to={`/productdetails/${item.product.id}`}>
                <div className="overflow-hidden rounded-lg lg:rounded-xl relative">
                    <img
                        src={item.product.image_url || DEFAULT_IMAGE}
                        alt={item.product.title}
                        className="w-full h-40 xs:h-44 sm:h-48 md:h-52 lg:h-56 object-cover hover:scale-110 transition-transform duration-500 ease-in-out"
                        loading="lazy"
                        onError={(e) => {
                            e.target.src = DEFAULT_IMAGE;
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {item.product.stock <= STOCK_THRESHOLD && item.product.stock > 0 && (
                        <span className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-full
                            ${isDarkMode ? 'bg-red-700' : 'bg-red-600'}`}>
                            Low Stock
                        </span>
                    )}
                </div>

                <div className="mt-3 sm:mt-4 space-y-1.5">
                    <span className={`inline-block text-[10px] xs:text-xs font-medium uppercase tracking-widest truncate max-w-full
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.product.category}
                    </span>
                    <h3 className={`text-sm sm:text-base font-semibold leading-tight sm:leading-snug line-clamp-2 min-h-[2.5rem] transition-all duration-300
                        ${isDarkMode
                            ? 'text-white hover:bg-gradient-to-r hover:from-cyan-400 hover:to-cyan-300 hover:bg-clip-text hover:text-transparent'
                            : 'text-gray-900 hover:bg-gradient-to-r hover:from-cyan-700 hover:to-cyan-600 hover:bg-clip-text hover:text-transparent'}`}>
                        {item.product.title}
                    </h3>

                    <div className="flex justify-between items-center mt-2">
                        <div className="flex flex-col">
                            <span className={`font-bold text-sm sm:text-base
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                EGP {item.product.price.toFixed(2)}
                            </span>
                            {isMobile && (
                                <span className={`text-[10px] mt-0.5
                                    ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                                    Stock: {item.product.stock}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center text-xs sm:text-sm">
                            <FaStar className={`mr-1 text-xs sm:text-sm ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                            <span className={`font-medium ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                {item.product.ratingsAverage.toFixed(1)}
                            </span>
                            {item.product.totalReviews > 0 && (
                                <span className={`text-[10px] ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                                    ({item.product.totalReviews})
                                </span>
                            )}
                        </div>
                    </div>
                    {!isMobile && (
                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Stock: {item.product.stock}
                            {item.product.totalReviews > 0 && (
                                <span className="ml-2">
                                    • {item.product.totalReviews} review{item.product.totalReviews !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Link>

            <div className="mt-4 sm:mt-5 flex justify-between items-center gap-2 sm:gap-3">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAddToCart(item.product.id)}
                    disabled={isItemInCart || isOutOfStock}
                    className={`cursor-pointer flex-1 py-2.5 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow 
                        ${isItemInCart
                            ? isDarkMode
                                ? "bg-gray-700 text-gray-300 cursor-not-allowed shadow-none"
                                : "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none"
                            : isOutOfStock
                                ? isDarkMode
                                    ? "bg-red-900/30 text-red-400 cursor-not-allowed"
                                    : "bg-red-100 text-red-600 cursor-not-allowed"
                                : isDarkMode
                                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 hover:shadow-md"
                                    : "bg-gradient-to-r from-cyan-700 to-cyan-800 text-white hover:from-cyan-800 hover:to-cyan-900 hover:shadow-md"}`}
                    aria-label={isItemInCart ? "Item already in cart" : isOutOfStock ? "Out of stock" : "Add to cart"}
                >
                    {isItemInCart ? "Added" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => onRemoveFromWishlist(item.id, item.product.id)}
                    className={`cursor-pointer p-2 sm:p-2.5 rounded-full border hover:scale-110 transition-colors duration-300 shadow-sm hover:shadow-md flex-shrink-0
                        ${isDarkMode
                            ? 'border-cyan-500 bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 text-cyan-400'
                            : 'border-cyan-600 bg-gradient-to-r from-cyan-200/60 to-cyan-100/60 text-cyan-700'}`}
                    aria-label="Remove from wishlist"
                >
                    <FaHeart className="text-sm sm:text-lg" />
                </motion.button>
            </div>
        </div>
    );
});

export default function Wishlist() {
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    // Memoized values
    const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems]);

    // Theme change listener
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

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Check user on mount
    useEffect(() => {
        checkUser();
    }, []);

    // Set document title
    useEffect(() => {
        document.title = 'Wishlist - SportFlex Store';
        window.scrollTo(0, 0);
    }, []);

    const checkUser = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
            fetchWishlistItems(session.user.id);
            fetchUserCart(session.user.id);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProductReviews = useCallback(async (product) => {
        try {
            const { data: statsData, error: statsError } = await supabase
                .from('product_feedback_stats')
                .select('average_rating, total_reviews')
                .eq('product_id', product.id)
                .single();

            if (!statsError && statsData) {
                return {
                    ratingsAverage: parseFloat(statsData.average_rating) || product.ratingsAverage || DEFAULT_RATING,
                    totalReviews: statsData.total_reviews || 0
                };
            }

            const { data: feedbackData, error: feedbackError } = await supabase
                .from('product_feedback')
                .select('rating')
                .eq('product_id', product.id);

            if (!feedbackError && feedbackData && feedbackData.length > 0) {
                const sum = feedbackData.reduce((acc, curr) => acc + curr.rating, 0);
                return {
                    ratingsAverage: sum / feedbackData.length,
                    totalReviews: feedbackData.length
                };
            }

            return {
                ratingsAverage: product.ratingsAverage || DEFAULT_RATING,
                totalReviews: 0
            };
        } catch (error) {
            console.error('Error fetching reviews for product:', product.id, error);
            return {
                ratingsAverage: product.ratingsAverage || DEFAULT_RATING,
                totalReviews: 0
            };
        }
    }, []);

    const fetchWishlistItems = useCallback(async (userId) => {
        try {
            setLoading(true);

            const { data: wishlistData, error: wishlistError } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (wishlistError) throw wishlistError;

            if (!wishlistData || wishlistData.length === 0) {
                setWishlistItems([]);
                setLoading(false);
                return;
            }

            const productIds = wishlistData.map(item => item.product_id);

            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories(name)
                `)
                .in('id', productIds);

            if (productsError) throw productsError;

            const productsWithReviews = await Promise.all(
                productsData.map(async (product) => {
                    const reviewData = await fetchProductReviews(product);
                    return {
                        ...product,
                        ratingsAverage: reviewData.ratingsAverage,
                        totalReviews: reviewData.totalReviews
                    };
                })
            );

            const formattedItems = wishlistData
                .map(wishlistItem => {
                    const product = productsWithReviews.find(p => p.id === wishlistItem.product_id);
                    if (!product) return null;

                    return {
                        id: wishlistItem.id,
                        product: {
                            id: product.id,
                            title: product.title,
                            description: product.description,
                            price: parseFloat(product.price),
                            image_url: product.image_url,
                            category: product.categories?.name || product.category || 'Uncategorized',
                            stock: product.stock,
                            ratingsAverage: product.ratingsAverage,
                            totalReviews: product.totalReviews
                        },
                        created_at: wishlistItem.created_at
                    };
                })
                .filter(item => item !== null);

            setWishlistItems(formattedItems);
        } catch (error) {
            console.error('Error fetching wishlist items:', error);
            toast.error('Failed to load wishlist items');
            await fetchWishlistItemsAlternative(userId);
        } finally {
            setLoading(false);
        }
    }, [fetchProductReviews]);

    const fetchWishlistItemsAlternative = useCallback(async (userId) => {
        try {
            setLoading(true);

            const { data: wishlistData, error } = await supabase
                .from('wishlist_items')
                .select(`
                    *,
                    products!inner(
                        *,
                        categories(name)
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!wishlistData || wishlistData.length === 0) {
                setWishlistItems([]);
                return;
            }

            const productsWithReviews = await Promise.all(
                wishlistData.map(async (item) => {
                    const product = item.products;
                    const reviewData = await fetchProductReviews(product);

                    return {
                        id: item.id,
                        product: {
                            id: product.id,
                            title: product.title,
                            description: product.description,
                            price: parseFloat(product.price),
                            image_url: product.image_url,
                            category: product.categories?.name || product.category || 'Uncategorized',
                            stock: product.stock,
                            ratingsAverage: reviewData.ratingsAverage,
                            totalReviews: reviewData.totalReviews
                        },
                        created_at: item.created_at
                    };
                })
            );

            setWishlistItems(productsWithReviews.filter(item => item !== null));
        } catch (error) {
            console.error('Alternative method error:', error);
            toast.error('Failed to load wishlist items');
            setWishlistItems([]);
        } finally {
            setLoading(false);
        }
    }, [fetchProductReviews]);

    const fetchUserCart = useCallback(async (userId) => {
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
    }, []);

    const handleAddToCart = useCallback(async (productId) => {
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

            if (checkError && checkError.code !== 'PGRST116') throw checkError;

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

            setAddedItems(prev => [...prev, productId]);
            fetchUserCart(user.id);
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        }
    }, [user, navigate, fetchUserCart]);

    const handleRemoveFromWishlist = useCallback(async (wishlistItemId, productId) => {
        try {
            if (!user) {
                toast.error("You must sign in to manage wishlist");
                navigate("/login");
                return;
            }

            const { error } = await supabase
                .from('wishlist_items')
                .delete()
                .eq('id', wishlistItemId)
                .eq('user_id', user.id);

            if (error) throw error;

            setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));
            toast.success("Product removed from wishlist!");
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Failed to remove from wishlist');
        }
    }, [user, navigate]);

    const moveAllToCart = useCallback(async () => {
        try {
            if (!user) {
                toast.error("You must sign in to add items to cart");
                navigate("/login");
                return;
            }

            if (wishlistItems.length === 0) {
                toast.info("Your wishlist is empty");
                return;
            }

            const toastId = toast.loading(`Adding ${wishlistItems.length} items to cart...`);

            for (const item of wishlistItems) {
                const { data: existingItem } = await supabase
                    .from('cart_items')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('product_id', item.product.id)
                    .single();

                if (existingItem) {
                    await supabase
                        .from('cart_items')
                        .update({ quantity: existingItem.quantity + 1 })
                        .eq('id', existingItem.id);
                } else {
                    await supabase
                        .from('cart_items')
                        .insert({
                            user_id: user.id,
                            product_id: item.product.id,
                            quantity: 1
                        });
                }

                await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('id', item.id)
                    .eq('user_id', user.id);
            }

            toast.success(`Added ${wishlistItems.length} items to cart!`, { id: toastId });
            setWishlistItems([]);
            fetchUserCart(user.id);
        } catch (error) {
            console.error('Error moving items to cart:', error);
            toast.error('Failed to move items to cart');
        }
    }, [user, wishlistItems, navigate, fetchUserCart]);

    const clearWishlist = useCallback(async () => {
        try {
            if (!user) {
                toast.error("You must sign in to clear wishlist");
                navigate("/login");
                return;
            }

            if (wishlistItems.length === 0) {
                toast.info("Your wishlist is already empty");
                return;
            }

            if (!window.confirm('Are you sure you want to clear your entire wishlist?')) {
                return;
            }

            const { error } = await supabase
                .from('wishlist_items')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            setWishlistItems([]);
            toast.success("Wishlist cleared successfully");
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            toast.error('Failed to clear wishlist');
        }
    }, [user, wishlistItems.length, navigate]);

    const isInCart = useCallback((productId) => {
        return addedItems.includes(productId);
    }, [addedItems]);

    if (!user) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center max-w-md w-full">
                    <div className={`mb-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <FaHeart className="text-5xl sm:text-6xl mx-auto" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Please Sign In
                    </h3>
                    <p className={`mb-6 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        You need to be signed in to view your wishlist
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className={`px-6 py-3 text-white font-medium rounded-lg transition text-sm sm:text-base
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                            aria-label="Sign in to your account"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className={`px-6 py-3 border font-medium rounded-lg transition text-sm sm:text-base flex items-center justify-center gap-2
                                ${isDarkMode
                                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            aria-label="Go back to home page"
                        >
                            <FaArrowLeft className="text-xs" aria-hidden="true" />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4
                        ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}></div>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading wishlist...</p>
                </div>
            </div>
        );
    }

    return (
        <section className={`py-6 sm:py-8 lg:py-10 px-3 sm:px-4 md:px-6 lg:px-30 transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-white'}`}>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='px-2 mb-6 sm:mb-8 md:mb-10 sm:px-0'
            >
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                    <div className='flex items-center gap-3 sm:gap-4'>
                        <div className={`w-3 sm:w-[20px] h-6 sm:h-[40px] rounded-lg shadow-md
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                        </div>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
                            <h1 className={`font-extrabold text-base sm:text-lg md:text-xl tracking-wide bg-gradient-to-r bg-clip-text text-transparent
                                ${isDarkMode
                                    ? 'from-cyan-400 to-cyan-300'
                                    : 'from-cyan-700 to-cyan-600'}`}>
                                My Wishlist
                            </h1>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full self-start
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                                    : 'bg-gradient-to-r from-cyan-200/60 to-cyan-100/60 text-cyan-800'}`}>
                                {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    </div>

                    {wishlistCount > 0 && (
                        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <button
                                onClick={moveAllToCart}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition w-full sm:w-auto
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                aria-label="Add all items to cart"
                            >
                                <FaShoppingCart className="text-sm" aria-hidden="true" />
                                <span className="whitespace-nowrap">Add All to Cart</span>
                            </button>
                            <button
                                onClick={clearWishlist}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition w-full sm:w-auto
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900'
                                        : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'}`}
                                aria-label="Clear all items from wishlist"
                            >
                                <FaTrash className="text-sm" aria-hidden="true" />
                                <span className="whitespace-nowrap">Clear All</span>
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } }
                }}
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            >
                {wishlistCount > 0 ? (
                    wishlistItems.map((item) => (
                        <motion.div
                            key={item.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                            whileHover={{ scale: isMobile ? 1 : 1.03 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            <ProductCard
                                item={item}
                                isInCart={isInCart}
                                isMobile={isMobile}
                                isDarkMode={isDarkMode}
                                onAddToCart={handleAddToCart}
                                onRemoveFromWishlist={handleRemoveFromWishlist}
                            />
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full text-center py-10 sm:py-16 px-4"
                    >
                        <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6
                            ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            <FaRegHeart className="text-6xl sm:text-8xl" aria-hidden="true" />
                        </div>
                        <h3 className={`text-lg sm:text-xl md:text-2xl font-semibold mb-2
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Your wishlist is empty
                        </h3>
                        <p className={`mb-6 text-sm sm:text-base max-w-md mx-auto
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Start adding your favorite SportFlex items to your wishlist!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/products"
                                className={`inline-flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300 text-sm sm:text-base
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                aria-label="Browse products"
                            >
                                Browse Products
                            </Link>
                            <button
                                onClick={() => navigate('/')}
                                className={`inline-flex items-center justify-center px-6 py-3 border font-medium rounded-lg transition text-sm sm:text-base
                                    ${isDarkMode
                                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                aria-label="Go to home page"
                            >
                                Go to Homepage
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {isMobile && wishlistCount === 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-4 z-10">
                    <Link
                        to="/products"
                        className={`block w-full py-3 text-white font-medium rounded-lg text-center shadow-lg
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                        aria-label="Browse products"
                    >
                        Browse Products
                    </Link>
                </div>
            )}
        </section>
    );
}