// NotFound.jsx - MODERN & ATTRACTIVE DESIGN WITH CYAN THEME
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto text-center">
                {/* Background decorative elements */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-cyan-900/30 to-transparent rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-cyan-800/30 to-transparent rounded-full blur-3xl opacity-50"></div>

                {/* Main content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10"
                >
                    {/* Error code with animation */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative mb-8"
                    >
                        <div className="text-9xl md:text-[12rem] font-bold text-gray-900 opacity-10 select-none">
                            404
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-8xl md:text-[10rem] font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
                                404
                            </div>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                    >
                        Page Not Found
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        Oops! The page you're looking for seems to have wandered off into the digital wilderness.
                        Don't worry, let's get you back on track.
                    </motion.p>

                    {/* Animated illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="mb-10"
                    >
                        <div className="w-48 h-48 mx-auto relative">
                            {/* Floating elements */}
                            <motion.div
                                animate={{
                                    y: [0, -20, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full shadow-lg flex items-center justify-center"
                            >
                                <i className="fas fa-search text-white text-xl"></i>
                            </motion.div>

                            <motion.div
                                animate={{
                                    y: [0, 20, 0],
                                    rotate: [0, -5, 5, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5
                                }}
                                className="absolute top-8 right-4 w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-full shadow-lg flex items-center justify-center"
                            >
                                <i className="fas fa-map text-white text-lg"></i>
                            </motion.div>

                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [0, -8, 8, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 1
                                }}
                                className="absolute bottom-8 left-8 w-14 h-14 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-full shadow-lg flex items-center justify-center"
                            >
                                <i className="fas fa-compass text-white text-lg"></i>
                            </motion.div>

                            {/* Central element */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-24 h-24 bg-gray-900 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-cyan-500/30"
                                >
                                    <i className="fas fa-question text-4xl text-cyan-400"></i>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                to="/"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold shadow-lg"
                            >
                                <i className="fas fa-home"></i>
                                Back to Home
                            </Link>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 border-2 border-cyan-500 text-cyan-400 rounded-xl hover:bg-gray-800 transition-all duration-300 font-semibold shadow-sm"
                            >
                                <i className="fas fa-shopping-bag"></i>
                                Browse Products
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Quick links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        className="mb-12"
                    >
                        <p className="text-gray-500 mb-4">You might be looking for:</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {['Products', 'Categories', 'Contact', 'About'].map((item, index) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.7 + (index * 0.1) }}
                                >
                                    <Link
                                        to={`/${item.toLowerCase()}`}
                                        className="inline-block px-4 py-2 bg-gray-900 text-cyan-400 rounded-lg hover:bg-gray-800 transition-colors duration-300 text-sm font-medium border border-gray-700"
                                    >
                                        {item}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Search bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for something else..."
                                className="w-full px-6 py-4 bg-gray-900 border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm placeholder-gray-500"
                            />
                            <button className="absolute right-3 top-3 p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-colors">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </motion.div>

                    {/* Fun fact */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                        className="mt-12 pt-8 border-t border-gray-800"
                    >
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 rounded-full border border-cyan-500/30">
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
                                <i className="fas fa-lightbulb text-white"></i>
                            </div>
                            <p className="text-cyan-300 text-sm">
                                <span className="font-semibold">Fun Fact:</span> Even the best explorers sometimes get lost!
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Footer note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="mt-12 text-gray-500 text-sm"
                >
                    <p>© {new Date().getFullYear()} SportFlex Store. All rights reserved.</p>
                    <p className="mt-1">Error Code: 404 • Page Not Found</p>
                </motion.div>
            </div>
        </div>
    );
}