// Admin.jsx - FIXED VERSION WITH CATEGORY FIELD
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FaBox, FaUsers, FaShoppingCart, FaChartLine, FaCog,
    FaSignOutAlt, FaPlus, FaEdit, FaTrash, FaEye,
    FaSpinner, FaCheck, FaTimes, FaTags, FaTag,
    FaImage, FaTimesCircle, FaShoppingBag, FaTruck,
    FaMoneyBillWave, FaMapMarkerAlt, FaGlobeAfrica,
    FaEnvelope, FaUserCheck
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [shippingCosts, setShippingCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalUsersOrdered: 0 // New stat for users who ordered
    });

    // Form states for products
    const [productForm, setProductForm] = useState({
        title: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        image_url: '', // Main image URL
        additionalImages: [] // Array for additional images
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);

    // Form states for categories
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: '',
        image_url: '',
        is_active: true
    });
    const [editingCategory, setEditingCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Form states for shipping costs
    const [shippingForm, setShippingForm] = useState({
        governorate: '',
        governorate_ar: '',
        cost: '',
        delivery_days: 3,
        is_active: true,
        notes: ''
    });
    const [editingShipping, setEditingShipping] = useState(null);
    const [showShippingModal, setShowShippingModal] = useState(false);

    const navigate = useNavigate();

    // Check admin authentication
    useEffect(() => {
        checkAdminAccess();
        loadInitialData();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

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

            if (error) {
                console.error('Admin check error:', error);
            }

            if (!adminRole) {
                toast.error('Unauthorized access. Admin privileges required.');
                navigate('/');
                return;
            }

        } catch (error) {
            console.error('Admin access check error:', error);
        }
    };

    const loadInitialData = async () => {
        try {
            setIsInitializing(true);

            // Load all data in parallel
            const [productsData, categoriesData, ordersData, usersData, shippingData] = await Promise.all([
                fetchProductsWithImages(),
                fetchCategories(),
                fetchOrders(),
                fetchUsers(),
                fetchShippingCosts()
            ]);

            setProducts(productsData);
            setCategories(categoriesData);
            setOrders(ordersData);
            setUsers(usersData);
            setShippingCosts(shippingData);

            calculateStats(productsData, categoriesData, ordersData, usersData);

        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsInitializing(false);
        }
    };

    const fetchProductsWithImages = async () => {
        try {
            // First get products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;

            // Then get images for each product
            const productsWithImages = await Promise.all(
                products.map(async (product) => {
                    const { data: images, error: imagesError } = await supabase
                        .from('product_images')
                        .select('*')
                        .eq('product_id', product.id)
                        .order('display_order', { ascending: true });

                    if (imagesError) throw imagesError;

                    return {
                        ...product,
                        images: images || []
                    };
                })
            );

            return productsWithImages || [];
        } catch (error) {
            console.error('Error fetching products with images:', error);
            toast.error('Failed to load products');
            return [];
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            return [];
        }
    };

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        product_title,
                        quantity,
                        price
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
            return [];
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
            return [];
        }
    };

    const fetchShippingCosts = async () => {
        try {
            const { data, error } = await supabase
                .from('shipping_costs')
                .select('*')
                .order('governorate');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching shipping costs:', error);
            toast.error('Failed to load shipping costs');
            return [];
        }
    };

    const calculateStats = async (productsData, categoriesData, ordersData, usersData) => {
        const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        // Get unique users who have placed orders
        const uniqueUserIds = new Set();
        ordersData.forEach(order => {
            if (order.user_id) {
                uniqueUserIds.add(order.user_id);
            }
        });
        const totalUsersOrdered = uniqueUserIds.size;

        setStats({
            totalProducts: productsData.length,
            totalCategories: categoriesData.length,
            totalOrders: ordersData.length,
            totalUsers: usersData.length,
            totalRevenue: totalRevenue,
            totalUsersOrdered: totalUsersOrdered
        });
    };

    // GMAIL INTEGRATION FOR ORDER STATUS UPDATES
    const sendStatusUpdateEmail = (order, newStatus) => {
        // Create formatted email content
        const emailBody = `
Dear ${order.customer_name},

Your order status has been updated!

===========================================
ORDER DETAILS
===========================================
📦 Order Number: ${order.order_number}
📋 Status: ${getStatusWithEmoji(newStatus)}
📅 Order Date: ${formatDate(order.created_at)}
💰 Total Amount: EGP ${parseFloat(order.total_amount).toFixed(2)}
📍 Governorate: ${order.shipping_governorate || 'Not specified'}
📦 Shipping Cost: EGP ${parseFloat(order.shipping_cost || 0).toFixed(2)}

===========================================
STATUS UPDATE DETAILS
===========================================
🔄 Previous Status: ${order.status || 'Pending'}
✅ New Status: ${newStatus}
⏰ Updated: ${new Date().toLocaleString()}

${getStatusMessage(newStatus)}

===========================================
NEXT STEPS
===========================================
${getNextSteps(newStatus)}

===========================================
CONTACT INFORMATION
===========================================
📧 Customer Email: ${order.customer_email}
📱 Customer Phone: ${order.customer_phone || 'Not provided'}
🏢 Shipping Address: ${order.shipping_address || 'Not specified'}

===========================================
IMPORTANT NOTES
===========================================
• Please keep this order number for reference
• Contact us if you have any questions
• Thank you for shopping with us!

Best regards,
SportFlex Store Team
📞 Contact: +021 14082 1819
📧 Email: yousef.hatem.developer@gmail.com
        `.trim();

        // Encode the email content
        const encodedSubject = encodeURIComponent(`📦 Order #${order.order_number} - Status Updated to ${newStatus}`);
        const encodedBody = encodeURIComponent(emailBody);

        // Create Gmail compose URL
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${encodedSubject}&body=${encodedBody}`;

        // Open Gmail in new tab
        window.open(gmailUrl, '_blank');
    };

    // Helper functions for email content
    const getStatusWithEmoji = (status) => {
        const statusMap = {
            'Pending': '⏳ Pending',
            'Processing': '🔧 Processing',
            'Shipped': '🚚 Shipped',
            'Delivered': '✅ Delivered',
            'Cancelled': '❌ Cancelled'
        };
        return statusMap[status] || status;
    };

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

    // UPDATED ORDER STATUS HANDLER
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            // Find the order
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                toast.error('Order not found');
                return;
            }

            // Update order status in database
            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            // Show success message
            toast.success(`Order status updated to ${newStatus}`);

            // Open Gmail with status update email
            sendStatusUpdateEmail(order, newStatus);

        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order status');
        }
    };

    // SHIPPING COST FUNCTIONS
    const handleShippingSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const shippingData = {
                governorate: shippingForm.governorate,
                governorate_ar: shippingForm.governorate_ar,
                cost: parseFloat(shippingForm.cost),
                delivery_days: parseInt(shippingForm.delivery_days),
                is_active: shippingForm.is_active,
                notes: shippingForm.notes,
                updated_at: new Date().toISOString(),
            };

            if (editingShipping) {
                const { data, error } = await supabase
                    .from('shipping_costs')
                    .update(shippingData)
                    .eq('id', editingShipping.id)
                    .select()
                    .single();

                if (error) throw error;

                setShippingCosts(shippingCosts.map(s => s.id === editingShipping.id ? data : s));
                toast.success('Shipping cost updated successfully');
            } else {
                shippingData.created_by = session.user.id;

                const { data, error } = await supabase
                    .from('shipping_costs')
                    .insert([shippingData])
                    .select()
                    .single();

                if (error) throw error;

                setShippingCosts([data, ...shippingCosts]);
                toast.success('Shipping cost added successfully');
            }

            resetShippingForm();
            setShowShippingModal(false);

        } catch (error) {
            console.error('Error saving shipping cost:', error);
            toast.error(error.message || 'Failed to save shipping cost');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditShipping = (shipping) => {
        setEditingShipping(shipping);
        setShippingForm({
            governorate: shipping.governorate,
            governorate_ar: shipping.governorate_ar || '',
            cost: shipping.cost,
            delivery_days: shipping.delivery_days || 3,
            is_active: shipping.is_active,
            notes: shipping.notes || ''
        });
        setShowShippingModal(true);
    };

    const handleDeleteShipping = async (shippingId) => {
        if (!window.confirm('Are you sure you want to delete this shipping cost?')) return;

        try {
            const { error } = await supabase
                .from('shipping_costs')
                .delete()
                .eq('id', shippingId);

            if (error) throw error;

            setShippingCosts(shippingCosts.filter(s => s.id !== shippingId));
            toast.success('Shipping cost deleted successfully');
        } catch (error) {
            console.error('Error deleting shipping cost:', error);
            toast.error('Failed to delete shipping cost');
        }
    };

    const resetShippingForm = () => {
        setShippingForm({
            governorate: '',
            governorate_ar: '',
            cost: '',
            delivery_days: 3,
            is_active: true,
            notes: ''
        });
        setEditingShipping(null);
    };

    // PRODUCT FUNCTIONS WITH MULTIPLE IMAGES SUPPORT AND EDIT INTEGRATION
    // Helper function to get category name
    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'Uncategorized';
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Uncategorized';
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Get category name for the category column
            const categoryName = getCategoryName(productForm.category_id);

            const productData = {
                title: productForm.title,
                description: productForm.description,
                price: parseFloat(productForm.price),
                category_id: productForm.category_id || null,
                category: categoryName,
                stock: parseInt(productForm.stock),
                image_url: productForm.image_url,
                updated_at: new Date().toISOString(),
            };

            let savedProduct;

            if (editingProduct) {
                const { data, error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id)
                    .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                    .single();

                if (error) throw error;
                savedProduct = data;

                // Handle additional images for existing product
                await handleProductImages(editingProduct.id);
            } else {
                productData.created_by = session.user.id;

                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                    .single();

                if (error) throw error;
                savedProduct = data;

                // Handle additional images for new product
                await handleProductImages(savedProduct.id);
            }

            // Refresh product with images
            const updatedProduct = await fetchProductWithImages(savedProduct.id);

            if (editingProduct) {
                setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
                toast.success('Product updated successfully');
            } else {
                setProducts([updatedProduct, ...products]);
                toast.success('Product added successfully');
            }

            resetProductForm();
            setShowProductModal(false);

        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product. ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Update the handleProductImages function - fix the upsert issue
    const handleProductImages = async (productId) => {
        try {
            // First, delete existing additional images (keep main image if it exists)
            const { error: deleteError } = await supabase
                .from('product_images')
                .delete()
                .eq('product_id', productId);

            if (deleteError) throw deleteError;

            // First, ensure main image is in product_images table
            if (productForm.image_url) {
                const { error: insertMainError } = await supabase
                    .from('product_images')
                    .insert({
                        product_id: productId,
                        image_url: productForm.image_url,
                        display_order: 0,
                        alt_text: productForm.title
                    });

                if (insertMainError) throw insertMainError;
            }

            // Then, add new additional images
            if (productForm.additionalImages.length > 0) {
                const imagesToInsert = productForm.additionalImages.map((imageUrl, index) => ({
                    product_id: productId,
                    image_url: imageUrl,
                    display_order: index + 1, // Start from 1 (0 is for main image)
                    alt_text: productForm.title
                }));

                const { error: insertError } = await supabase
                    .from('product_images')
                    .insert(imagesToInsert);

                if (insertError) throw insertError;
            }
        } catch (error) {
            console.error('Error handling product images:', error);
            throw error;
        }
    };
    const fetchProductWithImages = async (productId) => {
        try {
            // Get product
            const { data: product, error: productError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .eq('id', productId)
                .single();

            if (productError) throw productError;

            // Get images
            const { data: images, error: imagesError } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('display_order', { ascending: true });

            if (imagesError) throw imagesError;

            return {
                ...product,
                images: images || []
            };
        } catch (error) {
            console.error('Error fetching product with images:', error);
            throw error;
        }
    };

    const handleEditProduct = async (product) => {
        try {
            setEditingProduct(product);

            // Get product images
            const { data: images, error } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', product.id)
                .order('display_order', { ascending: true });

            if (error) throw error;

            // Find main image (display_order = 0) and additional images
            const mainImage = images?.find(img => img.display_order === 0);
            const additionalImages = images?.filter(img => img.display_order > 0).map(img => img.image_url) || [];

            setProductForm({
                title: product.title,
                description: product.description,
                price: product.price,
                category_id: product.category_id || '',
                stock: product.stock,
                image_url: mainImage?.image_url || product.image_url || '',
                additionalImages: additionalImages
            });

            setShowProductModal(true);
        } catch (error) {
            console.error('Error loading product for edit:', error);
            toast.error('Failed to load product data');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product? All associated images will also be deleted.')) return;

        try {
            // Delete associated images first
            const { error: imagesError } = await supabase
                .from('product_images')
                .delete()
                .eq('product_id', productId);

            if (imagesError) throw imagesError;

            // Delete product
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            setProducts(products.filter(p => p.id !== productId));
            calculateStats(products.filter(p => p.id !== productId), categories, orders, users);
            toast.success('Product deleted successfully');
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    // CATEGORY FUNCTIONS WITH EDIT INTEGRATION
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const categoryData = {
                name: categoryForm.name,
                description: categoryForm.description,
                image_url: categoryForm.image_url,
                is_active: categoryForm.is_active,
                updated_at: new Date().toISOString(),
            };

            let savedCategory;

            if (editingCategory) {
                const { data, error } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', editingCategory.id)
                    .select()
                    .single();

                if (error) throw error;
                savedCategory = data;

                // Update products that reference this category
                await updateProductsCategory(editingCategory.id, savedCategory.name);

                setCategories(categories.map(c => c.id === editingCategory.id ? savedCategory : c));
                toast.success('Category updated successfully');
            } else {
                categoryData.created_by = session.user.id;

                const { data, error } = await supabase
                    .from('categories')
                    .insert([categoryData])
                    .select()
                    .single();

                if (error) throw error;
                savedCategory = data;

                setCategories([savedCategory, ...categories]);
                toast.success('Category added successfully');
            }

            resetCategoryForm();
            setShowCategoryModal(false);

        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.message || 'Failed to save category');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to update products when category is edited
    const updateProductsCategory = async (categoryId, categoryName) => {
        try {
            // Update both category_id and category columns
            const { error } = await supabase
                .from('products')
                .update({
                    category: categoryName,
                    updated_at: new Date().toISOString()
                })
                .eq('category_id', categoryId);

            if (error) throw error;

            // Update local state
            setProducts(products.map(p =>
                p.category_id === categoryId
                    ? {
                        ...p,
                        category: categoryName,
                        categories: { id: categoryId, name: categoryName }
                    }
                    : p
            ));

        } catch (error) {
            console.error('Error updating products category:', error);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            description: category.description || '',
            image_url: category.image_url || '',
            is_active: category.is_active
        });
        setShowCategoryModal(true);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category? Products using this category will have their category set to null.')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;

            setCategories(categories.filter(c => c.id !== categoryId));

            // Update products that were using this category
            // Update both category_id and category columns
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    category_id: null,
                    category: 'Uncategorized',
                    updated_at: new Date().toISOString()
                })
                .eq('category_id', categoryId);

            if (updateError) throw updateError;

            setProducts(products.map(p =>
                p.category_id === categoryId ? { ...p, category_id: null, category: 'Uncategorized', categories: null } : p
            ));

            calculateStats(products, categories.filter(c => c.id !== categoryId), orders, users);
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    const resetProductForm = () => {
        setProductForm({
            title: '',
            description: '',
            price: '',
            category_id: '',
            stock: '',
            image_url: '',
            additionalImages: []
        });
        setEditingProduct(null);
    };

    const resetCategoryForm = () => {
        setCategoryForm({
            name: '',
            description: '',
            image_url: '',
            is_active: true
        });
        setEditingCategory(null);
    };

    // IMAGE HANDLING FUNCTIONS
    const addAdditionalImage = () => {
        const newImage = prompt('Enter image URL:');
        if (newImage && newImage.trim() !== '') {
            setProductForm({
                ...productForm,
                additionalImages: [...productForm.additionalImages, newImage.trim()]
            });
        }
    };

    const removeAdditionalImage = (index) => {
        const newImages = [...productForm.additionalImages];
        newImages.splice(index, 1);
        setProductForm({
            ...productForm,
            additionalImages: newImages
        });
    };

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

    // RENDER FUNCTIONS
    const renderDashboard = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                {[
                    { title: 'Total Products', value: stats.totalProducts, icon: <FaBox />, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                    { title: 'Categories', value: stats.totalCategories, icon: <FaTags />, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                    { title: 'Total Orders', value: stats.totalOrders, icon: <FaShoppingCart />, color: 'bg-gradient-to-r from-green-500 to-green-600' },
                    { title: 'Total Users', value: stats.totalUsers, icon: <FaUsers />, color: 'bg-gradient-to-r from-pink-500 to-pink-600' },
                    { title: 'Users Ordered', value: stats.totalUsersOrdered, icon: <FaUserCheck />, color: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
                    { title: 'Revenue', value: `EGP ${stats.totalRevenue.toFixed(2)}`, icon: <FaChartLine />, color: 'bg-gradient-to-r from-orange-500 to-orange-600' }
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`${stat.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">{stat.title}</p>
                                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                            </div>
                            <div className="text-3xl opacity-80">
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Order Number</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Governorate</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Date</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 5).map((order) => (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{order.order_number}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{order.customer_name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{order.shipping_governorate || 'Not specified'}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">EGP {parseFloat(order.total_amount).toFixed(2)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                            order.status === 'Processing' || order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );

    const renderProducts = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Product Management</h3>
                <button
                    onClick={() => {
                        resetProductForm();
                        setShowProductModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300"
                >
                    <FaPlus /> Add Product
                </button>
            </div>

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowProductModal(false);
                                        resetProductForm();
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <FaTimes className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleProductSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Product Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={productForm.title}
                                            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter product title"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price (EGP) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter price"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={productForm.category_id}
                                            onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stock Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter stock quantity"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Main Image URL *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={productForm.image_url}
                                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter product description"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Additional Images
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addAdditionalImage}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            + Add Image URL
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {productForm.additionalImages.map((image, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <input
                                                    type="url"
                                                    value={image}
                                                    onChange={(e) => {
                                                        const newImages = [...productForm.additionalImages];
                                                        newImages[index] = e.target.value;
                                                        setProductForm({ ...productForm, additionalImages: newImages });
                                                    }}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAdditionalImage(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <FaTimesCircle />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowProductModal(false);
                                            resetProductForm();
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingProduct ? 'Update Product' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}

            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'}
                                    alt={product.title}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                    }}
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button
                                        onClick={() => handleEditProduct(product)}
                                        className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        <FaEdit className="text-blue-500" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        <FaTrash className="text-red-500" />
                                    </button>
                                </div>
                                {product.images?.length > 0 && (
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                                            <FaImage /> {product.images.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <h4 className="font-bold text-lg text-gray-800 truncate">{product.title}</h4>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
                                <div className="flex justify-between items-center mt-4">
                                    <div>
                                        <p className="text-blue-600 font-bold">EGP {parseFloat(product.price).toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{product.categories?.name || 'Uncategorized'}</p>
                                        <p className="text-xs text-gray-400">Sales: {product.sales || 0}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Created: {formatDate(product.created_at)}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );

    const renderCategories = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Category Management</h3>
                <button
                    onClick={() => {
                        resetCategoryForm();
                        setShowCategoryModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                >
                    <FaTag /> Add Category
                </button>
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        resetCategoryForm();
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <FaTimes className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter category name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter category description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image URL
                                    </label>
                                    <input
                                        type="url"
                                        value={categoryForm.image_url}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={categoryForm.is_active}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="is_active" className="text-sm text-gray-700">
                                        Active Category
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            resetCategoryForm();
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingCategory ? 'Update Category' : 'Add Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}

            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={category.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'}
                                    alt={category.name}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button
                                        onClick={() => handleEditCategory(category)}
                                        className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        <FaEdit className="text-blue-500" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        <FaTrash className="text-red-500" />
                                    </button>
                                </div>
                                <div className="absolute bottom-3 left-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {category.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="font-bold text-lg text-gray-800 truncate">{category.name}</h4>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{category.description}</p>
                                <div className="mt-4">
                                    <p className="text-xs text-gray-400">
                                        Created: {formatDate(category.created_at)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );

    const renderShipping = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Shipping Cost Management</h3>
                <button
                    onClick={() => {
                        resetShippingForm();
                        setShowShippingModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-300"
                >
                    <FaTruck /> Add Shipping Cost
                </button>
            </div>

            {/* Shipping Modal */}
            {showShippingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editingShipping ? 'Edit Shipping Cost' : 'Add Shipping Cost'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowShippingModal(false);
                                        resetShippingForm();
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <FaTimes className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleShippingSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Governorate (English) *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingForm.governorate}
                                            onChange={(e) => setShippingForm({ ...shippingForm, governorate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Cairo"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Governorate (Arabic)
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingForm.governorate_ar}
                                            onChange={(e) => setShippingForm({ ...shippingForm, governorate_ar: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-arabic"
                                            placeholder="القاهرة"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cost (EGP) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={shippingForm.cost}
                                            onChange={(e) => setShippingForm({ ...shippingForm, cost: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="30.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Delivery Days *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={shippingForm.delivery_days}
                                            onChange={(e) => setShippingForm({ ...shippingForm, delivery_days: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="3"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={shippingForm.notes}
                                        onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Additional notes about this shipping area"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="shipping_active"
                                        checked={shippingForm.is_active}
                                        onChange={(e) => setShippingForm({ ...shippingForm, is_active: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <label htmlFor="shipping_active" className="text-sm text-gray-700">
                                        Active Shipping Area
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowShippingModal(false);
                                            resetShippingForm();
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingShipping ? 'Update Shipping' : 'Add Shipping'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}

            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-orange-50 to-yellow-50">
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Governorate (English)</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Governorate (Arabic)</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Cost (EGP)</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Delivery Days</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shippingCosts.map((shipping) => (
                                    <tr key={shipping.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-800">{shipping.governorate}</td>
                                        <td className="py-4 px-6 text-sm text-gray-600 font-arabic">{shipping.governorate_ar || '-'}</td>
                                        <td className="py-4 px-6 text-sm text-gray-600">EGP {parseFloat(shipping.cost).toFixed(2)}</td>
                                        <td className="py-4 px-6 text-sm text-gray-600">{shipping.delivery_days} days</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${shipping.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {shipping.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditShipping(shipping)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteShipping(shipping.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <FaTrash />
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

    const renderOrders = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Order Management</h3>
                <div className="text-sm text-gray-600">
                    <span className="font-medium">Users who ordered: {stats.totalUsersOrdered}</span>
                </div>
            </div>

            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-50 to-teal-50">
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Order #</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Customer</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Governorate</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Date</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Amount</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-4 px-6 text-sm font-medium text-gray-800">
                                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                                #{order.order_number}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            <div className="font-medium">{order.customer_name}</div>
                                            <div className="text-xs text-gray-500">{order.customer_email}</div>
                                            <div className="text-xs text-gray-500">{order.customer_phone || 'No phone'}</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {order.shipping_governorate || 'Not specified'}
                                            {order.shipping_cost && (
                                                <div className="text-xs text-gray-500">
                                                    EGP {parseFloat(order.shipping_cost).toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-800">
                                            EGP {parseFloat(order.total_amount).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={order.status || 'Pending'}
                                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                    className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                                >
                                                    <option value="Pending">⏳ Pending</option>
                                                    <option value="Processing">🔧 Processing</option>
                                                    <option value="Shipped">🚚 Shipped</option>
                                                    <option value="Delivered">✅ Delivered</option>
                                                    <option value="Cancelled">❌ Cancelled</option>
                                                </select>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'Processing' || order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </div>

                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/order/${order.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Open Gmail for direct contact
                                                        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${encodeURIComponent(`Regarding Your Order #${order.order_number}`)}`;
                                                        window.open(gmailUrl, '_blank');
                                                    }}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                    title="Email Customer"
                                                >
                                                    <FaEnvelope />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );

    const renderUsers = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <h3 className="text-xl font-bold text-gray-800">User Management</h3>
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <div key={user.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{user.full_name || 'No Name'}</h4>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                    {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Joined</p>
                                    <p className="font-medium">{formatDate(user.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Phone</p>
                                    <p className="font-medium">{user.phone || 'Not set'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );

    // Update sidebar navigation
    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
        { id: 'products', label: 'Products', icon: <FaBox /> },
        { id: 'categories', label: 'Categories', icon: <FaTags /> },
        { id: 'shipping', label: 'Shipping Costs', icon: <FaTruck /> },
        { id: 'orders', label: 'Orders', icon: <FaShoppingCart /> },
        { id: 'users', label: 'Users', icon: <FaUsers /> },
    ];

    // Update the main content render
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return renderDashboard();
            case 'products': return renderProducts();
            case 'categories': return renderCategories();
            case 'shipping': return renderShipping();
            case 'orders': return renderOrders();
            case 'users': return renderUsers();
            default: return renderDashboard();
        }
    };

    if (isInitializing && activeTab === 'dashboard') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-teal-50/30 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-teal-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="lg:w-64">
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl">
                                <h2 className="text-xl font-bold">Admin Panel</h2>
                                <p className="text-sm opacity-90 mt-1">SportFlex Store Team Store</p>
                            </div>
                            <nav className="space-y-2">
                                {sidebarItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                                            ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
}