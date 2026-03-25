// tabs/UsersTab.jsx - Users management tab
import React from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaSpinner } from 'react-icons/fa';

export default function UsersTab({
    isDarkMode,
    searchQuery,
    setSearchQuery,
    isLoading,
    isInitializing,
    users,
    stats,
    formatDate
}) {
    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage registered users and their information</p>
                </div>
                <div className="relative flex-1 sm:w-64">
                    <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                            ${isDarkMode
                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-pink-500 focus:border-pink-500'
                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-pink-700 focus:border-pink-700'}`}
                    />
                </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-pink-400' : 'text-pink-700'}`}>Total Users</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{users.length}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Active Buyers</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalUsersOrdered}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>This Month</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>With Phone</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {users.filter(u => u.phone).length}
                    </p>
                </div>
            </div>

            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 relative">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md
                                        ${isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-base truncate transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {user.full_name || 'No Name'}
                                    </h4>
                                    <p className={`text-sm truncate mt-1 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {user.email}
                                    </p>
                                    {user.phone && (
                                        <p className={`text-xs truncate mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {user.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className={`mt-6 pt-4 border-t transition-colors duration-300
                                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className={`text-xs mb-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Joined</p>
                                        <p className={`font-medium truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formatDate(user.created_at)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-xs mb-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Phone</p>
                                        <p className={`font-medium truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {user.phone || 'Not set'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className={`text-xs mb-1 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>User ID</p>
                                    <div className={`p-2 rounded-lg transition-colors duration-300
                                        ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                        <p className={`font-mono text-xs truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {user.id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}