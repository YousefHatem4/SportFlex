// Sidebar.jsx - Navigation sidebar component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBox, FaUsers, FaShoppingCart, FaChartLine,
    FaSignOutAlt, FaTags, FaTruck, FaGift, FaTicketAlt,
    FaChevronLeft, FaChevronRight, FaTimes
} from 'react-icons/fa';

const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { id: 'products', label: 'Products', icon: <FaBox /> },
    { id: 'categories', label: 'Categories', icon: <FaTags /> },
    { id: 'shipping', label: 'Shipping', icon: <FaTruck /> },
    { id: 'offers', label: 'Special Offers', icon: <FaGift /> },
    { id: 'promocodes', label: 'Promo Codes', icon: <FaTicketAlt /> },
    { id: 'orders', label: 'Orders', icon: <FaShoppingCart /> },
    { id: 'users', label: 'Users', icon: <FaUsers /> },
];

export default function Sidebar({
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    isDarkMode,
    handleLogout
}) {
    // Desktop Sidebar
    const DesktopSidebar = () => (
        <motion.aside
            initial={false}
            animate={{ width: sidebarCollapsed ? '80px' : '256px' }}
            className={`hidden lg:block rounded-2xl shadow-lg overflow-hidden sticky top-24 h-fit border transition-colors duration-300
                ${sidebarCollapsed ? 'w-20' : 'w-64'} 
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
            <div className="p-4">
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`w-full p-2 mb-4 rounded-lg flex items-center justify-center transition-colors duration-300
                        ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                    {sidebarCollapsed ?
                        <FaChevronRight className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} /> :
                        <FaChevronLeft className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />}
                </button>

                <nav className="space-y-1">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 
                                ${activeTab === item.id
                                    ? isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 text-white shadow-md'
                                    : isDarkMode
                                        ? 'text-gray-400 hover:bg-gray-800'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {!sidebarCollapsed && (
                                <span className="font-medium whitespace-nowrap">{item.label}</span>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 mt-4
                            ${isDarkMode
                                ? 'text-red-400 hover:bg-red-900/30'
                                : 'text-red-600 hover:bg-red-100'}`}
                    >
                        <FaSignOutAlt className="text-lg" />
                        {!sidebarCollapsed && <span className="font-medium">Logout</span>}
                    </button>
                </nav>
            </div>
        </motion.aside>
    );

    // Mobile Sidebar
    const MobileSidebar = () => (
        <AnimatePresence>
            {!sidebarCollapsed && (
                <motion.div
                    initial={{ opacity: 0, x: -300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    className="fixed inset-0 z-50 lg:hidden"
                >
                    <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarCollapsed(true)} />
                    <div className={`absolute left-0 top-0 h-full w-64 shadow-2xl border-r transition-colors duration-300
                        ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={`font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Navigation</h2>
                                <button
                                    onClick={() => setSidebarCollapsed(true)}
                                    className={`p-2 rounded-lg transition-colors
                                        ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {sidebarItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setSidebarCollapsed(true);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-300
                                            ${activeTab === item.id
                                                ? isDarkMode
                                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 text-white'
                                                : isDarkMode
                                                    ? 'text-gray-400 hover:bg-gray-800'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setSidebarCollapsed(true);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-300
                                        ${isDarkMode
                                            ? 'text-red-400 hover:bg-red-900/30'
                                            : 'text-red-600 hover:bg-red-100'}`}
                                >
                                    <FaSignOutAlt />
                                    <span>Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <DesktopSidebar />
            <MobileSidebar />
        </>
    );
}