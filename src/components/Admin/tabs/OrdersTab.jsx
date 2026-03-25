// tabs/OrdersTab.jsx - Orders management tab
import React from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaEye, FaEnvelope, FaSpinner } from 'react-icons/fa';

export default function OrdersTab({
    isDarkMode,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    isLoading,
    isInitializing,
    orders,
    stats,
    formatDate,
    handleUpdateOrderStatus,
    navigate
}) {
    const filteredOrders = orders.filter(order =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFilteredOrders = () => {
        const filteredBySearch = filteredOrders.filter(order =>
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (activeFilters.orders === 'all') {
            return filteredBySearch;
        } else {
            return filteredBySearch.filter(order => order.status === activeFilters.orders);
        }
    };

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
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track and manage customer orders</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 sm:w-64">
                        <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                ${isDarkMode
                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-green-500 focus:border-green-500'
                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-green-700 focus:border-green-700'}`}
                        />
                    </div>
                    <div className={`text-sm px-3 py-1.5 rounded-lg transition-colors duration-300
                        ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        <span className="font-medium">{stats.totalUsersOrdered}</span> users ordered
                    </div>
                </div>
            </div>

            {/* Order Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Pending</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {orders.filter(o => o.status === 'pending').length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>Processing</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {orders.filter(o => o.status === 'processing').length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Shipped</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {orders.filter(o => o.status === 'shipped').length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Total Revenue</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {stats.totalRevenue.toFixed(2)}</p>
                </div>
            </div>

            {/* Order Status Filters */}
            <div className={`rounded-xl shadow-lg p-4 border transition-colors duration-300
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'all' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'all'
                                ? isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        All ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'pending' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'pending'
                                ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Pending ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'processing' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'processing'
                                ? isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Processing ({orders.filter(o => o.status === 'processing').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'shipped' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'shipped'
                                ? isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Shipped ({orders.filter(o => o.status === 'shipped').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'delivered' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'delivered'
                                ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Delivered ({orders.filter(o => o.status === 'delivered').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'cancelled' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'cancelled'
                                ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Cancelled ({orders.filter(o => o.status === 'cancelled').length})
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className={`rounded-xl shadow-lg overflow-hidden border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className={`bg-gradient-to-r 
                                    ${isDarkMode ? 'from-cyan-900/30 to-cyan-800/30' : 'from-cyan-100 to-cyan-50'}`}>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order Details</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Shipping</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredOrders().map((order) => (
                                    <tr key={order.id} className={`border-b transition-colors duration-300
                                        ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>#{order.order_number}</p>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(order.created_at)}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.customer_name}</p>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{order.customer_email}</p>
                                                <p className={`text-xs transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{order.customer_phone || 'No phone'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.shipping_governorate || '-'}</p>
                                                {order.shipping_cost && (
                                                    <p className={`text-xs transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>EGP {parseFloat(order.shipping_cost).toFixed(2)}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className={`font-semibold transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {parseFloat(order.total_amount).toFixed(2)}</p>
                                            {order.discount_amount > 0 && (
                                                <p className={`text-xs transition-colors duration-300
                                                    ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Discount: EGP {parseFloat(order.discount_amount).toFixed(2)}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={(order.status || 'pending').toLowerCase()}
                                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                    className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 shadow-sm transition-colors duration-300
                                                        ${isDarkMode
                                                            ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500'
                                                            : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700'}`}
                                                >
                                                    <option value="pending">⏳ Pending</option>
                                                    <option value="processing">🔧 Processing</option>
                                                    <option value="shipped">🚚 Shipped</option>
                                                    <option value="delivered">✅ Delivered</option>
                                                    <option value="cancelled">❌ Cancelled</option>
                                                </select>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center 
                                                    ${order.status === 'delivered'
                                                        ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                                        : order.status === 'processing' || order.status === 'shipped'
                                                            ? isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                                                            : order.status === 'cancelled'
                                                                ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                                                : isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/order/${order.id}`)}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${encodeURIComponent(`Regarding Your Order #${order.order_number}`)}`;
                                                        window.open(gmailUrl, '_blank');
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-700 hover:bg-green-100'}`}
                                                    title="Email Customer"
                                                >
                                                    <FaEnvelope />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
}