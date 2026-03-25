// adminHelpers.js - Helper functions for admin panel operations
import toast from "react-hot-toast";

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @param {string} format - Format type: 'short', 'long', 'time', 'datetime'
 * @returns {string} Formatted date
 */
export const formatDate = (dateString, format = "short") => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  const options = {
    short: { year: "numeric", month: "short", day: "numeric" },
    long: { year: "numeric", month: "long", day: "numeric" },
    time: { hour: "2-digit", minute: "2-digit" },
    datetime: {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  };

  const selectedOptions = options[format] || options.short;
  return date.toLocaleDateString("en-US", selectedOptions);
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = "EGP") => {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  return `${currency} ${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format order status for display
 * @param {string} status - Order status
 * @returns {Object} Status display info
 */
export const getOrderStatusDisplay = (status) => {
  const statusMap = {
    pending: {
      label: "Pending",
      color: "yellow",
      icon: "⏳",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
    },
    processing: {
      label: "Processing",
      color: "blue",
      icon: "🔧",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
    },
    shipped: {
      label: "Shipped",
      color: "cyan",
      icon: "🚚",
      bgColor: "bg-cyan-100",
      textColor: "text-cyan-800",
    },
    delivered: {
      label: "Delivered",
      color: "green",
      icon: "✅",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
    },
    cancelled: {
      label: "Cancelled",
      color: "red",
      icon: "❌",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
    },
  };

  return (
    statusMap[status?.toLowerCase()] || {
      label: status || "Unknown",
      color: "gray",
      icon: "❓",
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
    }
  );
};

/**
 * Get stock status display
 * @param {number} stock - Stock quantity
 * @returns {Object} Stock status display info
 */
export const getStockStatus = (stock) => {
  if (stock <= 0) {
    return {
      label: "Out of Stock",
      color: "red",
      icon: "❌",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
    };
  } else if (stock < 5) {
    return {
      label: "Critical Stock",
      color: "red",
      icon: "⚠️",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
    };
  } else if (stock < 10) {
    return {
      label: "Low Stock",
      color: "yellow",
      icon: "⚠️",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
    };
  } else {
    return {
      label: "In Stock",
      color: "green",
      icon: "✓",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
    };
  }
};

/**
 * Calculate order statistics
 * @param {Array} orders - Array of orders
 * @returns {Object} Order statistics
 */
export const calculateOrderStats = (orders) => {
  if (!orders || orders.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingCount: 0,
      processingCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      uniqueCustomers: 0,
    };
  }

  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.total_amount || 0),
    0,
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter(
    (o) => o.status === "processing",
  ).length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  const uniqueCustomers = new Set(
    orders.map((o) => o.user_id).filter((id) => id),
  ).size;

  return {
    totalOrders: orders.length,
    totalRevenue,
    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    pendingCount,
    processingCount,
    shippedCount,
    deliveredCount,
    cancelledCount,
    uniqueCustomers,
  };
};

/**
 * Calculate product statistics
 * @param {Array} products - Array of products
 * @returns {Object} Product statistics
 */
export const calculateProductStats = (products) => {
  if (!products || products.length === 0) {
    return {
      totalProducts: 0,
      totalStock: 0,
      lowStockCount: 0,
      criticalStockCount: 0,
      outOfStockCount: 0,
      totalValue: 0,
      averagePrice: 0,
    };
  }

  const totalStock = products.reduce(
    (sum, p) => sum + (parseInt(p.stock) || 0),
    0,
  );
  const lowStockCount = products.filter(
    (p) => (parseInt(p.stock) || 0) > 0 && (parseInt(p.stock) || 0) < 10,
  ).length;
  const criticalStockCount = products.filter(
    (p) => (parseInt(p.stock) || 0) > 0 && (parseInt(p.stock) || 0) < 5,
  ).length;
  const outOfStockCount = products.filter(
    (p) => (parseInt(p.stock) || 0) === 0,
  ).length;
  const totalValue = products.reduce(
    (sum, p) => sum + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0),
    0,
  );
  const averagePrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) /
        products.length
      : 0;

  return {
    totalProducts: products.length,
    totalStock,
    lowStockCount,
    criticalStockCount,
    outOfStockCount,
    totalValue,
    averagePrice,
  };
};

/**
 * Calculate user statistics
 * @param {Array} users - Array of users
 * @param {Array} orders - Array of orders
 * @returns {Object} User statistics
 */
export const calculateUserStats = (users, orders) => {
  if (!users)
    return { totalUsers: 0, activeBuyers: 0, newThisMonth: 0, withPhone: 0 };

  const activeBuyers = new Set(orders?.map((o) => o.user_id).filter((id) => id))
    .size;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newThisMonth = users.filter(
    (u) => new Date(u.created_at) > oneMonthAgo,
  ).length;
  const withPhone = users.filter((u) => u.phone).length;

  return {
    totalUsers: users.length,
    activeBuyers,
    newThisMonth,
    withPhone,
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Egyptian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(010|011|012|015)[0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate order number
 * @returns {string} Order number
 */
export const generateOrderNumber = () => {
  const prefix = "ORD";
  const timestamp = Date.now().toString().slice(-8);
  const random = generateRandomString(4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Calculate discount amount
 * @param {number} total - Total amount
 * @param {number} discountValue - Discount value
 * @param {string} discountType - 'percentage' or 'fixed'
 * @param {number} maxDiscount - Maximum discount amount
 * @returns {number} Discount amount
 */
export const calculateDiscount = (
  total,
  discountValue,
  discountType,
  maxDiscount = null,
) => {
  let discount = 0;

  if (discountType === "percentage") {
    discount = (total * discountValue) / 100;
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = discountValue;
  }

  return Math.min(discount, total);
};

/**
 * Check if promo code is valid
 * @param {Object} promoCode - Promo code object
 * @returns {boolean} Is valid
 */
export const isPromoCodeValid = (promoCode) => {
  if (!promoCode) return false;
  if (!promoCode.is_active) return false;

  const now = new Date();

  if (promoCode.start_date && new Date(promoCode.start_date) > now) {
    return false;
  }

  if (promoCode.end_date && new Date(promoCode.end_date) < now) {
    return false;
  }

  if (
    promoCode.usage_limit &&
    (promoCode.times_used || 0) >= promoCode.usage_limit
  ) {
    return false;
  }

  return true;
};

/**
 * Filter products by search query
 * @param {Array} products - Array of products
 * @param {string} query - Search query
 * @returns {Array} Filtered products
 */
export const filterProductsBySearch = (products, query) => {
  if (!query || query.trim() === "") return products;

  const searchTerm = query.toLowerCase();
  return products.filter(
    (product) =>
      product.title?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.category?.toLowerCase().includes(searchTerm) ||
      product.categories?.name?.toLowerCase().includes(searchTerm),
  );
};

/**
 * Filter orders by search query
 * @param {Array} orders - Array of orders
 * @param {string} query - Search query
 * @returns {Array} Filtered orders
 */
export const filterOrdersBySearch = (orders, query) => {
  if (!query || query.trim() === "") return orders;

  const searchTerm = query.toLowerCase();
  return orders.filter(
    (order) =>
      order.order_number?.toLowerCase().includes(searchTerm) ||
      order.customer_name?.toLowerCase().includes(searchTerm) ||
      order.customer_email?.toLowerCase().includes(searchTerm) ||
      order.customer_phone?.toLowerCase().includes(searchTerm),
  );
};

/**
 * Filter users by search query
 * @param {Array} users - Array of users
 * @param {string} query - Search query
 * @returns {Array} Filtered users
 */
export const filterUsersBySearch = (users, query) => {
  if (!query || query.trim() === "") return users;

  const searchTerm = query.toLowerCase();
  return users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.phone?.toLowerCase().includes(searchTerm) ||
      user.id?.toLowerCase().includes(searchTerm),
  );
};

/**
 * Group orders by status
 * @param {Array} orders - Array of orders
 * @returns {Object} Orders grouped by status
 */
export const groupOrdersByStatus = (orders) => {
  return {
    pending: orders.filter((o) => o.status === "pending"),
    processing: orders.filter((o) => o.status === "processing"),
    shipped: orders.filter((o) => o.status === "shipped"),
    delivered: orders.filter((o) => o.status === "delivered"),
    cancelled: orders.filter((o) => o.status === "cancelled"),
  };
};

/**
 * Group products by category
 * @param {Array} products - Array of products
 * @returns {Object} Products grouped by category
 */
export const groupProductsByCategory = (products) => {
  const grouped = {};
  products.forEach((product) => {
    const category = product.categories?.name || "Uncategorized";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(product);
  });
  return grouped;
};

/**
 * Get top selling products
 * @param {Array} orders - Array of orders
 * @param {number} limit - Number of products to return
 * @returns {Array} Top selling products
 */
export const getTopSellingProducts = (orders, limit = 10) => {
  const productSales = {};

  orders.forEach((order) => {
    if (order.order_items) {
      order.order_items.forEach((item) => {
        const productId = item.product_id;
        const productTitle = item.product_title;
        const quantity = item.quantity;

        if (!productSales[productId]) {
          productSales[productId] = {
            product_id: productId,
            title: productTitle,
            quantity: 0,
            revenue: 0,
          };
        }

        productSales[productId].quantity += quantity;
        productSales[productId].revenue += quantity * parseFloat(item.price);
      });
    }
  });

  return Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};

/**
 * Get sales by date
 * @param {Array} orders - Array of orders
 * @param {number} days - Number of days to look back
 * @returns {Array} Sales by date
 */
export const getSalesByDate = (orders, days = 30) => {
  const sales = {};
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - days);

  // Initialize all dates in range
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    sales[dateStr] = { date: dateStr, total: 0, count: 0 };
  }

  orders.forEach((order) => {
    const orderDate = new Date(order.created_at);
    if (orderDate >= cutoffDate) {
      const dateStr = orderDate.toISOString().split("T")[0];
      if (sales[dateStr]) {
        sales[dateStr].total += parseFloat(order.total_amount || 0);
        sales[dateStr].count++;
      }
    }
  });

  return Object.values(sales).sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
};

/**
 * Export data as CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 */
export const exportToCSV = (data, filename = "export") => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header] || "";
      const escaped = String(value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  toast.success("Export completed successfully!");
};

/**
 * Export data as JSON
 * @param {Object} data - Data to export
 * @param {string} filename - Name of the file
 */
export const exportToJSON = (data, filename = "export") => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  toast.success("Export completed successfully!");
};

/**
 * Create email notification content
 * @param {Object} order - Order object
 * @param {string} newStatus - New order status
 * @returns {Object} Email content
 */
export const createOrderStatusEmail = (order, newStatus) => {
  const statusDisplay = getOrderStatusDisplay(newStatus);
  const statusMessages = {
    pending: "Your order has been received and is awaiting processing.",
    processing:
      "Your order is currently being processed. We're preparing your items for shipment.",
    shipped:
      "Great news! Your order has been shipped and is on its way to you.",
    delivered:
      "Your order has been successfully delivered. Thank you for shopping with us!",
    cancelled:
      "Your order has been cancelled. Please contact us if you have any questions.",
  };

  const nextSteps = {
    pending:
      "• We will notify you when your order starts processing\n• Estimated processing time: 24-48 hours",
    processing:
      "• Your items are being prepared\n• You will receive shipping details soon\n• Estimated shipping time: 3-7 business days",
    shipped:
      "• Track your shipment using the provided tracking number\n• Estimated delivery: Within 3-7 business days\n• Please ensure someone is available to receive the package",
    delivered:
      "• Please inspect your items upon delivery\n• Contact us within 7 days for any issues\n• We hope you enjoy your purchase!",
    cancelled:
      "• Any payments will be refunded within 5-7 business days\n• Contact us for more information\n• We hope to serve you better next time",
  };

  const emailBody = `
📦 ORDER STATUS UPDATE - SportFlex Store

Dear ${order.customer_name},

Your order status has been updated!

===========================================
ORDER INFORMATION
===========================================
📦 Order Number: ${order.order_number}
📋 Status: ${statusDisplay.label}
📅 Order Date: ${formatDate(order.created_at, "long")}
💰 Total Amount: ${formatCurrency(order.total_amount)}
📍 Governorate: ${order.shipping_governorate || "Not specified"}
🚚 Shipping Cost: ${formatCurrency(order.shipping_cost || 0)}

===========================================
STATUS UPDATE DETAILS
===========================================
🔄 Previous Status: ${order.status ? getOrderStatusDisplay(order.status).label : "Pending"}
✅ New Status: ${statusDisplay.label}
⏰ Updated: ${formatDate(new Date(), "datetime")}

${statusMessages[newStatus] || "Your order status has been updated."}

===========================================
NEXT STEPS
===========================================
${nextSteps[newStatus] || "• We will contact you if any action is required"}

Thank you for shopping with us!

Best regards,
SportFlex Store Team
📞 Contact: +021 14082 1819
📧 Email: yousef.hatem.developer@gmail.com
`.trim();

  const subject = `📦 Order #${order.order_number} - Status Updated to ${statusDisplay.label}`;

  return {
    subject,
    body: emailBody,
    to: order.customer_email,
    gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`,
  };
};

/**
 * Validate image file
 * @param {File} file - Image file
 * @returns {Object} Validation result
 */
export const validateImageFile = (file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload JPG, PNG, GIF, or WEBP",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  return { valid: true, error: null };
};

/**
 * Get color class based on stock level
 * @param {number} stock - Stock quantity
 * @param {boolean} isDarkMode - Dark mode flag
 * @returns {string} CSS class
 */
export const getStockColorClass = (stock, isDarkMode = false) => {
  if (stock <= 0) {
    return isDarkMode
      ? "bg-red-900/50 text-red-300"
      : "bg-red-100 text-red-700";
  } else if (stock < 5) {
    return isDarkMode
      ? "bg-red-900/50 text-red-300"
      : "bg-red-100 text-red-700";
  } else if (stock < 10) {
    return isDarkMode
      ? "bg-yellow-900/50 text-yellow-300"
      : "bg-yellow-100 text-yellow-700";
  } else {
    return isDarkMode
      ? "bg-green-900/50 text-green-300"
      : "bg-green-100 text-green-700";
  }
};

/**
 * Get status color class
 * @param {string} status - Status string
 * @param {boolean} isDarkMode - Dark mode flag
 * @returns {string} CSS class
 */
export const getStatusColorClass = (status, isDarkMode = false) => {
  const statusMap = {
    active: isDarkMode
      ? "bg-green-900/50 text-green-300"
      : "bg-green-100 text-green-700",
    inactive: isDarkMode
      ? "bg-gray-700 text-gray-300"
      : "bg-gray-200 text-gray-700",
    pending: isDarkMode
      ? "bg-yellow-900/50 text-yellow-300"
      : "bg-yellow-100 text-yellow-700",
    processing: isDarkMode
      ? "bg-blue-900/50 text-blue-300"
      : "bg-blue-100 text-blue-700",
    shipped: isDarkMode
      ? "bg-cyan-900/50 text-cyan-300"
      : "bg-cyan-100 text-cyan-700",
    delivered: isDarkMode
      ? "bg-green-900/50 text-green-300"
      : "bg-green-100 text-green-700",
    cancelled: isDarkMode
      ? "bg-red-900/50 text-red-300"
      : "bg-red-100 text-red-700",
  };

  return (
    statusMap[status?.toLowerCase()] ||
    (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700")
  );
};

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
};

/**
 * Sort array by field
 * @param {Array} array - Array to sort
 * @param {string} field - Field to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortByField = (array, field, order = "asc") => {
  if (!array) return [];

  return [...array].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (order === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

/**
 * Get unique values from array by field
 * @param {Array} array - Array of objects
 * @param {string} field - Field to get unique values from
 * @returns {Array} Unique values
 */
export const getUniqueValues = (array, field) => {
  if (!array) return [];
  return [...new Set(array.map((item) => item[field]).filter(Boolean))];
};

/**
 * Generate report summary
 * @param {Object} data - Report data
 * @returns {Object} Report summary
 */
export const generateReportSummary = (data) => {
  const { products = [], orders = [], users = [], categories = [] } = data;

  const productStats = calculateProductStats(products);
  const orderStats = calculateOrderStats(orders);
  const userStats = calculateUserStats(users, orders);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts: productStats.totalProducts,
      totalStock: productStats.totalStock,
      lowStockCount: productStats.lowStockCount,
      outOfStockCount: productStats.outOfStockCount,
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
      averageOrderValue: orderStats.averageOrderValue,
      totalUsers: userStats.totalUsers,
      activeBuyers: userStats.activeBuyers,
      totalCategories: categories.length,
    },
    alerts: {
      lowStock: productStats.lowStockCount,
      criticalStock: productStats.criticalStockCount,
      pendingOrders: orderStats.pendingCount,
    },
  };
};
