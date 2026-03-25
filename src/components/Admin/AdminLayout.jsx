// AdminLayout.jsx - Layout wrapper with sidebar
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';

export default function AdminLayout({
    children,
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    isDarkMode,
    handleLogout
}) {
    return (
        <div className={`min-h-screen transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        sidebarCollapsed={sidebarCollapsed}
                        setSidebarCollapsed={setSidebarCollapsed}
                        isDarkMode={isDarkMode}
                        handleLogout={handleLogout}
                    />

                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setSidebarCollapsed(false)}
                        className={`fixed left-4 top-20 lg:hidden z-30 w-10 h-10 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110
                            ${isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Main Content */}
                    <main className={`flex-1 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-6'} overflow-x-hidden`}>
                        <div className="w-full max-w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}