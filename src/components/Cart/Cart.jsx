// Cart.jsx
import React, { useEffect, useState } from 'react'
import style from './Cart.module.css'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function Cart() {
    const [isLoading, setIsLoading] = useState(true)
    const [cartItems, setCartItems] = useState([])
    const [user, setUser] = useState(null)
    const navigate = useNavigate()

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <i className="fas fa-shopping-cart text-6xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Please Sign In</h3>
                    <p className="text-gray-500 mb-6">You need to be signed in to view your cart</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        )
    }

    return (
        <section className="min-h-screen bg-gradient-to-b from-blue-50/30 to-teal-50/30 py-8 px-4 sm:px-6 lg:px-20">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                        <span>Loading cart...</span>
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
                    <div className="bg-gradient-to-r from-blue-500 to-teal-400 w-5 h-10 rounded-md"></div>
                    <h1 className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-semibold text-2xl">Shopping Cart</h1>
                </motion.div>
                <p className="text-gray-600 mb-8 ml-8">Review your SportFlex items and proceed to checkout</p>

                {/* Cart Container */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items */}
                    <div className="lg:w-2/3">
                        {/* Desktop Headers */}
                        <div className="hidden md:grid grid-cols-12 gap-4 bg-white rounded-xl shadow-sm p-6 mb-4 text-gray-500 font-medium text-sm uppercase tracking-wide">
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
                                        className="bg-white rounded-xl shadow-sm p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                                    >
                                        {/* Product Info */}
                                        <div className="md:col-span-5 flex items-center gap-4">
                                            <img
                                                src={item.product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-100"
                                                alt={item.product.title}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                                }}
                                            />
                                            <div>
                                                <h3 className="font-medium text-gray-900 line-clamp-2">{item.product.title}</h3>
                                                <p className="text-gray-500 text-sm mt-1">{item.product.category}</p>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="md:col-span-2 flex justify-start md:justify-center">
                                            <span className="text-gray-900 font-medium md:hidden mr-2">Price: </span>
                                            <p className="text-gray-700 font-semibold">EGP {item.price.toFixed(2)}</p>
                                        </div>

                                        {/* Quantity Selector */}
                                        <div className="md:col-span-3 flex items-center justify-start md:justify-center">
                                            <span className="text-gray-900 font-medium md:hidden mr-2">Qty: </span>
                                            <div className="flex items-center border border-gray-200 rounded-lg w-28 h-10 justify-between">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, -1)}
                                                    disabled={isLoading}
                                                    className="px-3 text-gray-500 cursor-pointer hover:text-blue-500 transition h-full flex items-center"
                                                >
                                                    -
                                                </button>
                                                <span className="font-medium text-gray-800">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, 1)}
                                                    disabled={isLoading || item.product.stock <= item.quantity}
                                                    className={`px-3 cursor-pointer transition h-full flex items-center ${item.product.stock <= item.quantity
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-500 hover:text-blue-500'
                                                        }`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subtotal and Actions */}
                                        <div className="md:col-span-2 flex items-center justify-between">
                                           
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => moveToWishlist(item.product.id)}
                                                    className="text-gray-400 cursor-pointer hover:text-pink-500 transition "
                                                    disabled={isLoading}
                                                    title="Move to wishlist"
                                                >
                                                    <i className="fas fa-heart"></i>
                                                </button>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-400 cursor-pointer hover:text-blue-500 transition "
                                                    disabled={isLoading}
                                                    title="Remove item"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                <div>
                                                    <span className="text-gray-900 font-medium md:hidden">Subtotal: </span>
                                                    <p className="text-gray-900 font-semibold">EGP {item.subtotal.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                <div className="text-gray-300 mb-4">
                                    <i className="fas fa-shopping-cart text-6xl"></i>
                                </div>
                                <h3 className="text-xl font-medium text-gray-700 mb-2">Your cart is empty</h3>
                                <p className="text-gray-500 mb-6">Looks like you haven't added any SportFlex items to your cart yet.</p>
                                <Link
                                    to="/products"
                                    className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition"
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
                                className="bg-white rounded-xl shadow-sm p-6 sticky top-6"
                            >
                                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">EGP {subtotal.toFixed(2)}</span>
                                    </div>
                                    {/* Shipping line REMOVED - Will be calculated in checkout */}
                                    {/* Tax line already removed previously */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-gray-500">Shipping will be calculated at checkout</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-lg font-semibold text-gray-900">Total</span>
                                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">EGP {total.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            *Shipping costs vary by location and will be added during checkout
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleCheckout}
                                        className="block w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white text-center font-semibold py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-teal-600 transition"
                                    >
                                        Proceed to Checkout
                                    </button>

                                    <button
                                        onClick={handleClearCart}
                                        className="block w-full border border-gray-300 text-gray-700 text-center font-medium py-3 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Clear Cart
                                    </button>

                                    <Link
                                        to="/products"
                                        className="flex items-center justify-center text-blue-500 font-medium py-2 hover:text-blue-600 transition"
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