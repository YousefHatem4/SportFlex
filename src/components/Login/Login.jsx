// src/components/Login/Login.jsx
import React, { useContext, useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import { userContext } from '../../Context/userContext'
import { supabase } from '../../supabaseClient'
import { FaEye, FaEyeSlash, FaSpinner, FaEnvelope, FaLock, FaArrowRight, FaTshirt, FaShippingFast, FaShieldAlt, FaTags } from 'react-icons/fa'

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        document.title = 'Sign in - SportFlex Store'
    }, [])

    let navigate = useNavigate();
    let { setUserToken, setUser, isAdmin } = useContext(userContext);

    async function signIn(values) {
        try {
            setIsLoading(true);
            setErrorMessage('');

            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) throw error;

            if (data.session) {
                setUserToken(data.session.access_token);
                setUser(data.user);
                localStorage.setItem('userToken', data.session.access_token);

                // Check if admin and redirect accordingly
                if (values.email === 'yousef.hatem.developer@gmail.com') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.log('Login error:', error);
            setErrorMessage(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    }

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        onSubmit: signIn
    })

    // SportFlex features data
    const features = [
        {
            icon: <FaTshirt className="h-6 w-6" />,
            title: "Premium Sportswear",
            description: "High-quality athletic apparel from top brands"
        },
        {
            icon: <FaShippingFast className="h-6 w-6" />,
            title: "Fast Delivery",
            description: "Free shipping on orders over $50"
        },
        {
            icon: <FaShieldAlt className="h-6 w-6" />,
            title: "Secure Shopping",
            description: "Your data is protected with bank-level security"
        },
        {
            icon: <FaTags className="h-6 w-6" />,
            title: "Exclusive Deals",
            description: "Member-only discounts and early access to sales"
        }
    ];

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Main Container */}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl bg-gray-900 border border-gray-800">

                {/* Left Info Section */}
                <div className="lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden border-r border-gray-800">
                    {/* Abstract Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                        {/* Brand Section */}
                        <div className="mb-12 text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start space-x-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">SF</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white">SportFlex</h1>
                                    <p className="text-cyan-400 text-sm mt-1">Elite Sportswear Collection</p>
                                </div>
                            </div>
                            <p className="text-cyan-300 text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Access the world's finest athletic apparel. Elevate your performance with premium sportswear designed for champions.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/30 hover:bg-gray-800/80 transition-all duration-300 hover:translate-y-[-2px] hover:border-cyan-500/50"
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                            <div className="text-white">
                                                {feature.icon}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
                                            <p className="text-cyan-300 text-sm">{feature.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stats Section */}
                        <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl lg:text-3xl font-bold text-cyan-400">50K+</div>
                                    <div className="text-cyan-300 text-sm mt-1">Products</div>
                                </div>
                                <div>
                                    <div className="text-2xl lg:text-3xl font-bold text-cyan-400">120+</div>
                                    <div className="text-cyan-300 text-sm mt-1">Brands</div>
                                </div>
                                <div>
                                    <div className="text-2xl lg:text-3xl font-bold text-cyan-400">24/7</div>
                                    <div className="text-cyan-300 text-sm mt-1">Support</div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute bottom-6 left-6 opacity-20">
                            <svg className="w-20 h-20 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div className="absolute top-6 right-6 opacity-20">
                            <svg className="w-16 h-16 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent mb-3">
                                Welcome Back
                            </h2>
                            <p className="text-gray-400">
                                Sign in to your SportFlex account
                            </p>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-6 bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500 rounded-xl p-4 animate-fadeIn">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-semibold text-red-400">Sign in failed</h3>
                                        <p className="text-sm text-red-300 mt-1">{errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form className="space-y-6" onSubmit={formik.handleSubmit}>
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
                                        className="block w-full pl-10 pr-4 py-3.5 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-cyan-300">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="block w-full pl-10 pr-12 py-3.5 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <FaEye className="h-5 w-5 text-gray-500 hover:text-cyan-400 transition-colors" />
                                        ) : (
                                            <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-cyan-400 transition-colors" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-700 bg-gray-800 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-cyan-300">
                                    Remember me on this device
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <div className="flex items-center justify-center">
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin h-5 w-5 text-white mr-3" />
                                            <span className="text-white font-semibold">Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-white font-semibold text-lg">Sign In</span>
                                            <FaArrowRight className="ml-3 h-5 w-5 text-white transform group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Register Link */}
                            <div className="text-center mt-8 pt-6 border-t border-gray-800">
                                <p className="text-gray-400">
                                    Don't have an account?{' '}
                                    <Link
                                        to="/register"
                                        className="font-semibold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent hover:from-cyan-300 hover:to-cyan-200 transition-all inline-flex items-center"
                                    >
                                        Create account
                                        <FaArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </p>
                            </div>
                        </form>

                        {/* Terms & Privacy */}
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-500">
                                By signing in, you agree to our{' '}
                                <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">Terms</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}