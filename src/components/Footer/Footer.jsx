import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFacebookF,
    faTwitter,
    faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 px-6 py-12 md:px-12 lg:px-24 border-t border-gray-800">
            <div className="max-w-7xl mx-auto">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                    {/* Subscription Column */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold text-white mb-6">SportFlex Store</h2>
                        <h3 className="text-lg font-semibold text-white mb-3">Subscribe</h3>
                        <p className="text-gray-400 mb-4">Get 10% off your first order</p>
                        <form className="relative">
                            <input
                                type="email"
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 pr-10 placeholder-gray-500"
                                placeholder="Enter your email"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-400 transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">Support</h3>
                        <address className="not-italic text-gray-400 space-y-3">
                            <p>Egypt<br />El Sheikh Zayed</p>
                            <p className="hover:text-white transition-colors">
                                <a href="mailto:exclusive@gmail.com">yousef.hatem.developer@gmail.com</a>
                            </p>
                            <p className="hover:text-white transition-colors">
                                <a href="tel:+021140821819">+021140821819</a>
                            </p>
                        </address>
                    </div>

                    {/* Account Links */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">Account</h3>
                        <ul className="space-y-3 text-gray-400">
               
                            <li><Link to="/cart" className="hover:text-white transition-colors">Cart</Link></li>
                            <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
                            <li><Link to="/products" className="hover:text-white transition-colors">Shop</Link></li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">Quick Link</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li><Link to="" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="" className="hover:text-white transition-colors">Terms Of Use</Link></li>
                            <li><Link to="" className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link to="" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                        © {new Date().getFullYear()} SportFlex Store. All rights reserved
                    </p>
                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <FontAwesomeIcon icon={faTwitter} className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}