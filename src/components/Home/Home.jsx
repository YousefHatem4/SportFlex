// Home.jsx
import React, { useEffect, useState } from 'react';
import style from './Home.module.css';
import HomeCategory from '../HomeCategory/HomeCategory';
import HomeSlider from '../HomeSlider/HomeSlider';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import Loading from '../Loading/Loading';
import { motion } from 'framer-motion';

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

    // Fetch products from database
    const fetchProducts = async () => {
        try {
            setLoading(true);
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

            console.log('Products fetched:', data?.length);
            return data || [];
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
            {/* Header Section */}
            <header className='flex flex-col lg:flex-row justify-center gap-6 lg:gap-0 px-5 lg:px-30 py-6 relative'>
                <div className='w-full text-center md:text-left lg:w-3/12 mb-2 lg:mb-0'>
                    <HomeCategory />
                </div>

                <div className='hidden lg:block bg-gradient-to-b from-blue-100 to-teal-100 h-85 w-0.5 me-15 absolute top-0 left-1/4'></div>

                <div className='w-full lg:w-9/12'>
                    <HomeSlider />
                </div>
            </header>



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

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                    {products.length > 0 ? (
                        products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className=''
                            >
                                {/* Product Card */}
                                <div className='cursor-pointer product bg-white p-3 sm:p-4 rounded-xl lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full border border-gray-100 hover:-translate-y-2'>
                                    {/* Product Image */}
                                    <Link to={`/productdetails/${product.id}`}>
                                        <div className="overflow-hidden rounded-lg lg:rounded-xl relative">
                                            <img
                                                src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'}
                                                alt={product.title}
                                                className="w-full h-40 sm:h-48 lg:h-52 object-cover hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                                }}
                                            />
                                            {/* Stock Badge */}
                                            {product.stock <= 10 && product.stock > 0 && (
                                                <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    Only {product.stock} left
                                                </div>
                                            )}
                                            {product.stock === 0 && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    Out of Stock
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="mt-3 sm:mt-4 space-y-1">
                                            <span className="inline-block text-xs font-medium text-gray-400 uppercase tracking-widest">
                                                {product.categories?.name || product.category || 'Uncategorized'}
                                            </span>
                                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-blue-600 transition-colors duration-300">
                                                {product.title}
                                            </h3>

                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-blue-600 font-bold text-xs sm:text-sm">EGP {parseFloat(product.price).toFixed(2)}</span>
                                                <div className="flex items-center text-amber-500 text-xs sm:text-sm">
                                                    <i className="fas fa-star mr-1"></i>
                                                    {product.ratingsAverage || 4.5}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Stock: {product.stock}
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Action Buttons */}
                                    <div className="mt-3 sm:mt-5 flex justify-between items-center gap-2 sm:gap-3">
                                        <button
                                            onClick={() => handleAddToCart(product.id)}
                                            disabled={isInCart(product.id) || product.stock <= 0}
                                            className={`cursor-pointer flex-1 py-1 sm:py-2 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium 
                                                    ${isInCart(product.id)
                                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                                    : product.stock <= 0
                                                        ? "bg-red-100 text-red-600 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 hover:shadow-lg"}`}
                                        >
                                            {isInCart(product.id)
                                                ? <><i className="fas fa-check mr-1"></i> Added</>
                                                : product.stock <= 0
                                                    ? <><i className="fas fa-times mr-1"></i> Out of Stock</>
                                                    : <><i className="fas fa-cart-plus mr-1"></i> Add to Cart</>}
                                        </button>

                                        <button
                                            onClick={() => handleWishlistAction(product.id)}
                                            className={`cursor-pointer p-1 sm:p-2 rounded-full border transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 ${isInWishlist(product.id)
                                                ? "bg-gradient-to-r from-pink-50 to-rose-50 border-rose-400 text-rose-500 focus:ring-rose-300"
                                                : "border-gray-300 text-gray-500 hover:text-rose-500 hover:border-rose-400 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 focus:ring-rose-300"
                                                }`}
                                            title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                        >
                                            <i className={`fa-solid fa-heart text-sm sm:text-lg transition-all duration-300 ${isInWishlist(product.id)
                                                ? "animate-pulse"
                                                : "hover:scale-110"
                                                }`}></i>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <i className="fas fa-box-open text-4xl"></i>
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
                            <i className="fas fa-eye mr-2"></i> View All Products
                        </Link>
                    </div>
                )}
            </section>

            {/* Category Section */}
            <section className='px-5 lg:px-30 py-16 bg-gradient-to-b from-blue-50/30 via-white to-gray-50/30'>
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='px-2 sm:px-0 mb-12'
                >
                    <div className='flex items-center gap-5 mb-4'>
                        <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                        <h1 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>Categories</h1>
                    </div>
                    <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-gray-800'>Browse SportFlex Categories</h1>
                    <p className='text-gray-600 text-base lg:text-lg'>Discover our premium SportFlex collections</p>
                </motion.div>

                {/* Categories Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
                    {categories.length > 0 ? (
                        categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className='group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-gray-100'
                            >
                                {/* Background gradient overlay */}
                                <div className='absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                                {/* Content container */}
                                <div className='relative p-6 lg:p-8 flex flex-col items-center text-center'>
                                    {/* Image container with modern styling */}
                                    <div className='relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 p-4 group-hover:from-blue-100 group-hover:to-teal-100 transition-all duration-300'>
                                        <img
                                            src={category.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                            className='w-16 h-16 lg:w-20 lg:h-20 object-cover object-center mx-auto group-hover:scale-110 transition-all duration-300'
                                            alt={category.name}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                            }}
                                        />
                                        {/* Decorative circle */}
                                        <div className='absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                                    </div>

                                    {/* Category name */}
                                    <h3 className='font-semibold text-lg lg:text-xl text-gray-800 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-teal-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300'>
                                        {category.name}
                                    </h3>

                                    {/* Subtle description */}
                                    <p className='text-sm text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 line-clamp-2'>
                                        {category.description || 'Explore collection'}
                                    </p>
                                </div>

                                {/* Bottom border accent */}
                                <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'></div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <i className="fas fa-tags text-4xl"></i>
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
                            <i className="fas fa-list mr-2"></i> View All Categories
                        </Link>
                    </div>
                )}
            </section>

            {/* Features Section */}
            <section className='py-20 px-5 lg:px-30 bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 relative overflow-hidden'>
                {/* Background decorative elements */}
                <div className='absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-teal-400/20 rounded-full blur-xl'></div>
                <div className='absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-blue-300/10 to-teal-300/10 rounded-full blur-2xl'></div>

                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-center mb-16'
                >
                    <div className='inline-flex items-center gap-3 mb-4'>
                        <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                        <h2 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>Why Choose Us</h2>
                    </div>
                    <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-800'>Premium SportFlex Experience</h1>
                    <p className='text-gray-600 text-base lg:text-lg max-w-2xl mx-auto'>We're committed to providing exceptional service and support at every step of your fitness journey</p>
                </motion.div>

                {/* Features grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto'>
                    {/* First card - Free Delivery */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className='group relative'
                    >
                        {/* Card */}
                        <div className='bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 relative overflow-hidden'>
                            {/* Hover gradient overlay */}
                            <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                            {/* Icon container */}
                            <div className='relative mb-6 flex justify-center'>
                                <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
                                    <div className='w-14 h-14 bg-white rounded-full flex items-center justify-center'>
                                        <svg width="32" height="32" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" className='group-hover:scale-110 transition-transform duration-300'>
                                            <g clipPath="url(#clip0_913_502)">
                                                <path d="M12.1667 32.1667C14.0077 32.1667 15.5 30.6743 15.5 28.8333C15.5 26.9924 14.0077 25.5 12.1667 25.5C10.3258 25.5 8.83337 26.9924 8.83337 28.8333C8.83337 30.6743 10.3258 32.1667 12.1667 32.1667Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M28.8333 32.1667C30.6743 32.1667 32.1667 30.6743 32.1667 28.8333C32.1667 26.9924 30.6743 25.5 28.8333 25.5C26.9924 25.5 25.5 26.9924 25.5 28.8333C25.5 30.6743 26.9924 32.1667 28.8333 32.1667Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M8.83325 28.8335H7.49992C6.39535 28.8335 5.49992 27.9381 5.49992 26.8335V22.1668M3.83325 8.8335H20.1666C21.2712 8.8335 22.1666 9.72893 22.1666 10.8335V28.8335M15.4999 28.8335H25.4999M32.1666 28.8335H33.4999C34.6045 28.8335 35.4999 27.9381 35.4999 26.8335V18.8335M35.4999 18.8335H22.1666M35.4999 18.8335L31.0825 11.4712C30.7211 10.8688 30.0701 10.5002 29.3675 10.5002H22.1666" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </g>
                                        </svg>
                                    </div>
                                </div>
                                {/* Floating effect indicator */}
                                <div className='absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse'></div>
                            </div>

                            {/* Content */}
                            <div className='relative text-center'>
                                <h3 className='font-semibold text-xl text-gray-800 mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-teal-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300'>
                                    FREE AND FAST DELIVERY
                                </h3>
                                <p className='text-gray-600 text-sm leading-relaxed'>
                                    Free delivery for all orders over EGP 140
                                </p>
                            </div>

                            {/* Bottom accent line */}
                            <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center'></div>
                        </div>
                    </motion.div>

                    {/* Second card - Customer Service */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className='group relative'
                    >
                        <div className='bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 relative overflow-hidden'>
                            <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                            <div className='relative mb-6 flex justify-center'>
                                <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
                                    <div className='w-14 h-14 bg-white rounded-full flex items-center justify-center'>
                                        <svg width="32" height="32" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg" className='group-hover:scale-110 transition-transform duration-300'>
                                            <g clipPath="url(#clip0_913_519)">
                                                <path d="M13.3334 25.5001C13.3334 23.6591 11.841 22.1667 10.0001 22.1667C8.15913 22.1667 6.66675 23.6591 6.66675 25.5001V28.8334C6.66675 30.6744 8.15913 32.1667 10.0001 32.1667C11.841 32.1667 13.3334 30.6744 13.3334 28.8334V25.5001Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M33.3334 25.5001C33.3334 23.6591 31.841 22.1667 30.0001 22.1667C28.1591 22.1667 26.6667 23.6591 26.6667 25.5001V28.8334C26.6667 30.6744 28.1591 32.1667 30.0001 32.1667C31.841 32.1667 33.3334 30.6744 33.3334 28.8334V25.5001Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M6.66675 25.5001V20.5001C6.66675 16.9639 8.07151 13.5725 10.572 11.072C13.0725 8.57151 16.4639 7.16675 20.0001 7.16675C23.5363 7.16675 26.9277 8.57151 29.4282 11.072C31.9287 13.5725 33.3334 16.9639 33.3334 20.5001V25.5001" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </g>
                                        </svg>
                                    </div>
                                </div>
                                <div className='absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse'></div>
                            </div>

                            <div className='relative text-center'>
                                <h3 className='font-semibold text-xl text-gray-800 mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-teal-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300'>
                                    24/7 CUSTOMER SERVICE
                                </h3>
                                <p className='text-gray-600 text-sm leading-relaxed'>
                                    Friendly 24/7 customer support
                                </p>
                            </div>

                            <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center'></div>
                        </div>
                    </motion.div>

                    {/* Third card - Money Back Guarantee */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className='group relative md:col-span-2 lg:col-span-1 md:mx-auto lg:mx-0 md:max-w-sm lg:max-w-none'
                    >
                        <div className='bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 relative overflow-hidden'>
                            <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                            <div className='relative mb-6 flex justify-center'>
                                <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
                                    <div className='w-14 h-14 bg-white rounded-full flex items-center justify-center'>
                                        <svg width="32" height="32" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg" className='group-hover:scale-110 transition-transform duration-300'>
                                            <path d="M19.9832 3.0874C21.0047 3.0874 22.0041 3.23663 22.7576 3.51807L31.075 6.63525H31.0759C33.2954 7.46202 35.0505 10.0076 35.0505 12.3667V24.7495C35.0505 25.8367 34.7063 27.0895 34.1238 28.2485C33.5778 29.3348 32.8404 30.3024 32.031 30.9556L31.8679 31.0825L24.7009 36.4321L24.6951 36.437C23.4124 37.4261 21.7238 37.9331 19.9998 37.9331C18.277 37.933 16.5847 37.4263 15.2644 36.4478H15.2634L8.09937 31.0991C7.22666 30.4484 6.42532 29.4208 5.84253 28.2593C5.25969 27.0976 4.91675 25.8447 4.91675 24.7661V12.3667C4.91675 10.0075 6.67169 7.46189 8.89136 6.63525H8.89233L17.2087 3.51807C17.9622 3.23655 18.9615 3.08743 19.9832 3.0874ZM20.0007 4.58545C19.2021 4.58763 18.3752 4.69487 17.7419 4.93115L17.741 4.93213L9.42456 8.04834H9.42358C8.59608 8.35993 7.85485 9.02245 7.32397 9.79053C6.7929 10.5589 6.43335 11.4898 6.43335 12.3833V24.7661C6.43335 25.6606 6.74393 26.6893 7.20093 27.6011C7.65781 28.5126 8.29317 29.3726 9.00073 29.9009L16.1677 35.2505C17.2296 36.0444 18.6282 36.4252 20.0017 36.4253C21.3756 36.4253 22.7779 36.0442 23.8474 35.2515L23.8494 35.2505L31.0154 29.9009L31.0164 29.8999C31.7311 29.3638 32.3667 28.5049 32.822 27.5942C33.2774 26.6836 33.5837 25.6596 33.5837 24.7661V12.3667C33.5837 11.4807 33.2233 10.5539 32.6931 9.78662C32.1626 9.01907 31.4221 8.35386 30.5974 8.03369L30.5925 8.03174L22.2751 4.91455L22.2664 4.91162C21.6282 4.68643 20.8001 4.58327 20.0007 4.58545Z" fill="#3B82F6" stroke="#3B82F6" />
                                            <path d="M24.4038 15.27C24.6919 14.9822 25.1754 14.982 25.4634 15.27C25.7513 15.558 25.7511 16.0415 25.4634 16.3296L18.2964 23.4966C18.1451 23.6478 17.9573 23.7163 17.7661 23.7163C17.5751 23.7162 17.388 23.6477 17.2368 23.4966L14.5532 20.813C14.2654 20.5249 14.2652 20.0414 14.5532 19.7534C14.8412 19.4654 15.3247 19.4655 15.6128 19.7534L17.7661 21.9067L18.1206 21.5532L24.4038 15.27Z" fill="#3B82F6" stroke="#3B82F6" />
                                        </svg>
                                    </div>
                                </div>
                                <div className='absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse'></div>
                            </div>

                            <div className='relative text-center'>
                                <h3 className='font-semibold text-xl text-gray-800 mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-teal-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300'>
                                    MONEY BACK GUARANTEE
                                </h3>
                                <p className='text-gray-600 text-sm leading-relaxed'>
                                    We return money within 30 days
                                </p>
                            </div>

                            <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center'></div>
                        </div>
                    </motion.div>
                </div>

                {/* Optional: Additional trust indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className='mt-16 text-center'
                >
                    <div className='inline-flex items-center gap-6 text-gray-500 text-sm'>
                        <div className='flex items-center gap-2'>
                            <i className="fas fa-shield-alt bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent"></i>
                            <span>Secure Payment</span>
                        </div>
                        <div className='w-px h-4 bg-gradient-to-b from-blue-200 to-teal-200'></div>
                        <div className='flex items-center gap-2'>
                            <i className="fas fa-users bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent"></i>
                            <span>10k+ Happy Customers</span>
                        </div>
                        <div className="w-px h-4 bg-gradient-to-b from-blue-200 to-teal-200"></div>
                        <div className="flex items-center gap-2">
                            <i className="fas fa-award bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent"></i>
                            <span>Premium Quality</span>
                        </div>
                    </div>
                </motion.div>
            </section>
        </>
    );
}