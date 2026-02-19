// src/components/Register/Register.jsx
import React, { useContext, useState, useEffect } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import { userContext } from '../../Context/userContext'
import { supabase } from '../../supabaseClient'
import {
    FaSpinner,
    FaEnvelope,
    FaLock,
    FaArrowRight,
    FaUser,
    FaPhone,
    FaCheck,
    FaShieldAlt,
    FaGift,
    FaTruck,
    FaStar,
    FaExclamationTriangle,
    FaInfoCircle
} from 'react-icons/fa'
import {
    registerValidationSchema,
    registerRateLimiter,
    sanitizeInput,
    validatePasswordStrength,
    generateCSRFToken,
    validateCSRFToken
} from '../../utils/security'

export default function Register() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [remainingAttempts, setRemainingAttempts] = useState(3);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

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

    useEffect(() => {
        document.title = 'Create Account - SportFlex Store';
        generateCSRFToken();
    }, []);

    let navigate = useNavigate();
    let { setUserToken, setUser } = useContext(userContext);

    async function signUp(values) {
        try {
            const sanitizedName = sanitizeInput(values.name);
            const sanitizedEmail = sanitizeInput(values.email);
            const sanitizedPhone = sanitizeInput(values.phone);
            const sanitizedPassword = sanitizeInput(values.password);
            const sanitizedRePassword = sanitizeInput(values.rePassword);

            const rateLimitCheck = registerRateLimiter.check(sanitizedEmail);
            setRemainingAttempts(rateLimitCheck.remaining);

            if (!rateLimitCheck.allowed) {
                setLockoutTime(rateLimitCheck.resetTime);
                throw new Error(`Too many registration attempts. Please try again after ${rateLimitCheck.resetTime.toLocaleTimeString()}`);
            }

            const csrfTokenData = sessionStorage.getItem('csrf_token');
            if (!csrfTokenData) {
                throw new Error('Security validation failed. Please refresh the page.');
            }

            const { token } = JSON.parse(csrfTokenData);
            if (!validateCSRFToken(token)) {
                throw new Error('Security validation failed. Please refresh the page.');
            }

            const strengthCheck = validatePasswordStrength(sanitizedPassword);
            setPasswordStrength(strengthCheck);
            if (!strengthCheck.isValid) {
                throw new Error(strengthCheck.message);
            }

            if (sanitizedPassword !== sanitizedRePassword) {
                throw new Error("Passwords don't match");
            }

            const disposableDomains = [
                'tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com',
                'sharklasers.com', 'grr.la', 'yopmail.com', '10minutemail.com',
                'temp-mail.org', 'fakeinbox.com', 'maildrop.cc', 'getairmail.com',
                'trashmail.com', 'spambox.us', 'mailcatch.com', 'tempinbox.com'
            ];

            const emailDomain = sanitizedEmail.split('@')[1]?.toLowerCase();
            if (disposableDomains.includes(emailDomain)) {
                throw new Error('Please use a permanent email address. Disposable email addresses are not allowed.');
            }

            const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
            if (commonDomains.includes(emailDomain)) {
                const localPart = sanitizedEmail.split('@')[0];
                if (localPart.length < 3) {
                    throw new Error('Email local part must be at least 3 characters');
                }
            }

            setIsLoading(true);
            setErrorMessage('');

            const { data, error } = await supabase.auth.signUp({
                email: sanitizedEmail,
                password: sanitizedPassword,
                options: {
                    data: {
                        full_name: sanitizedName,
                        phone: sanitizedPhone,
                        created_at: new Date().toISOString(),
                        last_login_ip: null,
                        account_status: 'pending_verification',
                        registration_date: new Date().toISOString(),
                        preferred_language: navigator.language || 'en'
                    }
                }
            });

            if (error) {
                registerRateLimiter.increment(sanitizedEmail);
                throw error;
            }

            if (data.session) {
                setUserToken(data.session.access_token);
                setUser(data.user);
                localStorage.setItem('userToken', data.session.access_token);
                localStorage.setItem('userEmail', sanitizedEmail);
                localStorage.setItem('registrationTime', Date.now().toString());

                setSuccessMessage('Registration successful! Welcome to SportFlex!');

                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setSuccessMessage('Registration successful! Please check your email to confirm your account. The verification link will expire in 24 hours.');

                console.log('New user registration:', sanitizedEmail, ' - Email confirmation sent');

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }

            registerRateLimiter.reset(sanitizedEmail);

        } catch (error) {
            console.error('Registration error:', error);
            setErrorMessage(error.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            password: "",
            rePassword: "",
            phone: "",
        },
        validationSchema: registerValidationSchema,
        onSubmit: signUp
    });

    const handlePasswordChange = (e) => {
        formik.handleChange(e);
        const strength = validatePasswordStrength(e.target.value);
        setPasswordStrength(strength);
    };

    const getPasswordStrengthColor = () => {
        if (!passwordStrength) return isDarkMode ? 'bg-gray-700' : 'bg-gray-300';
        const score = passwordStrength.strengthScore;
        if (score < 4) return 'bg-red-500';
        if (score < 6) return 'bg-yellow-500';
        if (score < 8) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        if (!passwordStrength) return 'Enter a password';
        const score = passwordStrength.strengthScore;
        if (score < 4) return 'Weak';
        if (score < 6) return 'Fair';
        if (score < 8) return 'Good';
        return 'Strong';
    };

    const benefits = [
        {
            icon: <FaGift className="h-5 w-5" />,
            title: "Welcome Gift",
            description: "Get 15% off your first order"
        },
        {
            icon: <FaTruck className="h-5 w-5" />,
            title: "Free Shipping",
            description: "On all orders over $50"
        },
        {
            icon: <FaStar className="h-5 w-5" />,
            title: "Exclusive Access",
            description: "Early access to new collections"
        },
        {
            icon: <FaShieldAlt className="h-5 w-5" />,
            title: "Secure Account",
            description: "Bank-level security protection"
        }
    ];

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>

            {/* Password Requirements Modal */}
            {showPasswordRequirements && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-2xl p-6 max-w-md border transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gray-900 border-cyan-500'
                            : 'bg-white border-cyan-600'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-xl font-bold transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                Password Requirements
                            </h3>
                            <button
                                onClick={() => setShowPasswordRequirements(false)}
                                className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                ✕
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {[
                                "At least 8 characters long",
                                "At least one uppercase letter (A-Z)",
                                "At least one lowercase letter (a-z)",
                                "At least one number (0-9)",
                                "At least one special character (!@#$%^&*)",
                                "No common passwords or patterns",
                                "No sequential characters (123, abc)",
                                "No repeated characters (aaa, 111)"
                            ].map((item, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                    <FaCheck className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                    <span className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setShowPasswordRequirements(false)}
                            className={`w-full mt-6 py-3 text-white font-semibold rounded-xl transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className={`w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl border transition-colors duration-300
                ${isDarkMode
                    ? 'bg-gray-900 border-gray-800'
                    : 'bg-white border-gray-200'}`}>

                {/* Left Info Section */}
                <div className={`lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden border-r transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-800'
                        : 'bg-gradient-to-br from-gray-100 via-white to-gray-100 border-gray-200'}`}>

                    {/* Abstract Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                : 'bg-gradient-to-r from-cyan-600 to-cyan-700'}`}>
                        </div>
                        <div className={`absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                        </div>
                        <div className={`absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-400 to-cyan-300'
                                : 'bg-gradient-to-r from-cyan-600 to-cyan-500'}`}>
                        </div>
                    </div>

                    <div className="relative z-10">
                        {/* Brand Section */}
                        <div className="mb-10 text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start space-x-3 mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                    <span className="text-white font-bold text-xl">SF</span>
                                </div>
                                <div>
                                    <h1 className={`text-3xl lg:text-4xl font-bold transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Join SportFlex
                                    </h1>
                                    <p className={`text-sm mt-1 transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                        Start Your Fitness Journey
                                    </p>
                                </div>
                            </div>
                            <p className={`text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                Create your account today and unlock exclusive benefits, personalized recommendations, and premium sportswear collections tailored just for you.
                            </p>
                        </div>

                        {/* Benefits Section */}
                        <div className="mb-10">
                            <h2 className={`text-2xl font-bold mb-6 text-center lg:text-left transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Why Join SportFlex?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className={`backdrop-blur-sm rounded-xl p-4 border transition-all duration-300
                                            ${isDarkMode
                                                ? 'bg-gray-800/50 border-cyan-500/30 hover:bg-gray-800/80 hover:border-cyan-500/50'
                                                : 'bg-white/80 border-cyan-200 hover:bg-white hover:border-cyan-300'}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                                <div className="text-white">
                                                    {benefit.icon}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {benefit.title}
                                                </h3>
                                                <p className={`text-xs mt-0.5 transition-colors duration-300
                                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                                    {benefit.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Registration Steps */}
                        <div className={`backdrop-blur-sm rounded-2xl p-6 border transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-500/30'
                                : 'bg-gradient-to-r from-cyan-100/50 to-cyan-50/50 border-cyan-200'}`}>
                            <h3 className={`font-semibold text-lg mb-4 text-center lg:text-left transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Quick & Easy Setup
                            </h3>
                            <div className="flex items-center justify-center lg:justify-start space-x-6">
                                <div className="text-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                        <span className="text-white font-bold">1</span>
                                    </div>
                                    <span className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                        Register
                                    </span>
                                </div>
                                <div className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                    <FaArrowRight />
                                </div>
                                <div className="text-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <span className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                        Verify
                                    </span>
                                </div>
                                <div className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                    <FaArrowRight />
                                </div>
                                <div className="text-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                        <span className="text-white font-bold">3</span>
                                    </div>
                                    <span className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                        Shop
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-6 flex items-center justify-center lg:justify-start space-x-4">
                            <div className="flex items-center space-x-1">
                                <FaShieldAlt className={`text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                <span className={`text-xs transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                    256-bit SSL
                                </span>
                            </div>
                            <div className={`w-px h-4 transition-colors duration-300
                                ${isDarkMode ? 'bg-cyan-800' : 'bg-cyan-200'}`}></div>
                            <div className="flex items-center space-x-1">
                                <span className={`text-xs transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                    GDPR
                                </span>
                            </div>
                            <div className={`w-px h-4 transition-colors duration-300
                                ${isDarkMode ? 'bg-cyan-800' : 'bg-cyan-200'}`}></div>
                            <div className="flex items-center space-x-1">
                                <span className={`text-xs transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                    PCI DSS
                                </span>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className={`absolute bottom-8 right-8 opacity-20 transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}>
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className={`lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                    <div className="max-w-md mx-auto w-full">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-3
                                ${isDarkMode
                                    ? 'from-cyan-400 to-cyan-300'
                                    : 'from-cyan-700 to-cyan-600'}`}>
                                Create Account
                            </h2>
                            <p className={`transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Fill in your details to get started
                            </p>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className={`mb-6 border rounded-xl p-4 animate-fadeIn transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-500'
                                    : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-400'}`}>
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                                : 'bg-gradient-to-r from-red-600 to-pink-600'}`}>
                                            <FaExclamationTriangle className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className={`text-sm font-semibold transition-colors duration-300
                                            ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                                            Registration failed
                                        </h3>
                                        <p className={`text-sm mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                                            {errorMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className={`mb-6 border rounded-xl p-4 animate-fadeIn transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500'
                                    : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400'}`}>
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}>
                                            <FaCheck className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className={`text-sm font-semibold transition-colors duration-300
                                            ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                            Success!
                                        </h3>
                                        <p className={`text-sm mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                            {successMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Notice */}
                        <div className="mb-4 text-xs text-center">
                            <span className={`inline-flex items-center space-x-1 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                <FaShieldAlt className="text-xs" />
                                <span>All data encrypted</span>
                            </span>
                            <span className={`mx-2 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>•</span>
                            <span className={`transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                {remainingAttempts} attempts remaining
                            </span>
                            {lockoutTime && (
                                <>
                                    <span className={`mx-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>•</span>
                                    <span className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                        Lockout until {lockoutTime.toLocaleTimeString()}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Form */}
                        <form className="space-y-5" onSubmit={formik.handleSubmit}>
                            {/* Name Input */}
                            <div className="group">
                                <label htmlFor="name" className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaUser className={`h-5 w-5 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-700'}`} />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={`block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500
                                            ${formik.touched.name && formik.errors.name
                                                ? 'border-red-500'
                                                : isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
                                            }`}
                                        placeholder="John Doe"
                                    />
                                </div>
                                {formik.touched.name && formik.errors.name && (
                                    <p className="mt-1 text-xs text-red-500">{formik.errors.name}</p>
                                )}
                            </div>

                            {/* Email Input */}
                            <div className="group">
                                <label htmlFor="email" className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className={`h-5 w-5 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-700'}`} />
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
                                        className={`block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500
                                            ${formik.touched.email && formik.errors.email
                                                ? 'border-red-500'
                                                : isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
                                            }`}
                                        placeholder="name@example.com"
                                    />
                                </div>
                                {formik.touched.email && formik.errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
                                )}
                            </div>

                            {/* Phone Input */}
                            <div className="group">
                                <label htmlFor="phone" className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaPhone className={`h-5 w-5 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-700'}`} />
                                    </div>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={formik.values.phone}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={`block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500
                                            ${formik.touched.phone && formik.errors.phone
                                                ? 'border-red-500'
                                                : isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
                                            }`}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                {formik.touched.phone && formik.errors.phone && (
                                    <p className="mt-1 text-xs text-red-500">{formik.errors.phone}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className={`block text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordRequirements(true)}
                                        className={`text-xs flex items-center space-x-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                    >
                                        <FaInfoCircle className="text-xs" />
                                        <span>Requirements</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className={`h-5 w-5 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-700'}`} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={formik.values.password}
                                        onChange={handlePasswordChange}
                                        onBlur={formik.handleBlur}
                                        className={`block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500
                                            ${formik.touched.password && formik.errors.password
                                                ? 'border-red-500'
                                                : isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
                                            }`}
                                        placeholder="Create a strong password"
                                    />
                                </div>
                                {formik.touched.password && formik.errors.password && (
                                    <p className="mt-1 text-xs text-red-500">{formik.errors.password}</p>
                                )}

                                {/* Password strength meter */}
                                {formik.values.password && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs transition-colors duration-300
                                                ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                                Password strength:
                                            </span>
                                            <span className={`text-xs font-semibold
                                                ${!passwordStrength ? (isDarkMode ? 'text-gray-400' : 'text-gray-600') :
                                                    passwordStrength?.strengthScore < 4 ? 'text-red-500' :
                                                        passwordStrength?.strengthScore < 6 ? 'text-yellow-500' :
                                                            passwordStrength?.strengthScore < 8 ? 'text-blue-500' :
                                                                'text-green-500'}`}>
                                                {getPasswordStrengthText()}
                                            </span>
                                        </div>
                                        <div className={`h-2 w-full rounded-full overflow-hidden transition-colors duration-300
                                            ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <div
                                                className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                                                style={{ width: `${(passwordStrength?.strengthScore || 0) * 10}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-2 grid grid-cols-4 gap-1">
                                            {Object.entries(passwordStrength?.checks || {}).slice(0, 4).map(([key, value], index) => (
                                                <div key={index} className="text-center">
                                                    <div className={`text-[10px] ${value ? 'text-green-500' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div className="group">
                                <label htmlFor="rePassword" className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className={`h-5 w-5 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-700'}`} />
                                    </div>
                                    <input
                                        id="rePassword"
                                        name="rePassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={formik.values.rePassword}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={`block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500
                                            ${formik.touched.rePassword && formik.errors.rePassword
                                                ? 'border-red-500'
                                                : isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
                                            }`}
                                        placeholder="Confirm your password"
                                    />
                                </div>
                                {formik.touched.rePassword && formik.errors.rePassword && (
                                    <p className="mt-1 text-xs text-red-500">{formik.errors.rePassword}</p>
                                )}
                                {formik.values.password && formik.values.rePassword && formik.values.password === formik.values.rePassword && (
                                    <p className="mt-1 text-xs text-green-500 flex items-center">
                                        <FaCheck className="mr-1 text-xs" /> Passwords match
                                    </p>
                                )}
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start space-x-3 pt-2">
                                <input
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    required
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className={`h-4 w-4 rounded focus:ring-2 mt-1 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'text-cyan-500 focus:ring-cyan-500 border-gray-700 bg-gray-800'
                                            : 'text-cyan-700 focus:ring-cyan-600 border-gray-300 bg-white'}`}
                                />
                                <label htmlFor="terms" className={`text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                    I agree to the{' '}
                                    <Link to="/terms" className={`font-medium transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}>
                                        Terms of Service
                                    </Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" className={`font-medium transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}>
                                        Privacy Policy
                                    </Link>
                                    {' '}and confirm I am at least 18 years old.
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || remainingAttempts === 0 || !acceptedTerms}
                                className={`w-full py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group mt-2
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                            >
                                <div className="flex items-center justify-center">
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin h-5 w-5 text-white mr-3" />
                                            <span className="text-white font-semibold">Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-white font-semibold text-lg">Create Account</span>
                                            <FaArrowRight className="ml-3 h-5 w-5 text-white transform group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Already have account */}
                            <div className={`text-center pt-6 border-t mt-6 transition-colors duration-300
                                ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <p className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className={`font-semibold bg-gradient-to-r bg-clip-text text-transparent hover:from-cyan-300 hover:to-cyan-200 transition-all inline-flex items-center
                                            ${isDarkMode
                                                ? 'from-cyan-400 to-cyan-300'
                                                : 'from-cyan-700 to-cyan-600'}`}
                                    >
                                        Sign in now
                                        <FaArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </p>
                            </div>
                        </form>

                        {/* Additional Security Info */}
                        <div className={`mt-6 p-4 rounded-xl border transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-500/30'
                                : 'bg-gradient-to-r from-cyan-100/50 to-cyan-50/50 border-cyan-200'}`}>
                            <div className="flex items-start space-x-3">
                                <FaShieldAlt className={`h-5 w-5 mt-0.5 flex-shrink-0 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                <div>
                                    <p className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                        <span className="font-semibold">Your security is our priority.</span> We use bank-level encryption to protect your personal information. All data is encrypted before transmission.
                                    </p>
                                    <div className="mt-2 flex items-center space-x-4 text-xs">
                                        <span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}>✓ 256-bit SSL</span>
                                        <span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}>✓ 2FA Ready</span>
                                        <span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}>✓ GDPR Compliant</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Anti-Bot Measures */}
                        <div className={`mt-4 text-xs text-center transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}>
                            Protected by advanced security systems • Google reCAPTCHA may be used
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}