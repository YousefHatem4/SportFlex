// Wishlist.jsx - RESPONSIVE VERSION WITH REAL REVIEW DATA
import React, { useEffect, useState } from 'react'
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

export default function Wishlist() {
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Check user session
    useEffect(() => {
        checkUser();

        // Check screen size for responsive adjustments
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
            fetchWishlistItems(session.user.id);
            fetchUserCart(session.user.id);
        } else {
            setLoading(false);
        }
    };

    // Enhanced function to fetch wishlist items with real review data
    const fetchWishlistItems = async (userId) => {
        try {
            setLoading(true);

            // First get wishlist items
            const { data: wishlistData, error: wishlistError } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (wishlistError) throw wishlistError;

            if (!wishlistData || wishlistData.length === 0) {
                setWishlistItems([]);
                return;
            }

            // Get product IDs from wishlist
            const productIds = wishlistData.map(item => item.product_id);

            // Fetch products details
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories(name)
                `)
                .in('id', productIds);

            if (productsError) throw productsError;

            // Fetch real review data for all products
            const productsWithReviews = await Promise.all(
                productsData.map(async (product) => {
                    try {
                        // Get feedback statistics from product_feedback_stats table
                        const { data: statsData, error: statsError } = await supabase
                            .from('product_feedback_stats')
                            .select('*')
                            .eq('product_id', product.id)
                            .single();

                        if (statsError && statsError.code !== 'PGRST116') {
                            console.warn('No feedback stats for product:', product.id, statsError);
                        }

                        // If no stats found, calculate manually from feedback table
                        let averageRating = product.ratingsAverage || 4.5;
                        let totalReviews = 0;

                        if (statsData) {
                            averageRating = parseFloat(statsData.average_rating) || 0;
                            totalReviews = statsData.total_reviews || 0;
                        } else {
                            // Fallback: calculate from product_feedback table
                            const { data: feedbackData, error: feedbackError } = await supabase
                                .from('product_feedback')
                                .select('rating')
                                .eq('product_id', product.id);

                            if (!feedbackError && feedbackData && feedbackData.length > 0) {
                                const sum = feedbackData.reduce((acc, curr) => acc + curr.rating, 0);
                                averageRating = sum / feedbackData.length;
                                totalReviews = feedbackData.length;
                            }
                        }

                        return {
                            ...product,
                            ratingsAverage: averageRating,
                            totalReviews: totalReviews
                        };
                    } catch (error) {
                        console.error('Error fetching reviews for product:', product.id, error);
                        return {
                            ...product,
                            ratingsAverage: product.ratingsAverage || 4.5,
                            totalReviews: 0
                        };
                    }
                })
            );

            // Combine data
            const formattedItems = wishlistData.map(wishlistItem => {
                const product = productsWithReviews.find(p => p.id === wishlistItem.product_id);

                if (!product) {
                    return null;
                }

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
            }).filter(item => item !== null); // Remove null items

            setWishlistItems(formattedItems);
        } catch (error) {
            console.error('Error fetching wishlist items:', error);
            toast.error('Failed to load wishlist items');

            // Try alternative method
            await fetchWishlistItemsAlternative(userId);
        } finally {
            setLoading(false);
        }
    };

    // Alternative method with integrated review data
    const fetchWishlistItemsAlternative = async (userId) => {
        try {
            setLoading(true);

            // First fetch wishlist items with product details
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

            // Fetch review data for all products in wishlist
            const productsWithReviews = await Promise.all(
                wishlistData.map(async (item) => {
                    const product = item.products;

                    try {
                        // Get feedback statistics
                        const { data: statsData, error: statsError } = await supabase
                            .from('product_feedback_stats')
                            .select('average_rating, total_reviews')
                            .eq('product_id', product.id)
                            .single();

                        let averageRating = product.ratingsAverage || 4.5;
                        let totalReviews = 0;

                        if (!statsError && statsData) {
                            averageRating = parseFloat(statsData.average_rating) || averageRating;
                            totalReviews = statsData.total_reviews || 0;
                        }

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
                                ratingsAverage: averageRating,
                                totalReviews: totalReviews
                            },
                            created_at: item.created_at
                        };
                    } catch (error) {
                        console.error('Error fetching reviews in alternative method:', error);
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
                                ratingsAverage: product.ratingsAverage || 4.5,
                                totalReviews: 0
                            },
                            created_at: item.created_at
                        };
                    }
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
            setAddedItems(cartProductIds);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            if (!user) {
                toast.error("You must sign in first to add to cart");
                navigate("/login");
                return;
            }

            // Check if product is already in cart
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
                        user_id: user.id,
                        product_id: productId,
                        quantity: 1
                    });

                if (insertError) throw insertError;
                toast.success("Product added to cart!");
            }

            // Update local state
            setAddedItems((prev) => [...prev, productId]);

            // Refresh cart count
            fetchUserCart(user.id);

        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        }
    };

    const handleRemoveFromWishlist = async (wishlistItemId, productId) => {
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

            // Update local state
            setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));
            toast.success("Product removed from wishlist!");

        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Failed to remove from wishlist');
        }
    };

    const moveAllToCart = async () => {
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

            // Add each item to cart
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

                // Remove from wishlist
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
    };

    const clearWishlist = async () => {
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
    };

    // Check if product is in cart
    const isInCart = (productId) => {
        return addedItems.includes(productId);
    };

    useEffect(() => {
        document.title = 'Wishlist - SportFlex Store';
        window.scrollTo(0, 0);
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full">
                    <div className="text-gray-400 mb-6">
                        <FaHeart className="text-5xl sm:text-6xl mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Please Sign In</h3>
                    <p className="text-gray-500 mb-6 px-4">You need to be signed in to view your wishlist</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition text-sm sm:text-base"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm sm:text-base flex items-center justify-center gap-2"
                        >
                            <FaArrowLeft className="text-xs" />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading wishlist...</p>
                </div>
            </div>
        );
    }

    return <>
        {/* Products section */}
        <section className='my-6 sm:my-8 lg:my-10 px-3 sm:px-4 md:px-6 lg:px-30'>


            {/* title */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='px-2 mb-6 sm:mb-8 md:mb-10 sm:px-0'
            >
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                    <div className='flex items-center gap-3 sm:gap-4'>
                        <div className='bg-gradient-to-r from-pink-500 to-rose-400 w-3 sm:w-[20px] h-6 sm:h-[40px] rounded-lg shadow-md'></div>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
                            <h1 className='bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent font-extrabold text-base sm:text-lg md:text-xl tracking-wide'>
                                My Wishlist
                            </h1>
                            <span className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-medium px-2.5 py-1 rounded-full self-start">
                                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    </div>

                    {wishlistItems.length > 0 && (
                        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <button
                                onClick={moveAllToCart}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition w-full sm:w-auto"
                            >
                                <FaShoppingCart className="text-sm" />
                                <span className="whitespace-nowrap">Add All to Cart</span>
                            </button>
                            <button
                                onClick={clearWishlist}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-medium rounded-lg hover:from-gray-600 hover:to-gray-700 transition w-full sm:w-auto"
                            >
                                <FaTrash className="text-sm" />
                                <span className="whitespace-nowrap">Clear All</span>
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Products Grid - Responsive changes */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } }
                }}
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            >
                {wishlistItems.length > 0 ? (
                    wishlistItems.map((item) => (
                        <motion.div
                            key={item.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                            whileHover={{ scale: isMobile ? 1 : 1.03 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            {/* card */}
                            <div className='cursor-pointer product bg-white p-3 sm:p-4 rounded-xl lg:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full border border-gray-100'>
                                {/* Product Image */}
                                <Link to={`/productdetails/${item.product.id}`}>
                                    <div className="overflow-hidden rounded-lg lg:rounded-xl relative">
                                        <img
                                            src={item.product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'}
                                            alt={item.product.title}
                                            className="w-full h-40 xs:h-44 sm:h-48 md:h-52 lg:h-56 object-cover hover:scale-110 transition-transform duration-500 ease-in-out"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                            }}
                                        />
                                        {/* Subtle gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                                        {/* Mobile stock badge */}
                                        {item.product.stock <= 5 && item.product.stock > 0 && (
                                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                Low Stock
                                            </span>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="mt-3 sm:mt-4 space-y-1.5">
                                        <span className="inline-block text-[10px] xs:text-xs font-medium text-gray-400 uppercase tracking-widest truncate max-w-full">
                                            {item.product.category}
                                        </span>
                                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-tight sm:leading-snug line-clamp-2 min-h-[2.5rem] hover:bg-gradient-to-r hover:from-blue-600 hover:to-teal-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">
                                            {item.product.title}
                                        </h3>

                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-blue-600 font-bold text-sm sm:text-base">EGP {item.product.price.toFixed(2)}</span>
                                                {isMobile && (
                                                    <span className="text-[10px] text-gray-500 mt-0.5">
                                                        Stock: {item.product.stock}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center text-amber-500 text-xs sm:text-sm">
                                                <FaStar className="mr-1 text-xs sm:text-sm" />
                                                <span className="font-medium">{item.product.ratingsAverage.toFixed(1)}</span>
                                                {item.product.totalReviews > 0 && (
                                                    <span className="text-gray-500 text-[10px] ml-1">
                                                        ({item.product.totalReviews})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {!isMobile && (
                                            <div className="text-xs text-gray-500 mt-1">
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

                                {/* Action Buttons */}
                                <div className="mt-4 sm:mt-5 flex justify-between items-center gap-2 sm:gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAddToCart(item.product.id)}
                                        disabled={isInCart(item.product.id) || item.product.stock <= 0}
                                        className={`cursor-pointer flex-1 py-2.5 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow 
                                            ${isInCart(item.product.id)
                                                ? "bg-gray-400 text-white cursor-not-allowed shadow-none"
                                                : item.product.stock <= 0
                                                    ? "bg-red-100 text-red-600 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 hover:shadow-md"}`}
                                    >
                                        {isInCart(item.product.id)
                                            ? "Added"
                                            : item.product.stock <= 0
                                                ? "Out of Stock"
                                                : isMobile ? "Add to Cart" : "Add to Cart"}
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={() => handleRemoveFromWishlist(item.id, item.product.id)}
                                        className="cursor-pointer p-2 sm:p-2.5 rounded-full border border-rose-400 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-500 hover:scale-110 transition-colors duration-300 shadow-sm hover:shadow-md flex-shrink-0"
                                        aria-label="Remove from wishlist"
                                    >
                                        <FaHeart className="text-sm sm:text-lg" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full text-center py-10 sm:py-16 px-4"
                    >
                        <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 text-gray-300">
                            <FaRegHeart className="text-6xl sm:text-8xl" />
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto">
                            Start adding your favorite SportFlex items to your wishlist!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/products"
                                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition-colors duration-300 text-sm sm:text-base"
                            >
                                Browse Products
                            </Link>
                            <button
                                onClick={() => navigate('/')}
                                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                            >
                                Go to Homepage
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Mobile floating action button for empty wishlist */}
            {isMobile && wishlistItems.length === 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-4 z-10">
                    <Link
                        to="/products"
                        className="block w-full py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg text-center shadow-lg"
                    >
                        Browse Products
                    </Link>
                </div>
            )}
        </section>
    </>
}