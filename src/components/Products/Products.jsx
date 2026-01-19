// Products.jsx - COMPLETE SOLUTION WITH URL PARAMETER INTEGRATION
import React, { useEffect, useState } from 'react'
import style from './Products.module.css'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';

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

    // Function to parse URL parameters
    const getUrlParams = () => {
        const searchParams = new URLSearchParams(location.search);
        return {
            category: searchParams.get('category') || 'all',
            search: searchParams.get('search') || ''
        };
    };

    // Check user session and fetch data
    useEffect(() => {
        checkUser();
        fetchCategories();

        // Get parameters from URL
        const params = getUrlParams();

        // Set state from URL parameters
        if (params.category !== 'all') {
            setSelectedCategory(params.category);
        }

        if (params.search) {
            setSearchQuery(params.search);
        }

        // Fetch products with URL parameters
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

    // Fetch products from database with optional filters and feedback counts
    const fetchProducts = async (categoryId = 'all', search = '') => {
        try {
            setLoading(true);

            // Try to fetch from the view first
            const { data: viewData, error: viewError } = await supabase
                .from('products_with_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (!viewError && viewData) {
                let filteredData = viewData;

                // Filter by category if selected
                if (categoryId !== 'all' && categoryId !== '') {
                    filteredData = filteredData.filter(product =>
                        product.category_id === categoryId
                    );
                }

                // Filter by search query
                if (search) {
                    const searchLower = search.toLowerCase();
                    filteredData = filteredData.filter(product =>
                        product.title?.toLowerCase().includes(searchLower) ||
                        product.description?.toLowerCase().includes(searchLower)
                    );
                }

                console.log('Products with feedback fetched from view:', filteredData?.length);

                // Transform the data to include proper ratings and feedback counts
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

            // Fallback to original query if view doesn't exist
            console.log('View not found, using original query:', viewError);
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

            // Filter by category if selected
            if (categoryId !== 'all' && categoryId !== '') {
                query = query.eq('category_id', categoryId);
            }

            // Filter by search query
            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            const { data, error } = await query;

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

            // Transform products with feedback data
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

            console.log('Products fetched with feedback:', transformedProducts.length);
            setProducts(transformedProducts);

        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
            setProducts([]);
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
                .order('name');

            if (error) throw error;

            console.log('Categories fetched:', data?.length);
            setCategories(data || []);

        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            setCategories([]);
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

    // Fetch user's wishlist items
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

    const handleWishlistAction = async (productId) => {
        try {
            if (!user) {
                toast.error("You must sign in first to manage wishlist");
                navigate("/login");
                return;
            }

            // Check if product is already in wishlist
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
                // Remove from wishlist
                const { error: deleteError } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('id', existingItem.id);

                if (deleteError) throw deleteError;

                setWishItems(wishItems.filter(id => id !== productId));
                toast.success("Product removed from wishlist!");
            } else {
                // Add to wishlist
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

            // Refresh wishlist
            fetchUserWishlist(user.id);

        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error('Failed to update wishlist');
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);

        // Update URL with category parameter
        const params = new URLSearchParams(location.search);

        if (categoryId === 'all') {
            params.delete('category');
        } else {
            params.set('category', categoryId);
        }

        // Preserve search query if exists
        if (searchQuery) {
            params.set('search', searchQuery);
        }

        navigate(`/products?${params.toString()}`);
        fetchProducts(categoryId, searchQuery);
    };

    const handleSearch = (e) => {
        e.preventDefault();

        // Update URL with search parameter
        const params = new URLSearchParams(location.search);

        if (searchQuery) {
            params.set('search', searchQuery);
        } else {
            params.delete('search');
        }

        // Preserve category if exists
        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory);
        }

        navigate(`/products?${params.toString()}`);
        fetchProducts(selectedCategory, searchQuery);
    };

    const handleClearFilters = () => {
        setSelectedCategory('all');
        setSearchQuery('');

        // Clear all URL parameters
        navigate('/products');
        fetchProducts('all', '');
    };

    // Check if product is in wishlist
    const isInWishlist = (productId) => {
        return wishItems.includes(productId);
    };

    // Check if product is in cart
    const isInCart = (productId) => {
        return addedItems.includes(productId);
    };

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

    return <>
        {/* Products section */}
        <section className='my-10 px-4 sm:px-6 lg:px-30'>
            {/* title */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='px-2 mb-10 sm:px-0'
            >
                <div className='flex items-center justify-between flex-wrap gap-4 mb-6'>
                    <div className='flex items-center gap-5'>
                        <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                        <h1 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>Our Products</h1>
                        <span className="bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {products.length} items
                        </span>
                    </div>

                    {/* Filter and Search Controls */}
                    <div className="flex flex-wrap gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300 text-sm"
                            >
                                Search
                            </button>
                        </form>

                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>

                        {(selectedCategory !== 'all' || searchQuery) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 text-sm"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filters Display */}
                {(selectedCategory !== 'all' || searchQuery) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 flex flex-wrap gap-2 items-center"
                    >
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {selectedCategory !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Category: {categories.find(c => c.id === selectedCategory)?.name || 'Selected'}
                                <button
                                    onClick={() => handleCategoryChange('all')}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                Search: "{searchQuery}"
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        handleSearch({ preventDefault: () => { } });
                                    }}
                                    className="ml-2 text-teal-600 hover:text-teal-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </motion.div>
                )}
            </motion.div>

            {/* Products Grid */}
            {products.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-16"
                >
                    <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                        <i className="fas fa-box-open text-8xl"></i>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Products Found</h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery
                            ? `No products found for "${searchQuery}"`
                            : selectedCategory !== 'all'
                                ? `No products found in this category`
                                : 'No products available yet.'
                        }
                    </p>
                    <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition-colors duration-300"
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
                            {/* Enhanced Product Card matching home.jsx design */}
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

                                            {/* Stock Badge */}
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
                                            <i className={`fa-solid fa-heart text-sm ${isInWishlist(product.id) ? 'text-rose-500' : 'text-gray-400'}`}></i>
                                        </button>
                                    </div>

                                    {/* Product Info - Enhanced for Mobile */}
                                    <div className="p-3 sm:p-4 space-y-2">
                                        {/* Category Badge - Mobile Optimized */}
                                        <div className="flex items-center justify-between">
                                            <span className="inline-block text-xs font-medium text-gray-400 uppercase tracking-wide truncate max-w-[70%]">
                                                {product.categories?.name || product.category_name || 'Uncategorized'}
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

                                            {/* Desktop-only Rating with feedback count */}
                                            <div className="hidden lg:flex items-center">
                                                <div className="flex items-center text-amber-500 text-sm">
                                                    {renderStars(product.ratingsAverage || 4.5)}
                                                    <span className="font-medium ml-1">{(product.ratingsAverage || 4.5).toFixed(1)}</span>
                                                </div>
                                                <span className="text-gray-400 text-xs ml-1">
                                                    ({product.feedbackCount || 0})
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
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
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
                                                        <i className="fas fa-check text-sm"></i>
                                                        <span className="hidden sm:inline">Added</span>
                                                        <span className="sm:hidden">In Cart</span>
                                                    </>
                                                ) : product.stock <= 0 ? (
                                                    <>
                                                        <i className="fas fa-times text-sm"></i>
                                                        <span className="hidden sm:inline">Out of Stock</span>
                                                        <span className="sm:hidden">Sold Out</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-cart-plus text-sm"></i>
                                                        <span className="hidden sm:inline">Add to Cart</span>
                                                        <span className="sm:hidden">Add</span>
                                                    </>
                                                )}
                                            </div>
                                        </motion.button>

                                        {/* Desktop-only Wishlist Button */}
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
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
                                            <i className={`fa-solid fa-heart text-lg transition-all duration-300 ${isInWishlist(product.id)
                                                ? "text-rose-500 animate-pulse"
                                                : "text-gray-500 hover:text-rose-500"
                                                }`}></i>
                                        </motion.button>
                                    </div>

                                 
                                </div>

                                {/* Decorative Bottom Accent - Mobile Only */}
                                <div className="lg:hidden absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    </>
}