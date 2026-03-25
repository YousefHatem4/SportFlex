import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    FaShoppingCart,
    FaHeart,
    FaTrash
} from 'react-icons/fa';

const FALLBACK_PRODUCT_IMAGE =
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';

function getInitialTheme() {
    if (typeof window === 'undefined') {
        return true;
    }

    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
}

function useDarkModeState() {
    const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return undefined;
        }

        const syncTheme = () => {
            const savedTheme = window.localStorage.getItem('theme');
            const nextTheme = savedTheme
                ? savedTheme === 'dark'
                : document.documentElement.classList.contains('dark');

            setIsDarkMode((prev) => (prev === nextTheme ? prev : nextTheme));
        };

        const handleStorage = () => {
            syncTheme();
        };

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    syncTheme();
                    break;
                }
            }
        });

        window.addEventListener('storage', handleStorage);
        observer.observe(document.documentElement, { attributes: true });

        return () => {
            window.removeEventListener('storage', handleStorage);
            observer.disconnect();
        };
    }, []);

    return isDarkMode;
}

function formatCartItems(data = []) {
    return data.map((item) => ({
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
    }));
}

const LoadingOverlay = memo(function LoadingOverlay({ isDarkMode }) {
    return (
        <div
            className={`fixed inset-0 bg-opacity-20 flex items-center justify-center z-50
                ${isDarkMode ? 'bg-black' : 'bg-gray-900'}`}
            role="status"
            aria-live="polite"
            aria-label="Loading cart"
        >
            <div
                className={`p-6 rounded-lg shadow-xl flex items-center border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            >
                <div
                    className={`animate-spin rounded-full h-6 w-6 border-b-2 mr-3
                        ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}
                    aria-hidden="true"
                />
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    Loading cart...
                </span>
            </div>
        </div>
    );
});

const AuthRequiredState = memo(function AuthRequiredState({ isDarkMode, onLogin }) {
    return (
        <main
            className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}
        >
            <div className="text-center">
                <div
                    className={`mb-4 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                    aria-hidden="true"
                >
                    <FaShoppingCart className="text-6xl" />
                </div>
                <h1
                    className={`text-xl font-semibold mb-3 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    Please Sign In
                </h1>
                <p
                    className={`mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    You need to be signed in to view your cart
                </p>
                <button
                    type="button"
                    onClick={onLogin}
                    className={`px-6 py-3 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                >
                    Sign In
                </button>
            </div>
        </main>
    );
});

const EmptyCartState = memo(function EmptyCartState({ isDarkMode }) {
    return (
        <div
            className={`rounded-xl shadow-sm p-8 text-center border transition-colors duration-300
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
            <div
                className={`mb-4 transition-colors duration-300
                    ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                aria-hidden="true"
            >
                <FaShoppingCart className="text-6xl" />
            </div>
            <h2
                className={`text-xl font-medium mb-2 transition-colors duration-300
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
                Your cart is empty
            </h2>
            <p
                className={`mb-6 transition-colors duration-300
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
                Looks like you haven&apos;t added any SportFlex items to your cart yet.
            </p>
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
    );
});

const CartItemRow = memo(function CartItemRow({
    item,
    isDarkMode,
    isLoading,
    onQuantityChange,
    onMoveToWishlist,
    onRemoveItem
}) {
    return (
        <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className={`rounded-xl shadow-sm p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center border transition-colors duration-300
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
            <div className="md:col-span-5 flex items-center gap-4">
                <img
                    src={item.product.image_url || FALLBACK_PRODUCT_IMAGE}
                    className={`w-20 h-20 object-cover rounded-lg border transition-colors duration-300
                        ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                    alt={item.product.title}
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                    }}
                />
                <div>
                    <h3
                        className={`font-medium line-clamp-2 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        {item.product.title}
                    </h3>
                    <p
                        className={`text-sm mt-1 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                        {item.product.category}
                    </p>
                </div>
            </div>

            <div className="md:col-span-2 flex justify-start md:justify-center">
                <span
                    className={`font-medium md:hidden mr-2 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    Price:
                </span>
                <p
                    className={`font-semibold transition-colors duration-300
                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                >
                    EGP {item.price.toFixed(2)}
                </p>
            </div>

            <div className="md:col-span-3 flex items-center justify-start md:justify-center">
                <span
                    className={`font-medium md:hidden mr-2 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    Qty:
                </span>
                <div
                    className={`flex items-center border rounded-lg w-28 h-10 justify-between transition-colors duration-300
                        ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                >
                    <button
                        type="button"
                        onClick={() => onQuantityChange(item.id, -1)}
                        disabled={isLoading}
                        aria-label={`Decrease quantity for ${item.product.title}`}
                        className={`px-3 cursor-pointer transition h-full flex items-center rounded-l-lg
                            ${isDarkMode
                                ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-700'
                                : 'text-gray-600 hover:text-cyan-700 hover:bg-gray-100'}`}
                    >
                        -
                    </button>
                    <span
                        className={`font-medium transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        {item.quantity}
                    </span>
                    <button
                        type="button"
                        onClick={() => onQuantityChange(item.id, 1)}
                        disabled={isLoading || item.product.stock <= item.quantity}
                        aria-label={`Increase quantity for ${item.product.title}`}
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

            <div className="md:col-span-2 flex items-center justify-between">
                <div className="flex gap-3 items-center">
                    <button
                        type="button"
                        onClick={() => onMoveToWishlist(item.product.id)}
                        className={`cursor-pointer transition hover:scale-110
                            ${isDarkMode
                                ? 'text-gray-400 hover:text-cyan-400'
                                : 'text-gray-600 hover:text-cyan-700'}`}
                        disabled={isLoading}
                        title="Move to wishlist"
                        aria-label={`Move ${item.product.title} to wishlist`}
                    >
                        <FaHeart />
                    </button>
                    <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className={`cursor-pointer transition hover:scale-110
                            ${isDarkMode
                                ? 'text-gray-400 hover:text-cyan-400'
                                : 'text-gray-600 hover:text-cyan-700'}`}
                        disabled={isLoading}
                        title="Remove item"
                        aria-label={`Remove ${item.product.title} from cart`}
                    >
                        <FaTrash />
                    </button>
                    <div>
                        <span
                            className={`font-medium md:hidden transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                            Subtotal:
                        </span>
                        <p
                            className={`font-semibold transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                        >
                            EGP {item.subtotal.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default function Cart() {
    const [isLoading, setIsLoading] = useState(true);
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);
    const isDarkMode = useDarkModeState();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Cart - SportFlex Store';
    }, []);

    const triggerCartUpdate = useCallback(() => {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        localStorage.setItem('cart_updated', Date.now().toString());
    }, []);

    const fetchCartItems = useCallback(async (userId) => {
        try {
            setIsLoading(true);

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
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setCartItems(formatCartItems(data));
        } catch (error) {
            console.error('Error fetching cart items:', error);
            toast.error('Failed to load cart items');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkUser = useCallback(async () => {
        const {
            data: { session }
        } = await supabase.auth.getSession();

        const nextUser = session?.user || null;
        setUser(nextUser);

        if (nextUser) {
            await fetchCartItems(nextUser.id);
        } else {
            setIsLoading(false);
        }
    }, [fetchCartItems]);

    useEffect(() => {
        checkUser();
    }, [checkUser]);

    const removeItem = useCallback(
        async (cartItemId) => {
            try {
                setIsLoading(true);

                const { error } = await supabase
                    .from('cart_items')
                    .delete()
                    .eq('id', cartItemId);

                if (error) {
                    throw error;
                }

                setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));

                toast.success('Item removed from cart');
                triggerCartUpdate();
            } catch (error) {
                console.error('Error removing item:', error);
                toast.error('Failed to remove item');
            } finally {
                setIsLoading(false);
            }
        },
        [triggerCartUpdate]
    );

    const updateQuantity = useCallback(
        async (cartItemId, newQuantity) => {
            try {
                setIsLoading(true);

                if (newQuantity < 1) {
                    await removeItem(cartItemId);
                    return;
                }

                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', cartItemId);

                if (error) {
                    throw error;
                }

                setCartItems((prev) =>
                    prev.map((item) =>
                        item.id === cartItemId
                            ? {
                                ...item,
                                quantity: newQuantity,
                                subtotal: item.price * newQuantity
                            }
                            : item
                    )
                );

                toast.success('Quantity updated');
                triggerCartUpdate();
            } catch (error) {
                console.error('Error updating quantity:', error);
                toast.error('Failed to update quantity');
            } finally {
                setIsLoading(false);
            }
        },
        [removeItem, triggerCartUpdate]
    );

    const handleClearCart = useCallback(async () => {
        if (!user) {
            toast.error('Please login to manage cart');
            navigate('/login');
            return;
        }

        if (!window.confirm('Are you sure you want to clear your entire cart?')) {
            return;
        }

        try {
            setIsLoading(true);

            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id);

            if (error) {
                throw error;
            }

            setCartItems([]);
            toast.success('Cart cleared successfully');
            triggerCartUpdate();
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Failed to clear cart');
        } finally {
            setIsLoading(false);
        }
    }, [navigate, triggerCartUpdate, user]);

    const handleCheckout = useCallback(() => {
        if (!user) {
            toast.error('Please login to checkout');
            navigate('/login');
            return;
        }

        if (cartItems.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        localStorage.setItem(
            'checkout_cart',
            JSON.stringify({
                products: cartItems.map((item) => ({
                    product: {
                        id: item.product.id,
                        title: item.product.title,
                        imageCover: item.product.image_url
                    },
                    price: item.price,
                    count: item.quantity
                }))
            })
        );

        navigate('/checkout');
    }, [cartItems, navigate, user]);

    const moveToWishlist = useCallback(
        async (productId) => {
            if (!user) {
                toast.error('Please login to use wishlist');
                navigate('/login');
                return;
            }

            try {
                const { data: existingItem, error: checkError } = await supabase
                    .from('wishlist_items')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('product_id', productId)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') {
                    throw checkError;
                }

                if (!existingItem) {
                    const { error: insertError } = await supabase
                        .from('wishlist_items')
                        .insert({
                            user_id: user.id,
                            product_id: productId
                        });

                    if (insertError) {
                        throw insertError;
                    }

                    toast.success('Item moved to wishlist');
                } else {
                    toast.info('Item already in wishlist');
                }
            } catch (error) {
                console.error('Error moving to wishlist:', error);
                toast.error('Failed to move to wishlist');
            }
        },
        [navigate, user]
    );

    const handleQuantityChange = useCallback(
        (cartItemId, change) => {
            const item = cartItems.find((cartItem) => cartItem.id === cartItemId);

            if (!item) {
                return;
            }

            const newQuantity = item.quantity + change;

            if (newQuantity > 0) {
                updateQuantity(cartItemId, newQuantity);
            } else {
                removeItem(cartItemId);
            }
        },
        [cartItems, removeItem, updateQuantity]
    );

    const subtotal = useMemo(
        () => cartItems.reduce((total, item) => total + item.subtotal, 0),
        [cartItems]
    );
    const total = subtotal;
    const hasItems = cartItems.length > 0;

    if (!user) {
        return (
            <AuthRequiredState
                isDarkMode={isDarkMode}
                onLogin={() => navigate('/login')}
            />
        );
    }

    return (
        <main
            className={`min-h-screen py-8 px-4 sm:px-6 lg:px-20 transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}
        >
            {isLoading && <LoadingOverlay isDarkMode={isDarkMode} />}

            <div className="max-w-6xl mx-auto">
                <header>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <div
                            className={`w-5 h-10 rounded-md transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}
                            aria-hidden="true"
                        />
                        <h1
                            className={`font-extrabold text-2xl tracking-wide bg-gradient-to-r bg-clip-text text-transparent
                                ${isDarkMode
                                    ? 'from-cyan-400 to-cyan-300'
                                    : 'from-cyan-700 to-cyan-600'}`}
                        >
                            Shopping Cart
                        </h1>
                        <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                                    : 'bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-700'}`}
                            aria-label={`${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in cart`}
                        >
                            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                        </span>
                    </motion.div>

                    <p
                        className={`mb-8 ml-8 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                        Review your SportFlex items and proceed to checkout
                    </p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    <section className="lg:w-2/3" aria-label="Cart items">
                        <div
                            className={`hidden md:grid grid-cols-12 gap-4 rounded-xl shadow-sm p-6 mb-4 text-sm font-medium uppercase tracking-wide border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gray-900 text-gray-400 border-gray-800'
                                    : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                            <div className="col-span-5">Product</div>
                            <div className="col-span-2 text-center">Price</div>
                            <div className="col-span-3 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Subtotal</div>
                        </div>

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
                                    <CartItemRow
                                        key={item.id}
                                        item={item}
                                        isDarkMode={isDarkMode}
                                        isLoading={isLoading}
                                        onQuantityChange={handleQuantityChange}
                                        onMoveToWishlist={moveToWishlist}
                                        onRemoveItem={removeItem}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <EmptyCartState isDarkMode={isDarkMode} />
                        )}
                    </section>

                    {hasItems && (
                        <aside className="lg:w-1/3">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-sm p-6 sticky top-6 border transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gray-900 border-gray-800'
                                        : 'bg-white border-gray-200'}`}
                            >
                                <h2
                                    className={`text-xl font-semibold mb-6 pb-4 border-b transition-colors duration-300
                                        ${isDarkMode ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'}`}
                                >
                                    Order Summary
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between">
                                        <span
                                            className={`transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                                        >
                                            Subtotal
                                        </span>
                                        <span
                                            className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                        >
                                            EGP {subtotal.toFixed(2)}
                                        </span>
                                    </div>

                                    <div
                                        className={`pt-4 border-t transition-colors duration-300
                                            ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span
                                                className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                                            >
                                                Shipping will be calculated at checkout
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span
                                                className={`text-lg font-semibold transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                            >
                                                Total
                                            </span>
                                            <span
                                                className={`text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent
                                                    ${isDarkMode
                                                        ? 'from-cyan-400 to-cyan-300'
                                                        : 'from-cyan-700 to-cyan-600'}`}
                                            >
                                                EGP {total.toFixed(2)}
                                            </span>
                                        </div>
                                        <p
                                            className={`text-xs mt-2 transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                                        >
                                            *Shipping costs vary by location and will be added during checkout
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={handleCheckout}
                                        className={`block w-full text-white text-center font-semibold py-3 rounded-lg shadow-md transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                    >
                                        Proceed to Checkout
                                    </button>

                                    <button
                                        type="button"
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
                        </aside>
                    )}
                </div>
            </div>
        </main>
    );
}