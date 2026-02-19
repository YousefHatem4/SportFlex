import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
    FaShoppingCart,
    FaHeart,
    FaTrash,
    FaSpinner
} from 'react-icons/fa'

export default function Cart() {
    const [isLoading, setIsLoading] = useState(true)
    const [cartItems, setCartItems] = useState([])
    const [user, setUser] = useState(null)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const navigate = useNavigate()

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

    // Check user session
    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)

        if (session?.user) {
            fetchCartItems(session.user.id)
        } else {
            setIsLoading(false)
        }
    }

    // Function to trigger cart update event for navbar
    const triggerCartUpdate = () => {
        // Dispatch custom event for navbar to listen to
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        // Also set a flag in localStorage for cross-tab communication
        localStorage.setItem('cart_updated', Date.now().toString());
    };

    // Fetch cart items from database
    const fetchCartItems = async (userId) => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('cart_items')
                .select(`
                    id,
                    quantity,
                    created_at,
                    updated_at,
                    products (
                        id,
                        title,
                        description,
                        price,
                        image_url,
                        stock,
                        categories (
                            name
                        )
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Transform data to match expected format
            const formattedItems = data?.map(item => ({
                id: item.id,
                product: {
                    id: item.products.id,
                    title: item.products.title,
                    image_url: item.products.image_url,
                    category: item.products.categories?.name || 'Uncategorized',
                    stock: item.products.stock
                },
                price: parseFloat(item.products.price),
                quantity: item.quantity,
                subtotal: parseFloat(item.products.price) * item.quantity
            })) || []

            setCartItems(formattedItems)
        } catch (error) {
            console.error('Error fetching cart items:', error)
            toast.error('Failed to load cart items')
        } finally {
            setIsLoading(false)
        }
    }

    // Update quantity
    const updateQuantity = async (cartItemId, newQuantity) => {
        try {
            setIsLoading(true)

            if (newQuantity < 1) {
                // Remove item if quantity becomes 0
                await removeItem(cartItemId)
                return
            }

            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', cartItemId)

            if (error) throw error

            // Update local state
            setCartItems(prev => prev.map(item =>
                item.id === cartItemId
                    ? {
                        ...item,
                        quantity: newQuantity,
                        subtotal: item.price * newQuantity
                    }
                    : item
            ))

            toast.success('Quantity updated')
            triggerCartUpdate() // Trigger navbar update
        } catch (error) {
            console.error('Error updating quantity:', error)
            toast.error('Failed to update quantity')
        } finally {
            setIsLoading(false)
        }
    }

    // Remove item from cart
    const removeItem = async (cartItemId) => {
        try {
            setIsLoading(true)

            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', cartItemId)

            if (error) throw error

            // Update local state
            setCartItems(prev => prev.filter(item => item.id !== cartItemId))

            toast.success('Item removed from cart')
            triggerCartUpdate() // Trigger navbar update
        } catch (error) {
            console.error('Error removing item:', error)
            toast.error('Failed to remove item')
        } finally {
            setIsLoading(false)
        }
    }

    // Clear entire cart
    const handleClearCart = async () => {
        if (!user) {
            toast.error('Please login to manage cart')
            navigate('/login')
            return
        }

        if (!window.confirm('Are you sure you want to clear your entire cart?')) {
            return
        }

        try {
            setIsLoading(true)

            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error

            setCartItems([])
            toast.success('Cart cleared successfully')
            triggerCartUpdate() // Trigger navbar update
        } catch (error) {
            console.error('Error clearing cart:', error)
            toast.error('Failed to clear cart')
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate totals (SHIPPING REMOVED FROM CART)
    const subtotal = cartItems.reduce((total, item) => total + item.subtotal, 0)
    // Shipping will be calculated in checkout based on governorate
    const total = subtotal // Only subtotal shown in cart
    const hasItems = cartItems.length > 0

    useEffect(() => {
        document.title = 'Cart - SportFlex Store'
    }, [])

    // Handle checkout - UPDATED TO NAVIGATE TO CHECKOUT PAGE
    const handleCheckout = () => {
        if (!user) {
            toast.error('Please login to checkout')
            navigate('/login')
            return
        }

        if (cartItems.length === 0) {
            toast.error('Your cart is empty')
            return
        }

        // Save cart items to localStorage to pass to checkout
        localStorage.setItem('checkout_cart', JSON.stringify({
            products: cartItems.map(item => ({
                product: {
                    id: item.product.id,
                    title: item.product.title,
                    imageCover: item.product.image_url
                },
                price: item.price,
                count: item.quantity
            }))
        }))

        // Navigate to checkout page
        navigate('/checkout')
    }

    // Move item to wishlist
    const moveToWishlist = async (productId) => {
        if (!user) {
            toast.error('Please login to use wishlist')
            navigate('/login')
            return
        }

        try {
            // Check if already in wishlist
            const { data: existingItem, error: checkError } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single()

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError
            }

            if (!existingItem) {
                // Add to wishlist
                const { error: insertError } = await supabase
                    .from('wishlist_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId
                    })

                if (insertError) throw insertError
                toast.success('Item moved to wishlist')
            } else {
                toast.info('Item already in wishlist')
            }
        } catch (error) {
            console.error('Error moving to wishlist:', error)
            toast.error('Failed to move to wishlist')
        }
    }

    // Handle quantity change
    const handleQuantityChange = (cartItemId, change) => {
        const item = cartItems.find(item => item.id === cartItemId)
        if (item) {
            const newQuantity = item.quantity + change
            if (newQuantity > 0) {
                updateQuantity(cartItemId, newQuantity)
            } else {
                removeItem(cartItemId)
            }
        }
    }

    if (!user) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`mb-4 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <FaShoppingCart className="text-6xl" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Please Sign In</h3>
                    <p className={`mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>You need to be signed in to view your cart</p>
                    <button
                        onClick={() => navigate('/login')}
                        className={`px-6 py-3 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                    >
                        Sign In
                    </button>
                </div>
            </div>
        )
    }

    return (
        <section className={`min-h-screen py-8 px-4 sm:px-6 lg:px-20 transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
            {/* Loading Overlay */}
            {isLoading && (
                <div className={`fixed inset-0 bg-opacity-20 flex items-center justify-center z-50
                    ${isDarkMode ? 'bg-black' : 'bg-gray-900'}`}>
                    <div className={`p-6 rounded-lg shadow-xl flex items-center border transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gray-900 border-gray-800'
                            : 'bg-white border-gray-200'}`}>
                        <div className={`animate-spin rounded-full h-6 w-6 border-b-2 mr-3
                            ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}></div>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading cart...</span>
                    </div>
                </div>
            )}

            {/* Title Section */}
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-2"
                >
                    <div className={`w-5 h-10 rounded-md transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                            : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}></div>
                    <h1 className={`font-extrabold text-2xl tracking-wide bg-gradient-to-r bg-clip-text text-transparent
                        ${isDarkMode
                            ? 'from-cyan-400 to-cyan-300'
                            : 'from-cyan-700 to-cyan-600'}`}>
                        Shopping Cart
                    </h1>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                            : 'bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-700'}`}>
                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                    </span>
                </motion.div>
                <p className={`mb-8 ml-8 transition-colors duration-300
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Review your SportFlex items and proceed to checkout</p>

                {/* Cart Container */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items */}
                    <div className="lg:w-2/3">
                        {/* Desktop Headers */}
                        <div className={`hidden md:grid grid-cols-12 gap-4 rounded-xl shadow-sm p-6 mb-4 text-sm font-medium uppercase tracking-wide border transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gray-900 text-gray-400 border-gray-800'
                                : 'bg-white text-gray-600 border-gray-200'}`}>
                            <div className="col-span-5">Product</div>
                            <div className="col-span-2 text-center">Price</div>
                            <div className="col-span-3 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Subtotal</div>
                        </div>

                        {/* Cart Items */}
                        {hasItems ? (
                            <motion.div
                                initial="hidden"
                                animate="show"
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                                }}
                                className="space-y-4"
                            >
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                                        className={`rounded-xl shadow-sm p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center border transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gray-900 border-gray-800'
                                                : 'bg-white border-gray-200'}`}
                                    >
                                        {/* Product Info */}
                                        <div className="md:col-span-5 flex items-center gap-4">
                                            <img
                                                src={item.product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                                className={`w-20 h-20 object-cover rounded-lg border transition-colors duration-300
                                                    ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                                                alt={item.product.title}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                                }}
                                            />
                                            <div>
                                                <h3 className={`font-medium line-clamp-2 transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.product.title}</h3>
                                                <p className={`text-sm mt-1 transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.product.category}</p>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="md:col-span-2 flex justify-start md:justify-center">
                                            <span className={`font-medium md:hidden mr-2 transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Price: </span>
                                            <p className={`font-semibold transition-colors duration-300
                                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>EGP {item.price.toFixed(2)}</p>
                                        </div>

                                        {/* Quantity Selector */}
                                        <div className="md:col-span-3 flex items-center justify-start md:justify-center">
                                            <span className={`font-medium md:hidden mr-2 transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Qty: </span>
                                            <div className={`flex items-center border rounded-lg w-28 h-10 justify-between transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800'
                                                    : 'border-gray-200 bg-white'}`}>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, -1)}
                                                    disabled={isLoading}
                                                    className={`px-3 cursor-pointer transition h-full flex items-center rounded-l-lg
                                                        ${isDarkMode
                                                            ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-700'
                                                            : 'text-gray-600 hover:text-cyan-700 hover:bg-gray-100'}`}
                                                >
                                                    -
                                                </button>
                                                <span className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, 1)}
                                                    disabled={isLoading || item.product.stock <= item.quantity}
                                                    className={`px-3 cursor-pointer transition h-full flex items-center rounded-r-lg
                                                        ${item.product.stock <= item.quantity
                                                            ? 'text-gray-600 cursor-not-allowed'
                                                            : isDarkMode
                                                                ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-700'
                                                                : 'text-gray-600 hover:text-cyan-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subtotal and Actions */}
                                        <div className="md:col-span-2 flex items-center justify-between">
                                            <div className="flex gap-3 items-center">
                                                <button
                                                    onClick={() => moveToWishlist(item.product.id)}
                                                    className={`cursor-pointer transition hover:scale-110
                                                        ${isDarkMode
                                                            ? 'text-gray-400 hover:text-cyan-400'
                                                            : 'text-gray-600 hover:text-cyan-700'}`}
                                                    disabled={isLoading}
                                                    title="Move to wishlist"
                                                >
                                                    <FaHeart />
                                                </button>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className={`cursor-pointer transition hover:scale-110
                                                        ${isDarkMode
                                                            ? 'text-gray-400 hover:text-cyan-400'
                                                            : 'text-gray-600 hover:text-cyan-700'}`}
                                                    disabled={isLoading}
                                                    title="Remove item"
                                                >
                                                    <FaTrash />
                                                </button>
                                                <div>
                                                    <span className={`font-medium md:hidden transition-colors duration-300
                                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Subtotal: </span>
                                                    <p className={`font-semibold transition-colors duration-300
                                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>EGP {item.subtotal.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className={`rounded-xl shadow-sm p-8 text-center border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gray-900 border-gray-800'
                                    : 'bg-white border-gray-200'}`}>
                                <div className={`mb-4 transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                    <FaShoppingCart className="text-6xl" />
                                </div>
                                <h3 className={`text-xl font-medium mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your cart is empty</h3>
                                <p className={`mb-6 transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Looks like you haven't added any SportFlex items to your cart yet.</p>
                                <Link
                                    to="/products"
                                    className={`inline-flex items-center px-5 py-3 text-white font-medium rounded-lg transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                >
                                    Browse SportFlex
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    {hasItems && (
                        <div className="lg:w-1/3">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-sm p-6 sticky top-6 border transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gray-900 border-gray-800'
                                        : 'bg-white border-gray-200'}`}
                            >
                                <h2 className={`text-xl font-semibold mb-6 pb-4 border-b transition-colors duration-300
                                    ${isDarkMode ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'}`}>Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between">
                                        <span className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</span>
                                        <span className={`font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {subtotal.toFixed(2)}</span>
                                    </div>
                                    {/* Shipping line REMOVED - Will be calculated in checkout */}
                                    {/* Tax line already removed previously */}
                                    <div className={`pt-4 border-t transition-colors duration-300
                                        ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                        <div className="flex justify-between mb-2">
                                            <span className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Shipping will be calculated at checkout</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={`text-lg font-semibold transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                                            <span className={`text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent
                                                ${isDarkMode
                                                    ? 'from-cyan-400 to-cyan-300'
                                                    : 'from-cyan-700 to-cyan-600'}`}>EGP {total.toFixed(2)}</span>
                                        </div>
                                        <p className={`text-xs mt-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            *Shipping costs vary by location and will be added during checkout
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleCheckout}
                                        className={`block w-full text-white text-center font-semibold py-3 rounded-lg shadow-md transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                    >
                                        Proceed to Checkout
                                    </button>

                                    <button
                                        onClick={handleClearCart}
                                        className={`block w-full text-center font-medium py-3 rounded-lg border transition-colors duration-300
                                            ${isDarkMode
                                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Clear Cart
                                    </button>

                                    <Link
                                        to="/products"
                                        className={`flex items-center justify-center font-medium py-2 transition-colors duration-300
                                            ${isDarkMode
                                                ? 'text-cyan-400 hover:text-cyan-300'
                                                : 'text-cyan-700 hover:text-cyan-800'}`}
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}