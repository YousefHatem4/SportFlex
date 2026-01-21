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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
            {/* Main Container */}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl bg-white">

                {/* Left Info Section */}
                <div className="lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
                    {/* Abstract Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                        {/* Brand Section */}
                        <div className="mb-12 text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start space-x-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">SF</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white">SportFlex</h1>
                                    <p className="text-blue-200 text-sm mt-1">Elite Sportswear Collection</p>
                                </div>
                            </div>
                            <p className="text-blue-100 text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Access the world's finest athletic apparel. Elevate your performance with premium sportswear designed for champions.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-2px]"
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                                            <div className="text-white">
                                                {feature.icon}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
                                            <p className="text-blue-200 text-sm">{feature.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stats Section */}
                        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl lg:text-3xl font-bold text-white">50K+</div>
                                    <div className="text-blue-200 text-sm mt-1">Products</div>
                                </div>
                                <div>
                                    <div className="text-2xl lg:text-3xl font-bold text-white">120+</div>
                                    <div className="text-blue-200 text-sm mt-1">Brands</div>
                                </div>
                                <div>
                                    <div className="text-2xl lg:text-3xl font-bold text-white">24/7</div>
                                    <div className="text-blue-200 text-sm mt-1">Support</div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute bottom-6 left-6 opacity-20">
                            <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div className="absolute top-6 right-6 opacity-20">
                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                                Welcome Back
                            </h2>
                            <p className="text-gray-600">
                                Sign in to your SportFlex account
                            </p>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-xl p-4 animate-fadeIn">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-semibold text-red-800">Sign in failed</h3>
                                        <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form className="space-y-6" onSubmit={formik.handleSubmit}>
                            {/* Email Input */}
                            <div className="group">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
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
                                        className="block w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
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
                                        className="block w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        ) : (
                                            <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
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
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me on this device
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
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
                            <div className="text-center mt-8 pt-6 border-t border-gray-100">
                                <p className="text-gray-600">
                                    Don't have an account?{' '}
                                    <Link
                                        to="/register"
                                        className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center"
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
                                <Link to="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}