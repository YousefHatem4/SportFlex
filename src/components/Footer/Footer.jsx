import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFacebookF,
    faTwitter,
    faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function Footer() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

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

    return (
        <footer className={`px-6 py-12 md:px-12 lg:px-24 border-t transition-colors duration-300
            ${isDarkMode
                ? 'bg-black text-gray-300 border-gray-800'
                : 'bg-white text-gray-600 border-gray-200'}`}>

            <div className="max-w-7xl mx-auto">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

                    {/* Subscription Column */}
                    <div className="lg:col-span-2">
                        <h2 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-6
                            ${isDarkMode
                                ? 'from-cyan-400 to-cyan-300'
                                : 'from-cyan-700 to-cyan-600'}`}>
                            SportFlex Store
                        </h2>
                        <h3 className={`text-lg font-semibold mb-3 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Subscribe
                        </h3>
                        <p className={`mb-4 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Get 10% off your first order
                        </p>
                        <form className="relative">
                            <input
                                type="email"
                                className={`w-full text-sm rounded-md focus:ring-2 focus:border-transparent px-4 py-3 pr-10 transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gray-900 border border-gray-700 text-white focus:ring-cyan-500 placeholder-gray-500'
                                        : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-cyan-600 placeholder-gray-400'}`}
                                placeholder="Enter your email"
                            />
                            <button
                                type="submit"
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-white rounded-md p-2 transition-all duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                            >
                                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className={`text-lg font-bold mb-6 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Support
                        </h3>
                        <address className={`not-italic space-y-3 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p>Egypt<br />El Sheikh Zayed</p>
                            <p className="hover:text-cyan-400 transition-colors">
                                <a href="mailto:yousef.hatem.developer@gmail.com"
                                    className={isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}>
                                    yousef.hatem.developer@gmail.com
                                </a>
                            </p>
                            <p className="hover:text-cyan-400 transition-colors">
                                <a href="tel:+021140821819"
                                    className={isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}>
                                    +021140821819
                                </a>
                            </p>
                        </address>
                    </div>

                    {/* Account Links */}
                    <div>
                        <h3 className={`text-lg font-bold mb-6 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Account
                        </h3>
                        <ul className={`space-y-3 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <li>
                                <Link to="/cart"
                                    className={`transition-colors duration-300
                                          ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}>
                                    Cart
                                </Link>
                            </li>
                            <li>
                                <Link to="/wishlist"
                                    className={`transition-colors duration-300
                                          ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}>
                                    Wishlist
                                </Link>
                            </li>
                            <li>
                                <Link to="/products"
                                    className={`transition-colors duration-300
                                          ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}>
                                    Shop
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className={`text-lg font-bold mb-6 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Quick Link
                        </h3>
                        <ul className={`space-y-3 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <li>
                                <Link to=""
                                    className={`transition-colors duration-300
                                          ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}>
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to=""
                                    className={`transition-colors duration-300
                                          ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}>
                                    Terms Of Use
                                </Link>
                            </li>
                            <li>
                                <Link to=""
                                    className={`transition-colors duration-300
                                          ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}>
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link to=""
                                    className={`transition-colors duration-300
                                          ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'}`}>
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom Bar */}
                <div className={`border-t pt-8 flex flex-col md:flex-row justify-between items-center transition-colors duration-300
                    ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>

                    <p className={`text-sm mb-4 md:mb-0 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        © {new Date().getFullYear()} SportFlex Store. All rights reserved
                    </p>

                    <div className="flex space-x-6">
                        <a href="#"
                            className={`transition-colors duration-300
                               ${isDarkMode
                                    ? 'text-gray-400 hover:text-cyan-400'
                                    : 'text-gray-500 hover:text-cyan-700'}`}>
                            <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5" />
                        </a>
                        <a href="#"
                            className={`transition-colors duration-300
                               ${isDarkMode
                                    ? 'text-gray-400 hover:text-cyan-400'
                                    : 'text-gray-500 hover:text-cyan-700'}`}>
                            <FontAwesomeIcon icon={faTwitter} className="w-5 h-5" />
                        </a>
                        <a href="#"
                            className={`transition-colors duration-300
                               ${isDarkMode
                                    ? 'text-gray-400 hover:text-cyan-400'
                                    : 'text-gray-500 hover:text-cyan-700'}`}>
                            <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}