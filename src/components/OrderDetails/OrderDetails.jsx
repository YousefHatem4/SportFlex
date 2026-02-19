import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
    FaArrowLeft,
    FaPrint,
    FaDownload,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCreditCard,
    FaTruck,
    FaCalendar,
    FaIdCard,
    FaShoppingBag,
    FaBox,
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle,
    FaShippingFast,
    FaCheck,
    FaUser,
    FaSave,
    FaSpinner,
    FaTags,
    FaPercent,
    FaExclamationCircle
} from 'react-icons/fa'

export default function OrderDetails() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [orderItems, setOrderItems] = useState([])
    const [customer, setCustomer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [savingNotes, setSavingNotes] = useState(false)
    const [notes, setNotes] = useState('')
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const printRef = useRef()

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

    useEffect(() => {
        document.title = 'Order Details - Admin Panel'
        fetchOrderDetails()
    }, [orderId])

    const fetchOrderDetails = async () => {
        try {
            setLoading(true)

            // Fetch order details
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single()

            if (orderError) throw orderError

            // Fetch customer information from profiles if user_id exists
            let customerData = null
            if (orderData.user_id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', orderData.user_id)
                    .single()

                if (!profileError) {
                    customerData = profileData
                }
            }

            // Fetch order items
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select(`
          *,
          products (
            id,
            title,
            image_url,
            category,
            stock
          )
        `)
                .eq('order_id', orderId)

            if (itemsError) throw itemsError

            setOrder(orderData)
            setCustomer(customerData)
            setOrderItems(itemsData || [])

            // Set notes from order data
            if (orderData.notes) {
                setNotes(orderData.notes)
            }

        } catch (error) {
            console.error('Error fetching order details:', error)
            toast.error('Failed to load order details')
            navigate('/admin')
        } finally {
            setLoading(false)
        }
    }

    // =========== COMPLETE STOCK MANAGEMENT FUNCTIONS ===========

    // Decrease product stock when status changes to Shipped
    const decreaseProductStock = async (orderItems) => {
        try {
            console.log('Decreasing stock for shipped order items:', orderItems);

            for (const item of orderItems) {
                if (item.product_id) {
                    const { data: product, error: productError } = await supabase
                        .from('products')
                        .select('stock')
                        .eq('id', item.product_id)
                        .single()

                    if (productError) {
                        console.error(`Error fetching product ${item.product_id}:`, productError);
                        continue;
                    }

                    const newStock = Math.max(0, product.stock - item.quantity);

                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            stock: newStock,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.product_id)

                    if (updateError) {
                        console.error(`Error updating stock for product ${item.product_id}:`, updateError);
                    } else {
                        console.log(`Updated stock for product ${item.product_title}: ${product.stock} → ${newStock}`);
                        toast.success(`Stock updated for ${item.product_title}: ${newStock} remaining`);
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Error decreasing product stock:', error);
            return false;
        }
    }

    // Return products to stock when status changes to Pending, Processing, or Cancelled
    const returnProductStock = async (orderItems) => {
        try {
            console.log('Returning stock for order items:', orderItems);

            for (const item of orderItems) {
                if (item.product_id) {
                    const { data: product, error: productError } = await supabase
                        .from('products')
                        .select('stock')
                        .eq('id', item.product_id)
                        .single()

                    if (productError) {
                        console.error(`Error fetching product ${item.product_id}:`, productError);
                        continue;
                    }

                    const newStock = product.stock + item.quantity;

                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            stock: newStock,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.product_id)

                    if (updateError) {
                        console.error(`Error updating stock for product ${item.product_id}:`, updateError);
                    } else {
                        console.log(`Returned stock for product ${item.product_title}: ${product.stock} → ${newStock}`);
                        toast.success(`Stock returned for ${item.product_title}: ${newStock} available`);
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Error returning product stock:', error);
            return false;
        }
    }

    // Dynamic stock management based on status changes
    const updateOrderStatus = async (newStatus) => {
        try {
            setUpdatingStatus(true)

            // Get current order status
            const { data: currentOrder } = await supabase
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .single()

            const oldStatus = currentOrder?.status || 'Pending'

            // Define status categories
            const shippedStatuses = ['Shipped', 'Delivered'];
            const returnStatuses = ['Pending', 'Processing', 'Cancelled'];

            // If changing from shipped to non-shipped status, return stock
            if (shippedStatuses.includes(oldStatus) && returnStatuses.includes(newStatus)) {
                const stockReturned = await returnProductStock(orderItems);
                if (!stockReturned) {
                    toast.error('Failed to return product stock');
                }
            }
            // If changing from non-shipped to shipped status, decrease stock
            else if (returnStatuses.includes(oldStatus) && shippedStatuses.includes(newStatus)) {
                const stockDecreased = await decreaseProductStock(orderItems);
                if (!stockDecreased) {
                    toast.error('Failed to update product stock');
                }
            }
            // If changing between shipped statuses (Shipped ↔ Delivered), no stock change needed
            // If changing between return statuses (Pending ↔ Processing ↔ Cancelled), no stock change needed

            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)

            if (error) throw error

            setOrder({ ...order, status: newStatus })
            toast.success(`Order status updated to ${newStatus}`)

            // Send email notification
            sendStatusUpdateEmail(order, newStatus)

        } catch (error) {
            console.error('Error updating order status:', error)
            toast.error('Failed to update order status')
        } finally {
            setUpdatingStatus(false)
        }
    }

    // Email notification function
    const sendStatusUpdateEmail = (order, newStatus) => {
        try {
            // Get status message
            const statusMessage = getStatusMessage(newStatus);

            // Create detailed email content
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

${statusMessage}

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

            // Create Gmail compose URL
            const subject = encodeURIComponent(`📦 Order #${order.order_number} - Status Updated to ${newStatus}`);
            const body = encodeURIComponent(emailBody);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${subject}&body=${body}`;

            // Open Gmail in new tab
            window.open(gmailUrl, '_blank');

        } catch (error) {
            console.error('Error preparing email:', error);
            toast.error('Failed to prepare email notification');
        }
    };

    // Helper function for status messages
    const getStatusMessage = (status) => {
        const messages = {
            'Pending': 'Your order has been received and is awaiting processing.',
            'Processing': 'Your order is currently being processed. We\'re preparing your items for shipment.',
            'Shipped': 'Great news! Your order has been shipped and is on its way to you.',
            'Delivered': 'Your order has been successfully delivered. Thank you for shopping with us!',
            'Cancelled': 'Your order has been cancelled. Please contact us if you have any questions.'
        };
        return messages[status] || 'Your order status has been updated.';
    };

    // Helper function for next steps
    const getNextSteps = (status) => {
        const steps = {
            'Pending': '• We will notify you when your order starts processing\n• Estimated processing time: 24-48 hours',
            'Processing': '• Your items are being prepared\n• You will receive shipping details soon\n• Estimated shipping time: 3-7 business days',
            'Shipped': '• Track your shipment using the provided tracking number\n• Estimated delivery: Within 3-7 business days\n• Please ensure someone is available to receive the package',
            'Delivered': '• Please inspect your items upon delivery\n• Contact us within 7 days for any issues\n• We hope you enjoy your purchase!',
            'Cancelled': '• Any payments will be refunded within 5-7 business days\n• Contact us for more information\n• We hope to serve you better next time'
        };
        return steps[status] || '• We will contact you if any action is required';
    };

    const saveNotes = async () => {
        try {
            setSavingNotes(true)

            const { error } = await supabase
                .from('orders')
                .update({
                    notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)

            if (error) throw error

            // Update local state
            setOrder({ ...order, notes: notes })
            toast.success('Notes saved successfully!')

        } catch (error) {
            console.error('Error saving notes:', error)
            toast.error('Failed to save notes')
        } finally {
            setSavingNotes(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        if (isDarkMode) {
            switch (status) {
                case 'Pending':
                    return 'bg-yellow-900/30 text-yellow-400 border-yellow-500'
                case 'Processing':
                    return 'bg-blue-900/30 text-blue-400 border-blue-500'
                case 'Shipped':
                    return 'bg-purple-900/30 text-purple-400 border-purple-500'
                case 'Delivered':
                    return 'bg-green-900/30 text-green-400 border-green-500'
                case 'Cancelled':
                    return 'bg-red-900/30 text-red-400 border-red-500'
                default:
                    return 'bg-gray-900/30 text-gray-400 border-gray-500'
            }
        } else {
            switch (status) {
                case 'Pending':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-300'
                case 'Processing':
                    return 'bg-blue-100 text-blue-800 border-blue-300'
                case 'Shipped':
                    return 'bg-purple-100 text-purple-800 border-purple-300'
                case 'Delivered':
                    return 'bg-green-100 text-green-800 border-green-300'
                case 'Cancelled':
                    return 'bg-red-100 text-red-800 border-red-300'
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-300'
            }
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending':
                return <FaExclamationTriangle className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
            case 'Processing':
                return <FaCheck className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            case 'Shipped':
                return <FaShippingFast className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />
            case 'Delivered':
                return <FaCheckCircle className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
            case 'Cancelled':
                return <FaTimesCircle className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
            default:
                return <FaCheck className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        }
    }

    const calculateOrderTotals = () => {
        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const shipping = order?.shipping_cost || 0
        const discount = order?.discount_amount || 0
        const total = order?.total_amount || 0

        return { subtotal, shipping, discount, total }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleGoBack = () => {
        navigate('/admin?tab=orders')
    }

    const { subtotal, shipping, discount, total } = calculateOrderTotals()

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4
                        ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}></div>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading order details...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <FaTimesCircle className={`text-6xl mx-auto mb-4 ${isDarkMode ? 'text-red-500' : 'text-red-600'}`} />
                    <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Not Found</h3>
                    <p className={`mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>The order you're looking for doesn't exist.</p>
                    <button
                        onClick={handleGoBack}
                        className={`px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen py-8 transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-white'}`} ref={printRef}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
                >
                    <div>
                        <button
                            onClick={handleGoBack}
                            className={`flex items-center gap-2 mb-4 no-print transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                        >
                            <FaArrowLeft /> Back to Orders
                        </button>
                        <h1 className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent
                            ${isDarkMode ? 'from-cyan-400 to-cyan-300' : 'from-cyan-700 to-cyan-600'}`}>Order Details</h1>
                        <p className={`transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order #{order.order_number}</p>
                        {order.discount_amount > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <FaTags className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                                <span className={`text-sm font-medium transition-colors duration-300
                                    ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    Promo code applied: EGP {parseFloat(order.discount_amount).toFixed(2)} discount
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 no-print">
                        <button
                            onClick={() => {
                                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${encodeURIComponent(`Regarding Your Order #${order.order_number}`)}`;
                                window.open(gmailUrl, '_blank');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                    : 'bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900'}`}
                        >
                            <FaEnvelope /> Email Customer
                        </button>
                        <button
                            onClick={handlePrint}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gray-900 border-cyan-500 text-cyan-400 hover:bg-gray-800'
                                    : 'bg-white border-cyan-700 text-cyan-700 hover:bg-gray-50'}`}
                        >
                            <FaPrint /> Print
                        </button>
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Order Overview */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Order Status Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`rounded-2xl shadow-lg p-6 print-container border transition-colors duration-300
                                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className={`text-xl font-bold mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Status</h2>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </span>
                                        <span className={`text-sm transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Last updated: {formatDate(order.updated_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 no-print">
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(e.target.value)}
                                        disabled={updatingStatus}
                                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gray-800 border-gray-700 text-white focus:ring-cyan-500'
                                                : 'bg-white border-gray-200 text-gray-900 focus:ring-cyan-700'}`}
                                    >
                                        <option value="Pending">⏳ Pending</option>
                                        <option value="Processing">🔧 Processing</option>
                                        <option value="Shipped">🚚 Shipped</option>
                                        <option value="Delivered">✅ Delivered</option>
                                        <option value="Cancelled">❌ Cancelled</option>
                                    </select>
                                    {updatingStatus && (
                                        <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}></div>
                                    )}
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="relative no-print">
                                <div className={`absolute left-0 top-0 h-full w-0.5 transition-colors duration-300
                                    ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                {[
                                    { status: 'Pending', icon: <FaExclamationTriangle /> },
                                    { status: 'Processing', icon: <FaCheck /> },
                                    { status: 'Shipped', icon: <FaShippingFast /> },
                                    { status: 'Delivered', icon: <FaCheckCircle /> }
                                ].map((step, index) => {
                                    const isActive = (() => {
                                        const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered']
                                        const currentIndex = statusOrder.indexOf(order.status)
                                        const stepIndex = statusOrder.indexOf(step.status)
                                        return stepIndex <= currentIndex
                                    })()

                                    return (
                                        <div key={step.status} className="relative pl-8 pb-8 last:pb-0">
                                            <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center
                                                ${isActive
                                                    ? isDarkMode ? 'bg-cyan-500 text-white' : 'bg-cyan-700 text-white'
                                                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {step.icon}
                                            </div>
                                            <div>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isActive
                                                        ? isDarkMode ? 'text-white' : 'text-gray-900'
                                                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    {step.status}
                                                </p>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {step.status === 'Pending' && 'Order received'}
                                                    {step.status === 'Processing' && 'Preparing order'}
                                                    {step.status === 'Shipped' && 'Shipped to customer'}
                                                    {step.status === 'Delivered' && 'Delivered successfully'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>

                        {/* Order Items */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className={`rounded-2xl shadow-lg overflow-hidden print-container border transition-colors duration-300
                                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <div className={`p-6 border-b transition-colors duration-300
                                ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <h2 className={`text-xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Items</h2>
                                <p className={`text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{orderItems.length} items</p>
                            </div>

                            <div className={`divide-y transition-colors duration-300
                                ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                                {orderItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`p-6 transition-colors
                                            ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex gap-4">
                                            <img
                                                src={item.products?.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                                alt={item.product_title}
                                                className={`w-20 h-20 object-cover rounded-lg border no-print transition-colors duration-300
                                                    ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className={`font-medium transition-colors duration-300
                                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.product_title}</h4>
                                                        <p className={`text-sm transition-colors duration-300
                                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.products?.category || 'Uncategorized'}</p>
                                                    </div>
                                                    {/* Stock Level Indicator */}
                                                    {item.products?.stock !== undefined && (
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
                                                            ${item.products.stock < 5
                                                                ? isDarkMode
                                                                    ? 'bg-red-900/30 text-red-400 border-red-500'
                                                                    : 'bg-red-100 text-red-700 border-red-300'
                                                                : item.products.stock < 10
                                                                    ? isDarkMode
                                                                        ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500'
                                                                        : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                                                    : isDarkMode
                                                                        ? 'bg-green-900/30 text-green-400 border-green-500'
                                                                        : 'bg-green-100 text-green-700 border-green-300'
                                                            }`}>
                                                            {item.products.stock < 5 && <FaExclamationCircle className="text-xs" />}
                                                            <span>Stock: {item.products.stock}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className={`transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Qty: {item.quantity}</span>
                                                    <span className={`transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Price: EGP {item.price.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold transition-colors duration-300
                                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>EGP {(item.price * item.quantity).toFixed(2)}</p>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className={`p-6 border-t transition-colors duration-300
                                ${isDarkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</span>
                                        <span className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shipping</span>
                                        <span className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {shipping.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between">
                                            <span className={`flex items-center gap-2 transition-colors duration-300
                                                ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                                <FaTags /> Discount
                                            </span>
                                            <span className={`transition-colors duration-300
                                                ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>-EGP {discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className={`flex justify-between text-lg font-bold pt-3 border-t transition-colors duration-300
                                        ${isDarkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>
                                        <span>Total</span>
                                        <span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}>EGP {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Customer & Order Info */}
                    <div className="space-y-8">
                        {/* Customer Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`rounded-2xl shadow-lg p-6 print-container border transition-colors duration-300
                                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <h2 className={`text-xl font-bold mb-6 transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customer Information</h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg no-print
                                        ${isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                        {order.customer_name?.charAt(0) || customer?.full_name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.customer_name}</h3>
                                        <p className={`text-sm transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{order.customer_email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <FaEnvelope className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                                            <p className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.customer_email}</p>
                                        </div>
                                    </div>

                                    {order.shipping_phone && (
                                        <div className="flex items-center gap-3">
                                            <FaPhone className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone (Shipping)</p>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.shipping_phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {customer?.phone && (
                                        <div className="flex items-center gap-3">
                                            <FaPhone className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone (Account)</p>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{customer.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {customer?.full_name && (
                                        <div className="flex items-center gap-3">
                                            <FaUser className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</p>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{customer.full_name}</p>
                                            </div>
                                        </div>
                                    )}

                                    {order.user_id && (
                                        <div className="flex items-center gap-3">
                                            <FaIdCard className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer ID</p>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>{order.user_id.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Shipping Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className={`rounded-2xl shadow-lg p-6 print-container border transition-colors duration-300
                                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <h2 className={`text-xl font-bold mb-6 transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipping Information</h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className={`mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                    <div>
                                        <p className={`font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipping Address</p>
                                        <p className={`mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{order.shipping_address}</p>
                                        <p className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{order.shipping_city}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <FaTruck className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shipping Method</p>
                                            <p className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Standard Shipping</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <FaTruck className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shipping Cost</p>
                                            <p className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {(order.shipping_cost || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Order Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`rounded-2xl shadow-lg p-6 print-container border transition-colors duration-300
                                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <h2 className={`text-xl font-bold mb-6 transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Information</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <FaIdCard className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order Number</p>
                                            <p className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>{order.order_number}</p>
                                        </div>
                                    </div>
                                    {order.discount_amount > 0 && (
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border
                                            ${isDarkMode ? 'bg-green-900/30 border-green-500' : 'bg-green-100 border-green-300'}`}>
                                            <FaTags className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Discount Applied</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <FaCalendar className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order Date</p>
                                            <p className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(order.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <FaCreditCard className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method</p>
                                            <p className={`font-medium capitalize transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.payment_method}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <FaShoppingBag className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Items</p>
                                            <p className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{orderItems.length} products</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <FaBox className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                        <div>
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order Source</p>
                                            <p className={`font-medium transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.user_id ? 'Registered User' : 'Guest Checkout'}</p>
                                        </div>
                                    </div>

                                    {order.discount_amount > 0 && (
                                        <div className="flex items-center gap-3">
                                            <FaPercent className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discount Applied</p>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>-EGP {order.discount_amount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Notes Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`mt-8 rounded-2xl shadow-lg p-6 no-print border transition-colors duration-300
                        ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-xl font-bold transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Notes</h2>
                        {order.notes && (
                            <span className={`text-sm transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Last updated: {formatDate(order.updated_at)}
                            </span>
                        )}
                    </div>

                    <textarea
                        placeholder="Add notes about this order (e.g., special instructions, customer requests, issues, etc.)..."
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 min-h-[120px] transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 text-white focus:ring-cyan-500 placeholder-gray-500'
                                : 'bg-white border-gray-200 text-gray-900 focus:ring-cyan-700 placeholder-gray-400'}`}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />

                    <div className="flex justify-end items-center mt-4">
                        <div className="flex gap-3">
                            <button
                                onClick={() => setNotes('')}
                                disabled={savingNotes || notes.length === 0}
                                className={`px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isDarkMode
                                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                                        : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                            >
                                Clear
                            </button>
                            <button
                                onClick={saveNotes}
                                disabled={savingNotes || notes === order.notes}
                                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                            >
                                {savingNotes ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaSave />
                                        Save Notes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Print Styles */}
            <style>
                {`
          @media print {
            .no-print {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }
            
            body, .min-h-screen {
              background: white !important;
              color: black !important;
            }
            
            .shadow-lg {
              box-shadow: none !important;
            }
            
            .rounded-2xl, .rounded-lg {
              border-radius: 0 !important;
            }
            
            button, select, textarea, input, .no-print {
              display: none !important;
            }
            
            .border, .border-t, .border-b {
              border: 1px solid #e5e7eb !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .print-container {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Force light theme for print regardless of current theme */
            .bg-black, .bg-gray-900, .bg-gray-800, .bg-gray-700 {
              background: white !important;
            }
            
            .text-white, .text-gray-400, .text-cyan-400 {
              color: black !important;
            }
            
            .border-gray-800, .border-gray-700 {
              border-color: #e5e7eb !important;
            }
          }
        `}
            </style>
        </div>
    )
}