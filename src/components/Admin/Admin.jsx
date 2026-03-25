// Admin.jsx - Main admin component with state management
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAdminData } from './hooks/useAdminData';
import { useStockManagement } from './hooks/useStockManagement';
import { useImageUpload } from './hooks/useImageUpload';
import AdminLayout from './AdminLayout';
import DashboardTab from './tabs/DashboardTab';
import ProductsTab from './tabs/ProductsTab';
import CategoriesTab from './tabs/CategoriesTab';
import ShippingTab from './tabs/ShippingTab';
import SpecialOffersTab from './tabs/SpecialOffersTab';
import PromoCodesTab from './tabs/PromoCodesTab';
import OrdersTab from './tabs/OrdersTab';
import UsersTab from './tabs/UsersTab';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({
        products: 'all',
        orders: 'all',
        users: 'all'
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const navigate = useNavigate();

    const {
        products,
        categories,
        orders,
        users,
        shippingCosts,
        specialOffers,
        promoCodes,
        stats,
        isLoading,
        isInitializing,
        fetchProductsWithImages,
        calculateStats,
        refreshData
    } = useAdminData();

    const {
        decreaseProductStock,
        returnProductStock
    } = useStockManagement({
        products,
        categories,
        orders,
        users,
        fetchProductsWithImages,
        calculateStats
    });

    const {
        uploading,
        uploadProgress,
        uploadImage,
        handleMainImageUpload,
        handleAdditionalImageUpload,
        handleCategoryImageUpload,
        removeMainImage,
        removeAdditionalImage,
        removeCategoryImage
    } = useImageUpload();

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

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const {
                data: { session }
            } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Please login to access admin panel');
                navigate('/login');
                return;
            }

            const { data: adminRole, error } = await supabase
                .from('admin_roles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) console.error('Admin check error:', error);

            if (!adminRole) {
                toast.error('Unauthorized access. Admin privileges required.');
                navigate('/');
            }
        } catch (error) {
            console.error('Admin access check error:', error);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
            } else {
                setSidebarCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleExportReport = () => {
        try {
            const reportData = {
                generatedAt: new Date().toISOString(),
                summary: {
                    totalProducts: stats?.totalProducts ?? 0,
                    totalCategories: stats?.totalCategories ?? 0,
                    totalOrders: stats?.totalOrders ?? 0,
                    totalUsers: stats?.totalUsers ?? 0,
                    totalUsersOrdered: stats?.totalUsersOrdered ?? 0,
                    totalRevenue: Number(stats?.totalRevenue ?? 0).toFixed(2),
                    lowStockCount: stats?.lowStockCount ?? 0,
                    outOfStockCount: stats?.outOfStockCount ?? 0
                },
                recentProducts: (products || []).slice(0, 10).map((product) => ({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    stock: product.stock,
                    category: product.categories?.name || 'Uncategorized',
                    createdAt: product.created_at || null
                })),
                recentOrders: (orders || []).slice(0, 10).map((order) => ({
                    id: order.id,
                    orderNumber: order.order_number,
                    customerName: order.customer_name,
                    customerEmail: order.customer_email,
                    totalAmount: order.total_amount,
                    status: order.status,
                    createdAt: order.created_at
                }))
            };

            const fileContent = JSON.stringify(reportData, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export report');
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const order = orders.find((o) => o.id === orderId);
            if (!order) {
                toast.error('Order not found');
                return;
            }

            const newStatusLower = newStatus.toLowerCase();
            const oldStatus = (order.status || 'pending').toLowerCase();
            const shippedStatuses = ['shipped', 'delivered'];
            const returnStatuses = ['pending', 'processing', 'cancelled'];

            if (shippedStatuses.includes(oldStatus) && returnStatuses.includes(newStatusLower)) {
                await returnProductStock(orderId);
            } else if (returnStatuses.includes(oldStatus) && shippedStatuses.includes(newStatusLower)) {
                await decreaseProductStock(orderId);
            }

            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatusLower,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            toast.success(`Order status updated to ${newStatusLower}`);
            await refreshData();
            await sendStatusUpdateEmail(order, newStatusLower);
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order status');
        }
    };

    const sendStatusUpdateEmail = async (order, newStatus) => {
        try {
            const emailBody = `
📦 ORDER STATUS UPDATE - SportFlex Store

Dear ${order.customer_name},

Your order status has been updated!

===========================================
ORDER INFORMATION
===========================================
📦 Order Number: ${order.order_number}
📋 Status: ${newStatus}
📅 Order Date: ${formatDate(order.created_at)}
💰 Total Amount: EGP ${parseFloat(order.total_amount).toFixed(2)}
📍 Governorate: ${order.shipping_governorate || 'Not specified'}
🚚 Shipping Cost: EGP ${parseFloat(order.shipping_cost || 0).toFixed(2)}

===========================================
STATUS UPDATE DETAILS
===========================================
🔄 Previous Status: ${order.status || 'Pending'}
✅ New Status: ${newStatus}
⏰ Updated: ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}

${getStatusMessage(newStatus)}

===========================================
NEXT STEPS
===========================================
${getNextSteps(newStatus)}

Thank you for shopping with us!

Best regards,
SportFlex Store Team
📞 Contact: +021 14082 1819
📧 Email: yousef.hatem.developer@gmail.com
`.trim();

            const subject = encodeURIComponent(`📦 Order #${order.order_number} - Status Updated to ${newStatus}`);
            const body = encodeURIComponent(emailBody);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${subject}&body=${body}`;
            window.open(gmailUrl, '_blank');
        } catch (error) {
            console.error('Error preparing email:', error);
            toast.error('Failed to prepare email notification');
        }
    };

    const getStatusMessage = (status) => {
        const messages = {
            pending: 'Your order has been received and is awaiting processing.',
            processing: 'Your order is currently being processed. We\'re preparing your items for shipment.',
            shipped: 'Great news! Your order has been shipped and is on its way to you.',
            delivered: 'Your order has been successfully delivered. Thank you for shopping with us!',
            cancelled: 'Your order has been cancelled. Please contact us if you have any questions.'
        };

        return messages[(status || '').toLowerCase()] || 'Your order status has been updated.';
    };

    const getNextSteps = (status) => {
        const steps = {
            pending: '• We will notify you when your order starts processing\n• Estimated processing time: 24-48 hours',
            processing: '• Your items are being prepared\n• You will receive shipping details soon\n• Estimated shipping time: 3-7 business days',
            shipped: '• Track your shipment using the provided tracking number\n• Estimated delivery: Within 3-7 business days\n• Please ensure someone is available to receive the package',
            delivered: '• Please inspect your items upon delivery\n• Contact us within 7 days for any issues\n• We hope you enjoy your purchase!',
            cancelled: '• Any payments will be refunded within 5-7 business days\n• Contact us for more information\n• We hope to serve you better next time'
        };

        return steps[(status || '').toLowerCase()] || '• We will contact you if any action is required';
    };

    const renderTabContent = () => {
        const tabProps = {
            isDarkMode,
            searchQuery,
            setSearchQuery,
            activeFilters,
            setActiveFilters,
            isLoading,
            isInitializing,
            products,
            categories,
            orders,
            users,
            shippingCosts,
            specialOffers,
            promoCodes,
            stats,
            formatDate,
            formatDateTime,
            handleUpdateOrderStatus,
            handleExportReport,
            handleLogout,
            uploading,
            uploadProgress,
            uploadImage,
            handleMainImageUpload,
            handleAdditionalImageUpload,
            handleCategoryImageUpload,
            removeMainImage,
            removeAdditionalImage,
            removeCategoryImage,
            refreshData,
            setActiveTab,
            navigate
        };

        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab {...tabProps} />;
            case 'products':
                return <ProductsTab {...tabProps} />;
            case 'categories':
                return <CategoriesTab {...tabProps} />;
            case 'shipping':
                return <ShippingTab {...tabProps} />;
            case 'offers':
                return <SpecialOffersTab {...tabProps} />;
            case 'promocodes':
                return <PromoCodesTab {...tabProps} />;
            case 'orders':
                return <OrdersTab {...tabProps} />;
            case 'users':
                return <UsersTab {...tabProps} />;
            default:
                return <DashboardTab {...tabProps} />;
        }
    };

    if (isInitializing && activeTab === 'dashboard') {
        return (
            <div
                className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'
                    }`}
            >
                <div className="text-center">
                    <div className="relative">
                        <div
                            className={`animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 mx-auto mb-4 ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'
                                }`}
                        ></div>
                        <div
                            className={`absolute inset-0 bg-gradient-to-r blur-lg opacity-20 ${isDarkMode ? 'from-cyan-500 to-cyan-600' : 'from-cyan-700 to-cyan-800'
                                }`}
                        ></div>
                    </div>
                    <p
                        className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                    >
                        Loading Admin Panel...
                    </p>
                    <p
                        className={`text-sm mt-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}
                    >
                        Please wait while we load your data
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            isDarkMode={isDarkMode}
            handleLogout={handleLogout}
        >
            {renderTabContent()}
        </AdminLayout>
    );
}