// tabs/DashboardTab.jsx - Dashboard content
import React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FaBox, FaUsers, FaShoppingCart, FaChartLine,
    FaTags, FaUserCheck, FaExclamationTriangle, FaTimesCircle,
    FaExclamationCircle, FaChevronRight
} from 'react-icons/fa';

export default function DashboardTab({
    isDarkMode,
    stats,
    products,
    orders,
    formatDate,
    handleExportReport,
    setActiveTab,
    navigate
}) {
    const statCards = [
        {
            title: 'Total Products',
            value: stats.totalProducts,
            icon: <FaBox className="text-xl" />,
            iconColor: isDarkMode ? 'text-cyan-500' : 'text-cyan-700',
            change: '+12%',
            description: 'All products in store'
        },
        {
            title: 'Total Categories',
            value: stats.totalCategories,
            icon: <FaTags className="text-xl" />,
            iconColor: isDarkMode ? 'text-purple-500' : 'text-purple-700',
            change: '+5%',
            description: 'Product categories'
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: <FaShoppingCart className="text-xl" />,
            iconColor: isDarkMode ? 'text-green-500' : 'text-green-700',
            change: '+24%',
            description: 'All time orders'
        },
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: <FaUsers className="text-xl" />,
            iconColor: isDarkMode ? 'text-pink-500' : 'text-pink-700',
            change: '+8%',
            description: 'Registered users'
        },
        {
            title: 'Active Buyers',
            value: stats.totalUsersOrdered,
            icon: <FaUserCheck className="text-xl" />,
            iconColor: isDarkMode ? 'text-indigo-500' : 'text-indigo-700',
            change: '+15%',
            description: 'Users who ordered'
        },
        {
            title: 'Total Revenue',
            value: `EGP ${Number(stats.totalRevenue || 0).toFixed(2)}`,
            icon: <FaChartLine className="text-xl" />,
            iconColor: isDarkMode ? 'text-amber-500' : 'text-amber-700',
            change: '+32%',
            description: 'All time revenue'
        },
        {
            title: 'Low Stock',
            value: stats.lowStockCount,
            icon: <FaExclamationTriangle className="text-xl" />,
            iconColor: isDarkMode ? 'text-red-400' : 'text-red-700',
            change: 'Needs attention',
            description: 'Products with stock < 5',
            isAlert: stats.lowStockCount > 0,
            cardColor: isDarkMode ? 'bg-gradient-to-br from-red-900/30 to-red-800/30' : 'bg-gradient-to-br from-red-50 to-red-100',
            borderColor: isDarkMode ? 'border-red-800/50' : 'border-red-200'
        },
        {
            title: 'Out of Stock',
            value: stats.outOfStockCount,
            icon: <FaTimesCircle className="text-xl" />,
            iconColor: isDarkMode ? 'text-gray-400' : 'text-gray-700',
            change: 'Check inventory',
            description: 'No stock available',
            isAlert: stats.outOfStockCount > 0
        }
    ];

    const onExportClick = () => {
        try {
            if (typeof handleExportReport === 'function') {
                handleExportReport();
            } else {
                console.error('handleExportReport is not a function:', handleExportReport);
                toast.error('Export function is not available');
            }
        } catch (error) {
            console.error('Error while exporting report:', error);
            toast.error('Failed to export report');
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
                    <h1
                        className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}
                    >
                        Dashboard Overview
                    </h1>
                    <p
                        className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                    >
                        Welcome back! Here&apos;s what&apos;s happening with your store today.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onExportClick}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-all duration-300 ${isDarkMode
                                ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`${stat.cardColor || (isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50')
                            } ${stat.borderColor || (isDarkMode ? 'border-gray-700' : 'border-gray-200')
                            } border rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}
                    >
                        <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                        <div className={`absolute -left-6 -bottom-6 w-20 h-20 rounded-full opacity-10 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>

                        {stat.isAlert && (
                            <div className="absolute -top-2 -right-2">
                                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full shadow-lg">
                                    Alert
                                </span>
                            </div>
                        )}

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p
                                        className={`text-sm font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}
                                    >
                                        {stat.title}
                                    </p>
                                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {stat.value}
                                    </p>
                                </div>

                                <div className={`p-3 rounded-xl ${stat.iconColor} ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                    {stat.icon}
                                </div>
                            </div>

                            <div
                                className={`pt-4 border-t transition-colors duration-300 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p
                                            className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}
                                        >
                                            {stat.description}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${stat.isAlert
                                                    ? isDarkMode
                                                        ? 'bg-red-900/50 text-red-300'
                                                        : 'bg-red-100 text-red-700'
                                                    : isDarkMode
                                                        ? 'bg-gray-700/70 text-gray-300'
                                                        : 'bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div
                    className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                        }`}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3
                                className={`text-lg font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}
                            >
                                Recent Orders
                            </h3>
                            <p
                                className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}
                            >
                                Latest customer orders
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {orders.slice(0, 5).map((order) => (
                            <div
                                key={order.id}
                                className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors group ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className={`w-3 h-3 rounded-full ${order.status === 'delivered'
                                                ? 'bg-green-500'
                                                : order.status === 'processing'
                                                    ? 'bg-blue-500'
                                                    : order.status === 'shipped'
                                                        ? 'bg-indigo-500'
                                                        : 'bg-amber-500'
                                            }`}
                                    ></div>
                                    <div className="min-w-0">
                                        <p
                                            className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}
                                        >
                                            #{order.order_number}
                                        </p>
                                        <p
                                            className={`text-sm transition-colors duration-300 break-words ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}
                                        >
                                            {order.customer_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <p
                                        className={`font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}
                                    >
                                        EGP {parseFloat(order.total_amount).toFixed(2)}
                                    </p>
                                    <p
                                        className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                            }`}
                                    >
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Products */}
                <div
                    className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                        }`}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3
                                className={`text-lg font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}
                            >
                                Recent Products
                            </h3>
                            <p
                                className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}
                            >
                                Latest added products
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {products.slice(0, 5).map((product) => (
                            <div
                                key={product.id}
                                className={`flex items-start justify-between gap-3 p-3 rounded-lg transition-colors group ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div
                                        className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                            }`}
                                    >
                                        <img
                                            src={
                                                product.image_url ||
                                                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop'
                                            }
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src =
                                                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop';
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p
                                            className={`font-medium break-words whitespace-normal leading-snug transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}
                                        >
                                            {product.title}
                                        </p>
                                        <p
                                            className={`text-sm mt-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}
                                        >
                                            EGP {parseFloat(product.price).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0 self-start">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full inline-block max-w-full ${product.stock > 10
                                                ? isDarkMode
                                                    ? 'bg-green-900/50 text-green-300'
                                                    : 'bg-green-100 text-green-700'
                                                : product.stock >= 5
                                                    ? isDarkMode
                                                        ? 'bg-yellow-900/50 text-yellow-300'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    : isDarkMode
                                                        ? 'bg-red-900/50 text-red-300'
                                                        : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {product.stock} in stock
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Low Stock Alert Section */}
            {stats.lowStockCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode
                            ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-800/50'
                            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                        }`}
                >
                    <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className={`p-3 rounded-xl transition-colors duration-300 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                                    }`}
                            >
                                <FaExclamationCircle className={`text-xl ${isDarkMode ? 'text-red-400' : 'text-red-700'}`} />
                            </div>

                            <div className="min-w-0">
                                <h3
                                    className={`text-lg font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}
                                >
                                    Low Stock Alert
                                </h3>
                                <p
                                    className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}
                                >
                                    You have{' '}
                                    <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                                        {stats.lowStockCount}
                                    </span>{' '}
                                    products with critically low stock (&lt;5 units)
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'
                                }`}
                        >
                            <FaBox /> Manage Stock
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {products
                            .filter((p) => p.stock < 5)
                            .slice(0, 4)
                            .map((product) => (
                                <div
                                    key={product.id}
                                    className={`p-4 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-red-800/50' : 'bg-white border-red-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`font-medium text-sm break-words whitespace-normal leading-snug transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}
                                            >
                                                {product.title}
                                            </p>
                                            <p
                                                className={`text-xs mt-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                    }`}
                                            >
                                                EGP {parseFloat(product.price).toFixed(2)}
                                            </p>
                                        </div>

                                        <span
                                            className={`ml-2 text-xs px-2 py-1 rounded-full flex-shrink-0 ${product.stock < 2
                                                    ? 'bg-red-600 text-white'
                                                    : isDarkMode
                                                        ? 'bg-red-900/50 text-red-300'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {product.stock} left
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <span
                                            className={`text-xs transition-colors duration-300 break-words ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                }`}
                                        >
                                            {product.categories?.name || 'Uncategorized'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => navigate(`/editproductdetailsadmin/${product.id}`)}
                                            className={`text-xs font-medium transition-colors duration-300 flex-shrink-0 ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                                                }`}
                                        >
                                            Restock →
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {stats.lowStockCount > 4 && (
                        <div
                            className={`mt-6 pt-4 border-t transition-colors duration-300 ${isDarkMode ? 'border-red-800/50' : 'border-red-200'
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => setActiveTab('products')}
                                className={`text-sm font-medium flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-700 hover:text-red-800'
                                    }`}
                            >
                                View all low stock products ({stats.lowStockCount}) <FaChevronRight />
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}