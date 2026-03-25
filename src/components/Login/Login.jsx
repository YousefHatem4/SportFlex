import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { userContext } from '../../Context/userContext';
import { supabase } from '../../supabaseClient';
import {
    FaEye,
    FaEyeSlash,
    FaSpinner,
    FaEnvelope,
    FaLock,
    FaArrowRight,
    FaTshirt,
    FaShippingFast,
    FaShieldAlt,
    FaTags,
    FaExclamationTriangle
} from 'react-icons/fa';
import {
    loginValidationSchema,
    loginRateLimiter,
    sanitizeInput,
    generateCSRFToken,
    validateCSRFToken
} from '../../utils/security';

const FEATURES = [
    {
        id: 'feature-premium',
        icon: FaTshirt,
        title: 'Premium Sportswear',
        description: 'High-quality athletic apparel from top brands'
    },
    {
        id: 'feature-delivery',
        icon: FaShippingFast,
        title: 'Fast Delivery',
        description: 'Free shipping on orders over $50'
    },
    {
        id: 'feature-security',
        icon: FaShieldAlt,
        title: 'Secure Shopping',
        description: 'Your data is protected with bank-level security'
    },
    {
        id: 'feature-deals',
        icon: FaTags,
        title: 'Exclusive Deals',
        description: 'Member-only discounts and early access to sales'
    }
];

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SECURITY_TIP_DELAY_MS = 3000;

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

const SecurityTip = React.memo(function SecurityTip({ isDarkMode, onDismiss }) {
    return (
        <aside
            className={`fixed bottom-4 right-4 border rounded-lg p-4 shadow-2xl z-50 max-w-sm animate-slideIn transition-colors duration-300
                ${isDarkMode ? 'bg-gray-900 border-cyan-500' : 'bg-white border-cyan-600'}`}
            aria-label="Security tip"
        >
            <div className="flex items-start space-x-3">
                <FaShieldAlt
                    className={`text-xl flex-shrink-0 mt-1 transition-colors duration-300
                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                    aria-hidden="true"
                />
                <div>
                    <h2
                        className={`font-semibold mb-1 transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                    >
                        Security Tip
                    </h2>
                    <p
                        className={`text-sm transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                    >
                        Never share your password. We'll never ask for your password via email or phone.
                    </p>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className={`mt-2 text-xs transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-500 hover:text-cyan-400' : 'text-cyan-700 hover:text-cyan-800'}`}
                        aria-label="Dismiss security tip"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </aside>
    );
});

const FeatureCard = React.memo(function FeatureCard({ feature, isDarkMode }) {
    const IconComponent = feature.icon;

    return (
        <article
            className={`backdrop-blur-sm rounded-xl p-5 border hover:translate-y-[-2px] transition-all duration-300
                ${isDarkMode
                    ? 'bg-gray-800/50 border-cyan-500/30 hover:bg-gray-800/80 hover:border-cyan-500/50'
                    : 'bg-white/80 border-cyan-200 hover:bg-white hover:border-cyan-300'}`}
        >
            <div className="flex items-start space-x-4">
                <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                    aria-hidden="true"
                >
                    <div className="text-white">
                        <IconComponent className="h-6 w-6" aria-hidden="true" />
                    </div>
                </div>
                <div>
                    <h3
                        className={`font-semibold text-lg mb-1 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        {feature.title}
                    </h3>
                    <p
                        className={`text-sm transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                    >
                        {feature.description}
                    </p>
                </div>
            </div>
        </article>
    );
});

const ErrorAlert = React.memo(function ErrorAlert({ errorMessage, isDarkMode }) {
    if (!errorMessage) {
        return null;
    }

    return (
        <div
            className={`mb-6 border rounded-xl p-4 animate-fadeIn transition-colors duration-300
                ${isDarkMode
                    ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-500'
                    : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-400'}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                : 'bg-gradient-to-r from-red-600 to-pink-600'}`}
                        aria-hidden="true"
                    >
                        <FaExclamationTriangle className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                </div>
                <div className="ml-4">
                    <h2
                        className={`text-sm font-semibold transition-colors duration-300
                            ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}
                    >
                        Sign in failed
                    </h2>
                    <p
                        className={`text-sm mt-1 transition-colors duration-300
                            ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}
                    >
                        {errorMessage}
                    </p>
                </div>
            </div>
        </div>
    );
});

export default function Login() {
    const isDarkMode = useDarkModeState();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remainingAttempts, setRemainingAttempts] = useState(5);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [showSecurityTip, setShowSecurityTip] = useState(false);

    const navigate = useNavigate();
    const { setUserToken, setUser, checkAdminStatus } = useContext(userContext);

    useEffect(() => {
        document.title = 'Sign in - SportFlex Store';
        generateCSRFToken();

        const timerId = window.setTimeout(() => {
            setShowSecurityTip(true);
        }, SECURITY_TIP_DELAY_MS);

        return () => {
            window.clearTimeout(timerId);
        };
    }, []);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword((prev) => !prev);
    }, []);

    const dismissSecurityTip = useCallback(() => {
        setShowSecurityTip(false);
    }, []);

    const signIn = useCallback(
        async (values) => {
            try {
                const sanitizedEmail = sanitizeInput(values.email);
                const sanitizedPassword = sanitizeInput(values.password);

                const rateLimitCheck = loginRateLimiter.check(sanitizedEmail);
                setRemainingAttempts(rateLimitCheck.remaining);

                if (!rateLimitCheck.allowed) {
                    setLockoutTime(rateLimitCheck.resetTime);
                    throw new Error(
                        `Too many failed attempts. Please try again after ${rateLimitCheck.resetTime.toLocaleTimeString()}`
                    );
                }

                const csrfTokenData = sessionStorage.getItem('csrf_token');
                if (!csrfTokenData) {
                    throw new Error('Security validation failed. Please refresh the page.');
                }

                const { token } = JSON.parse(csrfTokenData);
                if (!validateCSRFToken(token)) {
                    throw new Error('Security validation failed. Please refresh the page.');
                }

                setIsLoading(true);
                setErrorMessage('');

                if (sanitizedEmail.includes('+') && !sanitizedEmail.endsWith('@gmail.com')) {
                    console.warn('Suspicious email pattern detected:', sanitizedEmail);
                }

                const { data, error } = await supabase.auth.signInWithPassword({
                    email: sanitizedEmail,
                    password: sanitizedPassword
                });

                if (error) {
                    loginRateLimiter.increment(sanitizedEmail);
                    throw error;
                }

                if (data.session) {
                    loginRateLimiter.reset(sanitizedEmail);

                    setUserToken(data.session.access_token);
                    setUser(data.user);

                    localStorage.setItem('userToken', data.session.access_token);
                    localStorage.setItem('userEmail', sanitizedEmail);
                    localStorage.setItem('loginTime', Date.now().toString());

                    const timeoutId = window.setTimeout(() => {
                        supabase.auth.signOut();
                        navigate('/login');
                    }, SESSION_TIMEOUT_MS);

                    sessionStorage.setItem('sessionTimeout', timeoutId.toString());

                    const isUserAdmin = await checkAdminStatus(data.user.id);

                    if (isUserAdmin) {
                        navigate('/admin');
                    } else {
                        navigate('/');
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                setErrorMessage(error.message || 'Login failed. Please check your credentials.');
            } finally {
                setIsLoading(false);
            }
        },
        [checkAdminStatus, navigate, setUser, setUserToken]
    );

    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        validationSchema: loginValidationSchema,
        onSubmit: signIn
    });

    const labelClass = useMemo(
        () =>
            `block text-sm font-semibold transition-colors duration-300 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
            }`,
        [isDarkMode]
    );

    const emailInputClass = useMemo(
        () =>
            `block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500 ${formik.touched.email && formik.errors.email
                ? 'border-red-500'
                : isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
            }`,
        [formik.errors.email, formik.touched.email, isDarkMode]
    );

    const passwordInputClass = useMemo(
        () =>
            `block w-full pl-10 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500 ${formik.touched.password && formik.errors.password
                ? 'border-red-500'
                : isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
            }`,
        [formik.errors.password, formik.touched.password, isDarkMode]
    );

    return (
        <main
            className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}
            aria-labelledby="login-heading"
        >
            {showSecurityTip && (
                <SecurityTip
                    isDarkMode={isDarkMode}
                    onDismiss={dismissSecurityTip}
                />
            )}

            <div
                className={`w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            >
                <section
                    className={`lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden border-r transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-800'
                            : 'bg-gradient-to-br from-gray-100 via-white to-gray-100 border-gray-200'}`}
                    aria-labelledby="brand-heading"
                >
                    <div className="absolute inset-0 opacity-10" aria-hidden="true">
                        <div
                            className={`absolute top-0 left-0 w-72 h-72 rounded-full blur-3xl transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                    : 'bg-gradient-to-r from-cyan-600 to-cyan-700'}`}
                        />
                        <div
                            className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}
                        />
                        <div
                            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-400 to-cyan-300'
                                    : 'bg-gradient-to-r from-cyan-600 to-cyan-500'}`}
                        />
                    </div>

                    <div className="relative z-10">
                        <header className="mb-12 text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start space-x-3 mb-6">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                                    aria-hidden="true"
                                >
                                    <span className="text-white font-bold text-xl">SF</span>
                                </div>
                                <div>
                                    <h1
                                        id="brand-heading"
                                        className={`text-3xl lg:text-4xl font-bold transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    >
                                        SportFlex
                                    </h1>
                                    <p
                                        className={`text-sm mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        Elite Sportswear Collection
                                    </p>
                                </div>
                            </div>
                            <p
                                className={`text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                            >
                                Access the world's finest athletic apparel. Elevate your performance with premium
                                sportswear designed for champions.
                            </p>
                        </header>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12" role="list" aria-label="Store features">
                            {FEATURES.map((feature) => (
                                <div key={feature.id} role="listitem">
                                    <FeatureCard feature={feature} isDarkMode={isDarkMode} />
                                </div>
                            ))}
                        </div>

                        <section
                            className={`backdrop-blur-sm rounded-2xl p-6 border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-500/30'
                                    : 'bg-gradient-to-r from-cyan-100/50 to-cyan-50/50 border-cyan-200'}`}
                            aria-label="Store statistics"
                        >
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div
                                        className={`text-2xl lg:text-3xl font-bold transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        50K+
                                    </div>
                                    <div
                                        className={`text-sm mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                    >
                                        Products
                                    </div>
                                </div>
                                <div>
                                    <div
                                        className={`text-2xl lg:text-3xl font-bold transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        120+
                                    </div>
                                    <div
                                        className={`text-sm mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                    >
                                        Brands
                                    </div>
                                </div>
                                <div>
                                    <div
                                        className={`text-2xl lg:text-3xl font-bold transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        24/7
                                    </div>
                                    <div
                                        className={`text-sm mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                    >
                                        Support
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div
                            className={`absolute bottom-6 left-6 opacity-20 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}
                            aria-hidden="true"
                        >
                            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div
                            className={`absolute top-6 right-6 opacity-20 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}
                            aria-hidden="true"
                        >
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                        </div>
                    </div>
                </section>

                <section
                    className={`lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center transition-colors duration-300
                        ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
                    aria-labelledby="login-heading"
                >
                    <div className="max-w-md mx-auto w-full">
                        <header className="text-center mb-10">
                            <h2
                                id="login-heading"
                                className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-3
                                    ${isDarkMode ? 'from-cyan-400 to-cyan-300' : 'from-cyan-700 to-cyan-600'}`}
                            >
                                Welcome Back
                            </h2>
                            <p
                                className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                Sign in to your SportFlex account
                            </p>
                        </header>

                        <ErrorAlert errorMessage={errorMessage} isDarkMode={isDarkMode} />

                        <div className="mb-4 text-xs text-center" aria-live="polite">
                            <span
                                className={`inline-flex items-center space-x-1 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                            >
                                <FaShieldAlt className="text-xs" aria-hidden="true" />
                                <span>256-bit SSL Encrypted</span>
                            </span>
                            <span
                                className={`mx-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                            >
                                •
                            </span>
                            <span
                                className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                            >
                                {remainingAttempts} attempts remaining
                            </span>
                            {lockoutTime && (
                                <>
                                    <span
                                        className={`mx-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        •
                                    </span>
                                    <span
                                        className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        Lockout until {lockoutTime.toLocaleTimeString()}
                                    </span>
                                </>
                            )}
                        </div>

                        <form className="space-y-6" onSubmit={formik.handleSubmit} noValidate>
                            <div className="group">
                                <label htmlFor="email" className={`${labelClass} mb-2`}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope
                                            className={`h-5 w-5 transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-gray-500 group-focus-within:text-cyan-400'
                                                    : 'text-gray-400 group-focus-within:text-cyan-700'}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={emailInputClass}
                                        placeholder="name@example.com"
                                        aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
                                        aria-describedby={
                                            formik.touched.email && formik.errors.email
                                                ? 'email-error'
                                                : undefined
                                        }
                                    />
                                </div>
                                {formik.touched.email && formik.errors.email && (
                                    <p id="email-error" className="mt-1 text-xs text-red-500">
                                        {formik.errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className={labelClass}>
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className={`text-xs transition-colors duration-300
                                            ${isDarkMode
                                                ? 'text-cyan-400 hover:text-cyan-300'
                                                : 'text-cyan-700 hover:text-cyan-800'}`}
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock
                                            className={`h-5 w-5 transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-gray-500 group-focus-within:text-cyan-400'
                                                    : 'text-gray-400 group-focus-within:text-cyan-700'}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={passwordInputClass}
                                        placeholder="Enter your password"
                                        aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
                                        aria-describedby={
                                            formik.touched.password && formik.errors.password
                                                ? 'password-error'
                                                : undefined
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                    >
                                        {showPassword ? (
                                            <FaEye
                                                className={`h-5 w-5 transition-colors duration-300
                                                    ${isDarkMode
                                                        ? 'text-gray-500 hover:text-cyan-400'
                                                        : 'text-gray-400 hover:text-cyan-700'}`}
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <FaEyeSlash
                                                className={`h-5 w-5 transition-colors duration-300
                                                    ${isDarkMode
                                                        ? 'text-gray-500 hover:text-cyan-400'
                                                        : 'text-gray-400 hover:text-cyan-700'}`}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                </div>
                                {formik.touched.password && formik.errors.password && (
                                    <p id="password-error" className="mt-1 text-xs text-red-500">
                                        {formik.errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className={`h-4 w-4 rounded focus:ring-2 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'text-cyan-500 focus:ring-cyan-500 border-gray-700 bg-gray-800'
                                            : 'text-cyan-700 focus:ring-cyan-600 border-gray-300 bg-white'}`}
                                />
                                <label
                                    htmlFor="remember-me"
                                    className={`ml-2 block text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
                                >
                                    Remember me on this device
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || remainingAttempts === 0}
                                className={`w-full py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                aria-label={isLoading ? 'Signing in' : 'Sign in'}
                            >
                                <div className="flex items-center justify-center">
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin h-5 w-5 text-white mr-3" aria-hidden="true" />
                                            <span className="text-white font-semibold">Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-white font-semibold text-lg">Sign In</span>
                                            <FaArrowRight
                                                className="ml-3 h-5 w-5 text-white transform group-hover:translate-x-1 transition-transform"
                                                aria-hidden="true"
                                            />
                                        </>
                                    )}
                                </div>
                            </button>

                            <div
                                className={`text-center mt-8 pt-6 border-t transition-colors duration-300
                                    ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                            >
                                <p
                                    className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                    Don't have an account?{' '}
                                    <Link
                                        to="/register"
                                        className={`font-semibold bg-gradient-to-r bg-clip-text text-transparent hover:from-cyan-300 hover:to-cyan-200 transition-all inline-flex items-center
                                            ${isDarkMode
                                                ? 'from-cyan-400 to-cyan-300'
                                                : 'from-cyan-700 to-cyan-600'}`}
                                    >
                                        Create account
                                        <FaArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </p>
                            </div>
                        </form>

                        <div className="mt-6 flex items-center justify-center space-x-4" aria-label="Security compliance badges">
                            <div className="flex items-center space-x-1">
                                <FaShieldAlt
                                    className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    aria-hidden="true"
                                />
                                <span
                                    className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}
                                >
                                    2FA Available
                                </span>
                            </div>
                            <div
                                className={`w-px h-4 transition-colors duration-300
                                    ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                                aria-hidden="true"
                            />
                            <div className="flex items-center space-x-1">
                                <span
                                    className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}
                                >
                                    GDPR Compliant
                                </span>
                            </div>
                            <div
                                className={`w-px h-4 transition-colors duration-300
                                    ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                                aria-hidden="true"
                            />
                            <div className="flex items-center space-x-1">
                                <span
                                    className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}
                                >
                                    PCI DSS
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 text-center">
                            <p
                                className={`text-xs transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}
                            >
                                By signing in, you agree to our{' '}
                                <Link
                                    to="/terms"
                                    className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                >
                                    Terms
                                </Link>{' '}
                                and{' '}
                                <Link
                                    to="/privacy"
                                    className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                >
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}