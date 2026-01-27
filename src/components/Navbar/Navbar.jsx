// src/components/Navbar/Navbar.jsx
import React, { useContext, useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { userContext } from '../../Context/userContext'
import { supabase } from '../../supabaseClient'
import { FaHeart, FaRegHeart, FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

export default function Navbar() {
    const location = useLocation();
    const currentPath = location.pathname;
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Get user data from context
    const { userToken, user, isAdmin, setUserToken, setUser } = useContext(userContext);

    // State for cart items count
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const [isLoadingCart, setIsLoadingCart] = useState(false);

    // State for special offers slider
    const [specialOffers, setSpecialOffers] = useState([]);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Check if user is logged in
    const isUserLoggedIn = userToken !== null;

    // Fetch special offers
    useEffect(() => {
        fetchSpecialOffers();

        // Set up auto-rotation for offers
        const interval = setInterval(() => {
            nextOffer();
        }, 5000); // Change offer every 5 seconds

        return () => clearInterval(interval);
    }, [specialOffers.length, currentOfferIndex]);

    const fetchSpecialOffers = async () => {
        try {
            const { data, error } = await supabase
                .from('special_offers')
                .select('banner_text, is_active')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setSpecialOffers(data.map(item => item.banner_text));
            } else {
                // Fallback to default offers
                setSpecialOffers([
                    'Summer Sale For All SportFlex And Free Express Delivery - OFF 50%!',
                    'Limited Time Offer: Buy 2 Get 1 Free on Selected Items!',
                    'Free Shipping on Orders Over EGP 500!',
                    'New Collection Launch - Up to 40% Off!'
                ]);
            }
        } catch (error) {
            console.error('Error fetching special offers:', error);
            setSpecialOffers([
                'Summer Sale For All SportFlex And Free Express Delivery - OFF 50%!',
                'Limited Time Offer: Buy 2 Get 1 Free on Selected Items!'
            ]);
        }
    };

    // Slider navigation functions
    const nextOffer = () => {
        if (specialOffers.length <= 1) return;

        setIsAnimating(true);
        setTimeout(() => {
            setCurrentOfferIndex((prevIndex) =>
                prevIndex === specialOffers.length - 1 ? 0 : prevIndex + 1
            );
            setIsAnimating(false);
        }, 300);
    };

    const prevOffer = () => {
        if (specialOffers.length <= 1) return;

        setIsAnimating(true);
        setTimeout(() => {
            setCurrentOfferIndex((prevIndex) =>
                prevIndex === 0 ? specialOffers.length - 1 : prevIndex - 1
            );
            setIsAnimating(false);
        }, 300);
    };

    // Manual navigation for dots
    const goToOffer = (index) => {
        if (index === currentOfferIndex || specialOffers.length <= 1) return;

        setIsAnimating(true);
        setTimeout(() => {
            setCurrentOfferIndex(index);
            setIsAnimating(false);
        }, 300);
    };

    // Fetch cart items count - useCallback to memoize the function
    const fetchCartCount = useCallback(async (userId) => {
        if (!userId) {
            setCartItemsCount(0);
            return;
        }

        try {
            setIsLoadingCart(true);
            const { count, error } = await supabase
                .from('cart_items')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) throw error;

            setCartItemsCount(count || 0);
        } catch (error) {
            console.error('Error fetching cart count:', error);
            setCartItemsCount(0);
        } finally {
            setIsLoadingCart(false);
        }
    }, []);

    // Fetch cart count when user changes or on mount
    useEffect(() => {
        if (isUserLoggedIn && user?.id) {
            fetchCartCount(user.id);
        } else {
            setCartItemsCount(0);
        }
    }, [isUserLoggedIn, user?.id, fetchCartCount]);

    // Set up a custom event listener for cart updates
    useEffect(() => {
        const handleCartUpdate = () => {
            if (isUserLoggedIn && user?.id) {
                fetchCartCount(user.id);
            }
        };

        // Listen for custom cart update events
        window.addEventListener('cartUpdated', handleCartUpdate);

        // Also listen for storage events (if cart updates use localStorage)
        window.addEventListener('storage', (event) => {
            if (event.key === 'cart_updated') {
                handleCartUpdate();
            }
        });

        // Subscribe to real-time database changes
        let subscription;
        if (isUserLoggedIn && user?.id) {
            subscription = supabase
                .channel(`cart-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'cart_items',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('Cart change detected:', payload.eventType);
                        // Debounce the fetch to avoid multiple rapid calls
                        clearTimeout(window.cartUpdateTimeout);
                        window.cartUpdateTimeout = setTimeout(() => {
                            fetchCartCount(user.id);
                        }, 300);
                    }
                )
                .subscribe();
        }

        // Cleanup
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('storage', handleCartUpdate);
            clearTimeout(window.cartUpdateTimeout);

            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [isUserLoggedIn, user?.id, fetchCartCount]);

    // Create a function to manually trigger cart refresh
    const refreshCartCount = useCallback(() => {
        if (isUserLoggedIn && user?.id) {
            fetchCartCount(user.id);
        }
    }, [isUserLoggedIn, user?.id, fetchCartCount]);

    // Listen for page focus/blur events to refresh cart
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isUserLoggedIn && user?.id) {
                // Refresh cart when page becomes visible again
                refreshCartCount();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', refreshCartCount);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', refreshCartCount);
        };
    }, [isUserLoggedIn, user?.id, refreshCartCount]);

    // Listen for route changes to refresh cart
    useEffect(() => {
        refreshCartCount();
    }, [location.pathname, refreshCartCount]);

    async function logOut() {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Clear local state
            setUserToken(null);
            setUser(null);
            localStorage.removeItem('userToken');

            // Reset cart count
            setCartItemsCount(0);

            // Navigate to home
            navigate('/');

            // Close mobile menu if open
            setMenuOpen(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    return <>
        {/* Special Offers Slider */}
        {specialOffers.length > 0 && (
            <div className='bg-gradient-to-r from-gray-900 via-black to-gray-900 py-3 text-center border-b-2 border-cyan-500 relative overflow-hidden'>
                {/* Navigation Buttons - Only show if there are multiple offers */}
                {specialOffers.length > 1 && (
                    <>
                        <button
                            onClick={prevOffer}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200 z-10 bg-black/50 rounded-full p-1"
                            disabled={isAnimating}
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            onClick={nextOffer}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200 z-10 bg-black/50 rounded-full p-1"
                            disabled={isAnimating}
                        >
                            <FaChevronRight />
                        </button>
                    </>
                )}

                <div className="relative max-w-4xl mx-auto px-8">
                    {/* Animated Offer Text */}
                    <div className={`transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                        <p className='font-bold text-white text-sm md:text-base'>
                            {specialOffers[currentOfferIndex]}
                            <Link
                                to={'products'}
                                className='ms-2 text-cyan-400 hover:text-cyan-300 font-extrabold transition-colors duration-200 inline-flex items-center gap-1'
                            >
                                SHOP NOW <span className="text-lg">→</span>
                            </Link>
                        </p>
                    </div>

                    {/* Dots Indicator - Only show if there are multiple offers */}
                    {specialOffers.length > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-2">
                            {specialOffers.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToOffer(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentOfferIndex
                                            ? 'bg-cyan-500 w-6'
                                            : 'bg-gray-600 hover:bg-gray-500'
                                        }`}
                                    disabled={isAnimating}
                                    aria-label={`Go to offer ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress Bar for Auto-Sliding */}
                {specialOffers.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
                        <div
                            className="h-full bg-cyan-500 transition-all duration-5000 ease-linear"
                            style={{
                                width: isAnimating ? '100%' : '0%',
                                animation: isAnimating ? 'none' : 'progress 5s linear'
                            }}
                            key={currentOfferIndex}
                        />
                    </div>
                )}

                <style>{`
                    @keyframes progress {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                `}</style>
            </div>
        )}

        <nav className="bg-black sticky w-full z-30 top-0 start-0 border-b-2 border-gray-800 shadow-2xl">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <Link to={''} className="flex items-center space-x-3 rtl:space-x-reverse">
                    <span className="self-center text-2xl font-extrabold whitespace-nowrap text-white hover:text-cyan-400 transition-colors duration-300">SPORTFLEX</span>
                </Link>

                <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                    {isUserLoggedIn && <>
                        <Link to={'wishlist'} className="relative group">
                            <FaRegHeart className="text-2xl cursor-pointer transition-all duration-300 text-white group-hover:opacity-0" />
                            <FaRegHeart className="text-2xl cursor-pointer absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-cyan-400" />
                            {currentPath === '/wishlist' && (
                                <FaHeart className="text-2xl cursor-pointer absolute top-0 left-0 transition-all duration-300 text-cyan-400" />
                            )}
                        </Link>
                        <Link to={'cart'} className="relative group">
                            <FaShoppingCart className="md:ms-2 text-2xl cursor-pointer transition-all duration-300 text-white group-hover:opacity-0" />
                            <FaShoppingCart className="md:ms-2 text-2xl cursor-pointer absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-cyan-400" />
                            {currentPath === '/cart' && (
                                <FaShoppingCart className="md:ms-2 text-2xl cursor-pointer absolute top-0 left-0 transition-all duration-300 text-cyan-400" />
                            )}
                            {cartItemsCount > 0 && (
                                <span className='absolute -top-2 -right-2 bg-cyan-500 text-black font-extrabold text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full shadow-lg ring-2 ring-black'>
                                    {isLoadingCart ? (
                                        <div className="animate-spin rounded-full h-2 w-2 border-b-1 border-black"></div>
                                    ) : (
                                        cartItemsCount > 99 ? '99+' : cartItemsCount
                                    )}
                                </span>
                            )}
                            {cartItemsCount === 0 && !isLoadingCart && isUserLoggedIn && (
                                <span className='absolute -top-2 -right-2 bg-gray-800 text-gray-300 font-bold text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full ring-1 ring-gray-700'>
                                    0
                                </span>
                            )}
                        </Link>
                    </>}

                    <button onClick={() => setMenuOpen(!menuOpen)} data-collapse-toggle="navbar-sticky" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200 ring-1 ring-gray-800">
                        <span className="sr-only">Open main menu</span>
                        {menuOpen ? <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg></> : <> <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M1 1h15M1 7h15M1 13h15" />
                        </svg></>}
                    </button>
                </div>

                <div className={`items-center ${menuOpen ? 'block' : 'hidden'} justify-between w-full md:flex md:w-auto md:order-1`} id="navbar-sticky">
                    <ul className="flex flex-col md:gap-5 p-4 md:p-0 mt-4 font-bold rounded-lg md:space-x-6 rtl:space-x-reverse md:flex-row md:mt-0 text-center md:text-left">
                        <li>
                            <Link to={''} onClick={() => setMenuOpen(false)} className={`block py-2 px-3 ${currentPath === '/' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'} rounded md:p-0 relative group transition-all duration-300`}>
                                HOME
                                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-cyan-500 transition-all duration-600 md:duration-300 group-hover:w-full"></span>
                            </Link>
                        </li>
                        <li>
                            <Link to={'products'} onClick={() => setMenuOpen(false)} className={`block py-2 px-3 ${currentPath === '/products' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'} rounded md:p-0 relative group transition-all duration-300`}>
                                PRODUCTS
                                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-cyan-500 transition-all duration-600 md:duration-300 group-hover:w-full"></span>
                            </Link>
                        </li>

                        <li>
                            <Link to={'category'} onClick={() => setMenuOpen(false)} className={`block py-2 px-3 ${currentPath === '/category' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'} rounded md:p-0 relative group transition-all duration-300`}>
                                CATEGORIES
                                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-cyan-500 transition-all duration-600 md:duration-300 group-hover:w-full"></span>
                            </Link>
                        </li>
                        <li>
                            <Link to={'about'} onClick={() => setMenuOpen(false)} className={`block py-2 px-3 ${currentPath === '/about' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'} rounded md:p-0 relative group transition-all duration-300`}>
                                ABOUT
                                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-cyan-500 transition-all duration-600 md:duration-300 group-hover:w-full"></span>
                            </Link>
                        </li>
                        <li>
                            <Link to={'contact'} onClick={() => setMenuOpen(false)} className={`block py-2 px-3 ${currentPath === '/contact' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'} rounded md:p-0 relative group transition-all duration-300`}>
                                CONTACT
                                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-cyan-500 transition-all duration-600 md:duration-300 group-hover:w-full"></span>
                            </Link>
                        </li>

                        {/* Show Admin link only for admin users */}
                        {isAdmin && (
                            <li>
                                <Link to={'admin'} onClick={() => setMenuOpen(false)} className={`block py-2 px-3 ${currentPath === '/admin' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'} rounded md:p-0 relative group transition-all duration-300`}>
                                    ADMIN PANEL
                                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-cyan-500 transition-all duration-600 md:duration-300 group-hover:w-full"></span>
                                </Link>
                            </li>
                        )}

                        <li>
                            {!isUserLoggedIn && (
                                <Link to={'login'} onClick={() => setMenuOpen(false)} className={`block py-2 px-3 ${currentPath === '/login' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'} rounded md:p-0 relative group transition-all duration-300`}>
                                    SIGN IN
                                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-cyan-500 transition-all duration-600 md:duration-300 group-hover:w-full"></span>
                                </Link>
                            )}
                            {isUserLoggedIn && (
                                <span onClick={logOut} className="cursor-pointer font-extrabold text-white hover:text-cyan-400 text-sm transition-all duration-300 uppercase">
                                    LOGOUT
                                </span>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </>
}