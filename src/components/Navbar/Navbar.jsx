import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { userContext } from '../../Context/userContext'
import { supabase } from '../../supabaseClient'
import { FaHeart, FaRegHeart, FaShoppingCart, FaChevronLeft, FaChevronRight, FaMoon, FaSun } from 'react-icons/fa'
import useThemeMode from '../../hooks/useThemeMode'

const DEFAULT_SPECIAL_OFFERS = [
    'Summer Sale For All SportFlex And Free Express Delivery - OFF 50%!',
    'Limited Time Offer: Buy 2 Get 1 Free on Selected Items!',
    'Free Shipping on Orders Over EGP 500!',
    'New Collection Launch - Up to 40% Off!'
];

const FALLBACK_SPECIAL_OFFERS = [
    'Summer Sale For All SportFlex And Free Express Delivery - OFF 50%!',
    'Limited Time Offer: Buy 2 Get 1 Free on Selected Items!'
];

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userToken, user, isAdmin, setUserToken, setUser } = useContext(userContext);

    const currentPath = location.pathname;
    const isDarkMode = useThemeMode(false);
    const isUserLoggedIn = userToken !== null;

    const [menuOpen, setMenuOpen] = useState(false);
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const [isLoadingCart, setIsLoadingCart] = useState(false);
    const [specialOffers, setSpecialOffers] = useState([]);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const animationTimeoutRef = useRef(null);
    const cartUpdateTimeoutRef = useRef(null);

    const applyTheme = useCallback((nextIsDarkMode) => {
        document.documentElement.classList.toggle('dark', nextIsDarkMode);
        localStorage.setItem('theme', nextIsDarkMode ? 'dark' : 'light');
    }, []);

    const toggleTheme = useCallback(() => {
        applyTheme(!isDarkMode);
    }, [applyTheme, isDarkMode]);

    const fetchSpecialOffers = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('special_offers')
                .select('banner_text, is_active')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setSpecialOffers(data.map((item) => item.banner_text));
            } else {
                setSpecialOffers(DEFAULT_SPECIAL_OFFERS);
            }
        } catch (error) {
            console.error('Error fetching special offers:', error);
            setSpecialOffers(FALLBACK_SPECIAL_OFFERS);
        }
    }, []);

    const queueOfferTransition = useCallback((updater) => {
        if (specialOffers.length <= 1) return;

        window.clearTimeout(animationTimeoutRef.current);
        setIsAnimating(true);

        animationTimeoutRef.current = window.setTimeout(() => {
            setCurrentOfferIndex(updater);
            setIsAnimating(false);
        }, 300);
    }, [specialOffers.length]);

    const nextOffer = useCallback(() => {
        queueOfferTransition((prevIndex) => (
            prevIndex === specialOffers.length - 1 ? 0 : prevIndex + 1
        ));
    }, [queueOfferTransition, specialOffers.length]);

    const prevOffer = useCallback(() => {
        queueOfferTransition((prevIndex) => (
            prevIndex === 0 ? specialOffers.length - 1 : prevIndex - 1
        ));
    }, [queueOfferTransition, specialOffers.length]);

    const goToOffer = useCallback((index) => {
        if (index === currentOfferIndex || specialOffers.length <= 1) return;

        window.clearTimeout(animationTimeoutRef.current);
        setIsAnimating(true);

        animationTimeoutRef.current = window.setTimeout(() => {
            setCurrentOfferIndex(index);
            setIsAnimating(false);
        }, 300);
    }, [currentOfferIndex, specialOffers.length]);

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

    const refreshCartCount = useCallback(() => {
        if (isUserLoggedIn && user?.id) {
            fetchCartCount(user.id);
        }
    }, [fetchCartCount, isUserLoggedIn, user?.id]);

    const handleCartUpdate = useCallback(() => {
        if (isUserLoggedIn && user?.id) {
            fetchCartCount(user.id);
        }
    }, [fetchCartCount, isUserLoggedIn, user?.id]);

    const closeMenu = useCallback(() => {
        setMenuOpen(false);
    }, []);

    const toggleMenu = useCallback(() => {
        setMenuOpen((prevMenuOpen) => !prevMenuOpen);
    }, []);

    const navItems = useMemo(() => ([
        { path: '', label: 'HOME' },
        { path: 'products', label: 'PRODUCTS' },
        { path: 'category', label: 'CATEGORIES' },
        { path: 'about', label: 'ABOUT' },
        { path: 'contact', label: 'CONTACT' },
        ...(isAdmin ? [{ path: 'admin', label: 'ADMIN PANEL' }] : [])
    ]), [isAdmin]);

    useEffect(() => {
        fetchSpecialOffers();
    }, [fetchSpecialOffers]);

    useEffect(() => {
        if (specialOffers.length <= 1) {
            return undefined;
        }

        const interval = window.setInterval(nextOffer, 5000);

        return () => window.clearInterval(interval);
    }, [nextOffer, specialOffers.length]);

    useEffect(() => {
        if (currentOfferIndex >= specialOffers.length && specialOffers.length > 0) {
            setCurrentOfferIndex(0);
        }
    }, [currentOfferIndex, specialOffers.length]);

    useEffect(() => {
        if (isUserLoggedIn && user?.id) {
            fetchCartCount(user.id);
        } else {
            setCartItemsCount(0);
        }
    }, [fetchCartCount, isUserLoggedIn, user?.id]);

    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key === 'cart_updated') {
                handleCartUpdate();
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        window.addEventListener('storage', handleStorage);

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
                    () => {
                        window.clearTimeout(cartUpdateTimeoutRef.current);
                        cartUpdateTimeoutRef.current = window.setTimeout(() => {
                            fetchCartCount(user.id);
                        }, 300);
                    }
                )
                .subscribe();
        }

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('storage', handleStorage);
            window.clearTimeout(cartUpdateTimeoutRef.current);

            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [fetchCartCount, handleCartUpdate, isUserLoggedIn, user?.id]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isUserLoggedIn && user?.id) {
                refreshCartCount();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', refreshCartCount);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', refreshCartCount);
        };
    }, [isUserLoggedIn, refreshCartCount, user?.id]);

    useEffect(() => {
        refreshCartCount();
    }, [location.pathname, refreshCartCount]);

    useEffect(() => () => {
        window.clearTimeout(animationTimeoutRef.current);
        window.clearTimeout(cartUpdateTimeoutRef.current);
    }, []);

    const logOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();

            setUserToken(null);
            setUser(null);
            localStorage.removeItem('userToken');
            setCartItemsCount(0);

            navigate('/');
            closeMenu();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [closeMenu, navigate, setUser, setUserToken]);

    const currentOffer = specialOffers[currentOfferIndex] || '';

    return <>
        {specialOffers.length > 0 && (
            <div className={`bg-gradient-to-r ${isDarkMode
                ? 'from-gray-900 via-black to-gray-900 border-cyan-500'
                : 'from-gray-100 via-white to-gray-100 border-cyan-600'} 
                py-3 text-center border-b-2 relative overflow-hidden transition-colors duration-300`}>

                {specialOffers.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prevOffer}
                            className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 
                                ${isDarkMode
                                    ? 'text-cyan-400 hover:text-cyan-300 bg-black/50'
                                    : 'text-cyan-700 hover:text-cyan-600 bg-white/80'} 
                                rounded-full p-1 transition-colors duration-200 shadow-md`}
                            disabled={isAnimating}
                            aria-label="Show previous special offer"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            type="button"
                            onClick={nextOffer}
                            className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-10 
                                ${isDarkMode
                                    ? 'text-cyan-400 hover:text-cyan-300 bg-black/50'
                                    : 'text-cyan-700 hover:text-cyan-600 bg-white/80'} 
                                rounded-full p-1 transition-colors duration-200 shadow-md`}
                            disabled={isAnimating}
                            aria-label="Show next special offer"
                        >
                            <FaChevronRight />
                        </button>
                    </>
                )}

                <div className="relative max-w-4xl mx-auto px-8">
                    <div
                        className={`transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
                        aria-live="polite"
                    >
                        <p className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {currentOffer}
                            <Link
                                to={'products'}
                                className={`ms-2 font-extrabold transition-colors duration-200 inline-flex items-center gap-1
                                    ${isDarkMode
                                        ? 'text-cyan-400 hover:text-cyan-300'
                                        : 'text-cyan-700 hover:text-cyan-800'}`}
                            >
                                SHOP NOW <span className="text-lg" aria-hidden="true">&rarr;</span>
                            </Link>
                        </p>
                    </div>

                    {specialOffers.length > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-2">
                            {specialOffers.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => goToOffer(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 
                                        ${index === currentOfferIndex
                                            ? isDarkMode
                                                ? 'bg-cyan-500 w-6'
                                                : 'bg-cyan-600 w-6'
                                            : isDarkMode
                                                ? 'bg-gray-600 hover:bg-gray-500'
                                                : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                    disabled={isAnimating}
                                    aria-label={`Show special offer ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {specialOffers.length > 1 && (
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div
                            className={`h-full ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-600'} transition-all duration-5000 ease-linear`}
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

        <nav
            className={`sticky w-full z-30 top-0 start-0 border-b-2 shadow-xl transition-colors duration-300
                ${isDarkMode
                    ? 'bg-black border-gray-800'
                    : 'bg-white border-gray-200'}`}
            aria-label="Primary"
        >

            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <Link to={''} className="flex items-center space-x-3 rtl:space-x-reverse">
                    <span className={`self-center text-2xl font-extrabold whitespace-nowrap transition-colors duration-300
                        ${isDarkMode
                            ? 'text-white hover:text-cyan-400'
                            : 'text-gray-900 hover:text-cyan-700'}`}>
                        SPORTFLEX
                    </span>
                </Link>

                <div className="flex items-center md:order-2 space-x-4 md:space-x-3 rtl:space-x-reverse">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110
                            ${isDarkMode
                                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                                : 'bg-gray-100 text-cyan-700 hover:bg-gray-200'}`}
                        aria-label="Toggle theme"
                        aria-pressed={isDarkMode}
                    >
                        {isDarkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                    </button>

                    {isUserLoggedIn && <>
                        <Link
                            to={'wishlist'}
                            className="relative group"
                            aria-label="Open wishlist"
                        >
                            <FaRegHeart className={`text-2xl cursor-pointer transition-all duration-300 
                                ${isDarkMode
                                    ? 'text-white group-hover:opacity-0'
                                    : 'text-gray-700 group-hover:opacity-0'}`} />
                            <FaRegHeart className={`text-2xl cursor-pointer absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                            {currentPath === '/wishlist' && (
                                <FaHeart className={`text-2xl cursor-pointer absolute top-0 left-0 transition-all duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                            )}
                        </Link>

                        <Link
                            to={'cart'}
                            className="relative group"
                            aria-label={`Open cart${cartItemsCount > 0 ? ` with ${cartItemsCount} items` : ''}`}
                        >
                            <FaShoppingCart className={`md:ms-2 text-2xl cursor-pointer transition-all duration-300
                                ${isDarkMode
                                    ? 'text-white group-hover:opacity-0'
                                    : 'text-gray-700 group-hover:opacity-0'}`} />
                            <FaShoppingCart className={`md:ms-2 text-2xl cursor-pointer absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                            {currentPath === '/cart' && (
                                <FaShoppingCart className={`md:ms-2 text-2xl cursor-pointer absolute top-0 left-0 transition-all duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                            )}
                            {cartItemsCount > 0 && (
                                <span className={`absolute -top-2 -right-2 font-extrabold text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full shadow-lg ring-2
                                    ${isDarkMode
                                        ? 'bg-cyan-500 text-black ring-black'
                                        : 'bg-cyan-700 text-white ring-white'}`}>
                                    {isLoadingCart ? (
                                        <div className={`animate-spin rounded-full h-2 w-2 border-b-1 
                                            ${isDarkMode ? 'border-black' : 'border-white'}`}></div>
                                    ) : (
                                        cartItemsCount > 99 ? '99+' : cartItemsCount
                                    )}
                                </span>
                            )}
                            {cartItemsCount === 0 && !isLoadingCart && isUserLoggedIn && (
                                <span className={`absolute -top-2 -right-2 font-bold text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full ring-1
                                    ${isDarkMode
                                        ? 'bg-gray-800 text-gray-300 ring-gray-700'
                                        : 'bg-gray-200 text-gray-600 ring-gray-300'}`}>
                                    0
                                </span>
                            )}
                        </Link>
                    </>}

                    <button
                        onClick={toggleMenu}
                        type="button"
                        className={`inline-flex items-center p-2 w-10 h-10 justify-center text-sm rounded-lg md:hidden 
                            focus:outline-none focus:ring-2 transition-colors duration-200 ring-1
                            ${isDarkMode
                                ? 'text-white hover:bg-gray-900 focus:ring-cyan-500 focus:ring-offset-black ring-gray-800'
                                : 'text-gray-700 hover:bg-gray-100 focus:ring-cyan-600 focus:ring-offset-white ring-gray-200'}`}
                        aria-expanded={menuOpen}
                        aria-controls="navbar-sticky"
                    >
                        <span className="sr-only">{menuOpen ? 'Close main menu' : 'Open main menu'}</span>
                        {menuOpen ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M1 1h15M1 7h15M1 13h15" />
                            </svg>
                        )}
                    </button>
                </div>

                <div className={`items-center ${menuOpen ? 'block' : 'hidden'} justify-between w-full md:flex md:w-auto md:order-1`} id="navbar-sticky">
                    <ul className={`flex flex-col md:gap-5 p-4 md:p-0 mt-4 font-bold rounded-lg md:space-x-6 rtl:space-x-reverse md:flex-row md:mt-0 text-center md:text-left
                        ${isDarkMode ? 'bg-black md:bg-transparent' : 'bg-white md:bg-transparent'}`}>

                        {navItems.map((item) => {
                            const isActive = currentPath === `/${item.path}` || (item.path === '' && currentPath === '/');

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={closeMenu}
                                        className={`block py-2 px-3 rounded md:p-0 relative group transition-all duration-300
                                            ${isActive
                                                ? isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                                                : isDarkMode ? 'text-white hover:text-cyan-400' : 'text-gray-700 hover:text-cyan-700'
                                            }`}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {item.label}
                                        <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 transition-all duration-600 md:duration-300 group-hover:w-full
                                            ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-700'}`}></span>
                                    </Link>
                                </li>
                            );
                        })}

                        <li>
                            {!isUserLoggedIn ? (
                                <Link
                                    to={'login'}
                                    onClick={closeMenu}
                                    className={`block py-2 px-3 rounded md:p-0 relative group transition-all duration-300
                                        ${currentPath === '/login'
                                            ? isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                                            : isDarkMode ? 'text-white hover:text-cyan-400' : 'text-gray-700 hover:text-cyan-700'
                                        }`}
                                    aria-current={currentPath === '/login' ? 'page' : undefined}
                                >
                                    SIGN IN
                                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 transition-all duration-600 md:duration-300 group-hover:w-full
                                        ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-700'}`}></span>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={logOut}
                                    className={`cursor-pointer font-extrabold text-sm transition-all duration-300 uppercase
                                        ${isDarkMode
                                            ? 'text-white hover:text-cyan-400'
                                            : 'text-gray-700 hover:text-cyan-700'}`}
                                    aria-label="Log out"
                                >
                                    LOGOUT
                                </button>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </>
}

export default memo(Navbar)
