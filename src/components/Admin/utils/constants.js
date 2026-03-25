// utils/constants.js - Constants and configuration
export const ADMIN_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "FaChartLine" },
  { id: "products", label: "Products", icon: "FaBox" },
  { id: "categories", label: "Categories", icon: "FaTags" },
  { id: "shipping", label: "Shipping", icon: "FaTruck" },
  { id: "offers", label: "Special Offers", icon: "FaGift" },
  { id: "promocodes", label: "Promo Codes", icon: "FaTicketAlt" },
  { id: "orders", label: "Orders", icon: "FaShoppingCart" },
  { id: "users", label: "Users", icon: "FaUsers" },
];

export const ORDER_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const STATUS_MESSAGES = {
  [ORDER_STATUSES.PENDING]:
    "Your order has been received and is awaiting processing.",
  [ORDER_STATUSES.PROCESSING]:
    "Your order is currently being processed. We're preparing your items for shipment.",
  [ORDER_STATUSES.SHIPPED]:
    "Great news! Your order has been shipped and is on its way to you.",
  [ORDER_STATUSES.DELIVERED]:
    "Your order has been successfully delivered. Thank you for shopping with us!",
  [ORDER_STATUSES.CANCELLED]:
    "Your order has been cancelled. Please contact us if you have any questions.",
};

export const NEXT_STEPS = {
  [ORDER_STATUSES.PENDING]:
    "• We will notify you when your order starts processing\n• Estimated processing time: 24-48 hours",
  [ORDER_STATUSES.PROCESSING]:
    "• Your items are being prepared\n• You will receive shipping details soon\n• Estimated shipping time: 3-7 business days",
  [ORDER_STATUSES.SHIPPED]:
    "• Track your shipment using the provided tracking number\n• Estimated delivery: Within 3-7 business days\n• Please ensure someone is available to receive the package",
  [ORDER_STATUSES.DELIVERED]:
    "• Please inspect your items upon delivery\n• Contact us within 7 days for any issues\n• We hope you enjoy your purchase!",
  [ORDER_STATUSES.CANCELLED]:
    "• Any payments will be refunded within 5-7 business days\n• Contact us for more information\n• We hope to serve you better next time",
};

export const IMAGE_UPLOAD_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["jpg", "jpeg", "png", "gif", "webp"],
  FOLDERS: {
    PRODUCTS: "products",
    CATEGORIES: "categories",
    ADDITIONAL: "products/additional",
  },
};

export const PRODUCT_FILTERS = {
  ALL: "all",
  IN_STOCK: "in-stock",
  LOW_STOCK: "low-stock",
  CRITICAL_STOCK: "critical-stock",
  OUT_OF_STOCK: "out-of-stock",
};

export const ORDER_FILTERS = {
  ALL: "all",
  PENDING: ORDER_STATUSES.PENDING,
  PROCESSING: ORDER_STATUSES.PROCESSING,
  SHIPPED: ORDER_STATUSES.SHIPPED,
  DELIVERED: ORDER_STATUSES.DELIVERED,
  CANCELLED: ORDER_STATUSES.CANCELLED,
};

export const USER_FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
  WITH_PHONE: "with-phone",
  WITHOUT_PHONE: "without-phone",
};
