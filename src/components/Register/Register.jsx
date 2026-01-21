// src/components/Register/Register.jsx
import React, { useContext, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import { userContext } from '../../Context/userContext'
import { supabase } from '../../supabaseClient'
import { FaSpinner, FaEnvelope, FaLock, FaArrowRight, FaUser, FaPhone, FaCheck, FaShieldAlt, FaGift, FaTruck, FaStar } from 'react-icons/fa'

export default function Register() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    let navigate = useNavigate();
    let { setUserToken, setUser } = useContext(userContext);

    async function signUp(values) {
        try {
            setIsLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            // Basic validation
            if (values.password !== values.rePassword) {
                throw new Error("Passwords don't match");
            }

            if (values.password.length < 6) {
                throw new Error("Password should be at least 6 characters");
            }

            const { data, error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.name,
                        phone: values.phone
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                // Auto login after registration
                setUserToken(data.session.access_token);
                setUser(data.user);
                localStorage.setItem('userToken', data.session.access_token);
                setSuccessMessage('Registration successful! Welcome to SportFlex!');

                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                // Email confirmation required
                setSuccessMessage('Registration successful! Please check your email to confirm your account.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }

        } catch (error) {
            console.log('Registration error:', error.message);
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
        onSubmit: signUp
    })

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
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
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
                                        className="block w-full pl-10 pr-4 py-3.5 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500"
                                        placeholder="John Doe"
                                    />
                                </div>
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
                                        className="block w-full pl-10 pr-4 py-3.5 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500"
                                        placeholder="name@example.com"
                                    />
                                </div>
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
                                        className="block w-full pl-10 pr-4 py-3.5 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="group">
                                <label htmlFor="password" className="block text-sm font-semibold text-cyan-300 mb-2">
                                    Password
                                </label>
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
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="block w-full pl-10 pr-4 py-3.5 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500"
                                        placeholder="At least 6 characters"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-cyan-300">Must be at least 6 characters long</p>
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
                                        className="block w-full pl-10 pr-4 py-3.5 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900 transition-all duration-300 placeholder-gray-500"
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start space-x-3 pt-2">
                                <input
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    required
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
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
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

                        {/* Additional Info */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 rounded-xl border border-cyan-500/30">
                            <div className="flex items-start space-x-3">
                                <FaShieldAlt className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-cyan-300">
                                        <span className="font-semibold">Your security is our priority.</span> We use bank-level encryption to protect your personal information.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}