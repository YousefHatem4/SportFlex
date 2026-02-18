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
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [remainingAttempts, setRemainingAttempts] = useState(3);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    useEffect(() => {
        document.title = 'Create Account - SportFlex Store';
        generateCSRFToken();
    }, []);

    let navigate = useNavigate();
    let { setUserToken, setUser } = useContext(userContext);

    async function signUp(values) {
        try {
            // Sanitize all inputs
            const sanitizedName = sanitizeInput(values.name);
            const sanitizedEmail = sanitizeInput(values.email);
            const sanitizedPhone = sanitizeInput(values.phone);
            const sanitizedPassword = sanitizeInput(values.password);
            const sanitizedRePassword = sanitizeInput(values.rePassword);

            // Check rate limiting
            const rateLimitCheck = registerRateLimiter.check(sanitizedEmail);
            setRemainingAttempts(rateLimitCheck.remaining);

            if (!rateLimitCheck.allowed) {
                setLockoutTime(rateLimitCheck.resetTime);
                throw new Error(`Too many registration attempts. Please try again after ${rateLimitCheck.resetTime.toLocaleTimeString()}`);
            }

            // Validate CSRF token
            const csrfTokenData = sessionStorage.getItem('csrf_token');
            if (!csrfTokenData) {
                throw new Error('Security validation failed. Please refresh the page.');
            }

            const { token } = JSON.parse(csrfTokenData);
            if (!validateCSRFToken(token)) {
                throw new Error('Security validation failed. Please refresh the page.');
            }

            // Password strength validation
            const strengthCheck = validatePasswordStrength(sanitizedPassword);
            setPasswordStrength(strengthCheck);
            if (!strengthCheck.isValid) {
                throw new Error(strengthCheck.message);
            }

            // Check if passwords match
            if (sanitizedPassword !== sanitizedRePassword) {
                throw new Error("Passwords don't match");
            }

            // Additional security: Check for disposable email domains
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

            // Check for common email typos
            const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
            if (commonDomains.includes(emailDomain)) {
                // Additional validation for common domains
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
                // Auto login after registration
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
                // Email confirmation required
                setSuccessMessage('Registration successful! Please check your email to confirm your account. The verification link will expire in 24 hours.');

                // Log registration for security monitoring
                console.log('New user registration:', sanitizedEmail, ' - Email confirmation sent');

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }

            // Reset rate limiter on successful registration
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

    // Update password strength on change
    const handlePasswordChange = (e) => {
        formik.handleChange(e);
        const strength = validatePasswordStrength(e.target.value);
        setPasswordStrength(strength);
    };

    // Get password strength color
    const getPasswordStrengthColor = () => {
        if (!passwordStrength) return 'bg-gray-700';
        const score = passwordStrength.strengthScore;
        if (score < 4) return 'bg-red-500';
        if (score < 6) return 'bg-yellow-500';
        if (score < 8) return 'bg-blue-500';
        return 'bg-green-500';
    };

    // Get password strength text
    const getPasswordStrengthText = () => {
        if (!passwordStrength) return 'Enter a password';
        const score = passwordStrength.strengthScore;
        if (score < 4) return 'Weak';
        if (score < 6) return 'Fair';
        if (score < 8) return 'Good';
        return 'Strong';
    };

    // Registration benefits
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
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Password Requirements Modal */}
            {showPasswordRequirements && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-md border border-cyan-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-cyan-400">Password Requirements</h3>
                            <button
                                onClick={() => setShowPasswordRequirements(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <ul className="space-y-2 text-cyan-300">
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>At least 8 characters long</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>At least one uppercase letter (A-Z)</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>At least one lowercase letter (a-z)</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>At least one number (0-9)</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>At least one special character (!@#$%^&*)</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>No common passwords or patterns</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>No sequential characters (123, abc)</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaCheck className="text-green-400 text-sm" />
                                <span>No repeated characters (aaa, 111)</span>
                            </li>
                        </ul>
                        <button
                            onClick={() => setShowPasswordRequirements(false)}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl text-white font-semibold"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl bg-gray-900 border border-gray-800">

                {/* Left Info Section */}
                <div className="lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden border-r border-gray-800">
                    {/* Abstract Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                        {/* Brand Section */}
                        <div className="mb-10 text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start space-x-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">SF</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white">Join SportFlex</h1>
                                    <p className="text-cyan-400 text-sm mt-1">Start Your Fitness Journey</p>
                                </div>
                            </div>
                            <p className="text-cyan-300 text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Create your account today and unlock exclusive benefits, personalized recommendations, and premium sportswear collections tailored just for you.
                            </p>
                        </div>

                        {/* Benefits Section */}
                        <div className="mb-10">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center lg:text-left">Why Join SportFlex?</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30 hover:bg-gray-800/80 hover:border-cyan-500/50 transition-all duration-300"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center">
                                                <div className="text-white">
                                                    {benefit.icon}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold text-sm">{benefit.title}</h3>
                                                <p className="text-cyan-300 text-xs mt-0.5">{benefit.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Registration Steps */}
                        <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                            <h3 className="text-white font-semibold text-lg mb-4 text-center lg:text-left">Quick & Easy Setup</h3>
                            <div className="flex items-center justify-center lg:justify-start space-x-6">
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-2">
                                        <span className="text-white font-bold">1</span>
                                    </div>
                                    <span className="text-cyan-300 text-xs">Register</span>
                                </div>
                                <div className="text-cyan-300">
                                    <FaArrowRight />
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-2">
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <span className="text-cyan-300 text-xs">Verify</span>
                                </div>
                                <div className="text-cyan-300">
                                    <FaArrowRight />
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-2">
                                        <span className="text-white font-bold">3</span>
                                    </div>
                                    <span className="text-cyan-300 text-xs">Shop</span>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-6 flex items-center justify-center lg:justify-start space-x-4">
                            <div className="flex items-center space-x-1">
                                <FaShieldAlt className="text-cyan-400 text-sm" />
                                <span className="text-xs text-cyan-300">256-bit SSL</span>
                            </div>
                            <div className="w-px h-4 bg-cyan-800"></div>
                            <div className="flex items-center space-x-1">
                                <span className="text-xs text-cyan-300">GDPR</span>
                            </div>
                            <div className="w-px h-4 bg-cyan-800"></div>
                            <div className="flex items-center space-x-1">
                                <span className="text-xs text-cyan-300">PCI DSS</span>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute bottom-8 right-8 opacity-20">
                            <svg className="w-16 h-16 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent mb-3">
                                Create Account
                            </h2>
                            <p className="text-gray-400">
                                Fill in your details to get started
                            </p>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-6 bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500 rounded-xl p-4 animate-fadeIn">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                                            <FaExclamationTriangle className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-semibold text-red-400">Registration failed</h3>
                                        <p className="text-sm text-red-300 mt-1">{errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="mb-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500 rounded-xl p-4 animate-fadeIn">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                            <FaCheck className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-semibold text-green-400">Success!</h3>
                                        <p className="text-sm text-green-300 mt-1">{successMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Notice */}
                        <div className="mb-4 text-xs text-cyan-400 text-center">
                            <span className="inline-flex items-center space-x-1">
                                <FaShieldAlt className="text-xs" />
                                <span>All data encrypted</span>
                            </span>
                            <span className="mx-2">•</span>
                            <span>{remainingAttempts} attempts remaining</span>
                            {lockoutTime && (
                                <>
                                    <span className="mx-2">•</span>
                                    <span>Lockout until {lockoutTime.toLocaleTimeString()}</span>
                                </>
                            )}
                        </div>

                        {/* Form */}
                        <form className="space-y-5" onSubmit={formik.handleSubmit}>
                            {/* Name Input */}
                            <div className="group">
                                <label htmlFor="name" className="block text-sm font-semibold text-cyan-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaUser className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
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
                                        className={`block w-full pl-10 pr-4 py-3.5 bg-gray-800 border ${formik.touched.name && formik.errors.name ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500`}
                                        placeholder="John Doe"
                                    />
                                </div>
                                {formik.touched.name && formik.errors.name && (
                                    <p className="mt-1 text-xs text-red-400">{formik.errors.name}</p>
                                )}
                            </div>

                            {/* Email Input */}
                            <div className="group">
                                <label htmlFor="email" className="block text-sm font-semibold text-cyan-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
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
                                        className={`block w-full pl-10 pr-4 py-3.5 bg-gray-800 border ${formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500`}
                                        placeholder="name@example.com"
                                    />
                                </div>
                                {formik.touched.email && formik.errors.email && (
                                    <p className="mt-1 text-xs text-red-400">{formik.errors.email}</p>
                                )}
                            </div>

                            {/* Phone Input */}
                            <div className="group">
                                <label htmlFor="phone" className="block text-sm font-semibold text-cyan-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaPhone className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
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
                                        className={`block w-full pl-10 pr-4 py-3.5 bg-gray-800 border ${formik.touched.phone && formik.errors.phone ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500`}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                {formik.touched.phone && formik.errors.phone && (
                                    <p className="mt-1 text-xs text-red-400">{formik.errors.phone}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-cyan-300">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordRequirements(true)}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                                    >
                                        <FaInfoCircle className="text-xs" />
                                        <span>Requirements</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
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
                                        className={`block w-full pl-10 pr-4 py-3.5 bg-gray-800 border ${formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500`}
                                        placeholder="Create a strong password"
                                    />
                                </div>
                                {formik.touched.password && formik.errors.password && (
                                    <p className="mt-1 text-xs text-red-400">{formik.errors.password}</p>
                                )}

                                {/* Password strength meter */}
                                {formik.values.password && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-cyan-300">Password strength:</span>
                                            <span className={`text-xs font-semibold ${passwordStrength?.strengthScore < 4 ? 'text-red-400' :
                                                    passwordStrength?.strengthScore < 6 ? 'text-yellow-400' :
                                                        passwordStrength?.strengthScore < 8 ? 'text-blue-400' :
                                                            'text-green-400'
                                                }`}>
                                                {getPasswordStrengthText()}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                                                style={{ width: `${(passwordStrength?.strengthScore || 0) * 10}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-2 grid grid-cols-4 gap-1">
                                            {Object.entries(passwordStrength?.checks || {}).slice(0, 4).map(([key, value], index) => (
                                                <div key={index} className="text-center">
                                                    <div className={`text-[10px] ${value ? 'text-green-400' : 'text-gray-500'}`}>
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
                                <label htmlFor="rePassword" className="block text-sm font-semibold text-cyan-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
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
                                        className={`block w-full pl-10 pr-4 py-3.5 bg-gray-800 border ${formik.touched.rePassword && formik.errors.rePassword ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500`}
                                        placeholder="Confirm your password"
                                    />
                                </div>
                                {formik.touched.rePassword && formik.errors.rePassword && (
                                    <p className="mt-1 text-xs text-red-400">{formik.errors.rePassword}</p>
                                )}
                                {formik.values.password && formik.values.rePassword && formik.values.password === formik.values.rePassword && (
                                    <p className="mt-1 text-xs text-green-400 flex items-center">
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
                                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-700 bg-gray-800 rounded mt-1"
                                />
                                <label htmlFor="terms" className="text-sm text-cyan-300">
                                    I agree to the{' '}
                                    <Link to="/terms" className="text-cyan-400 hover:text-cyan-300 font-medium">
                                        Terms of Service
                                    </Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300 font-medium">
                                        Privacy Policy
                                    </Link>
                                    {' '}and confirm I am at least 18 years old.
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || remainingAttempts === 0 || !acceptedTerms}
                                className="w-full py-4 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
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
                            <div className="text-center pt-6 border-t border-gray-800 mt-6">
                                <p className="text-gray-400">
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className="font-semibold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent hover:from-cyan-300 hover:to-cyan-200 transition-all inline-flex items-center"
                                    >
                                        Sign in now
                                        <FaArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </p>
                            </div>
                        </form>

                        {/* Additional Security Info */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 rounded-xl border border-cyan-500/30">
                            <div className="flex items-start space-x-3">
                                <FaShieldAlt className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-cyan-300">
                                        <span className="font-semibold">Your security is our priority.</span> We use bank-level encryption to protect your personal information. All data is encrypted before transmission.
                                    </p>
                                    <div className="mt-2 flex items-center space-x-4 text-xs text-cyan-400">
                                        <span>✓ 256-bit SSL</span>
                                        <span>✓ 2FA Ready</span>
                                        <span>✓ GDPR Compliant</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Anti-Bot Measures */}
                        <div className="mt-4 text-xs text-center text-cyan-500">
                            Protected by advanced security systems • Google reCAPTCHA may be used
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}